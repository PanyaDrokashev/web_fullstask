"use client";

import { useEffect, useRef, useState } from "react";

import { IArticlePart } from "@/shared/types/content";

interface Props {
  value: IArticlePart[];
  onChange: (value: IArticlePart[]) => void;
}

function blocksToHtml(blocks: IArticlePart[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading":
          return `<h3>${block.content ?? ""}</h3>`;
        case "image":
          return block.content
            ? `<p><img src="${block.content}" alt="" /></p>`
            : "";
        case "list": {
          const items = (block.items ?? [])
            .map((item) =>
              typeof item === "string"
                ? `<li>${item}</li>`
                : `<li>${item.text ?? item.heading ?? ""}</li>`,
            )
            .join("");
          return `<ul>${items}</ul>`;
        }
        case "ordered-list": {
          const items = (block.items ?? [])
            .map((item) =>
              typeof item === "string"
                ? `<li>${item}</li>`
                : `<li>${item.text ?? item.heading ?? ""}</li>`,
            )
            .join("");
          return `<ol>${items}</ol>`;
        }
        case "text":
        default:
          return `<p>${block.content ?? ""}</p>`;
      }
    })
    .join("");
}

function htmlToBlocks(html: string): IArticlePart[] {
  if (!html.trim()) {
    return [];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const blocks: IArticlePart[] = [];

  const toTextBlock = (text: string) => {
    const trimmed = text.trim();
    if (trimmed) {
      blocks.push({ type: "text", content: trimmed });
    }
  };

  doc.body.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      toTextBlock(node.textContent ?? "");
      return;
    }

    if (!(node instanceof HTMLElement)) {
      return;
    }

    const tag = node.tagName.toUpperCase();

    if (tag === "H1" || tag === "H2" || tag === "H3" || tag === "H4" || tag === "H5" || tag === "H6") {
      const headingText = (node.innerText ?? "").trim();
      if (headingText) {
        blocks.push({ type: "heading", content: headingText });
      }
      return;
    }

    if (tag === "UL" || tag === "OL") {
      const items = Array.from(node.querySelectorAll("li"))
        .map((li) => (li.textContent ?? "").trim())
        .filter(Boolean);

      if (items.length > 0) {
        blocks.push({
          type: tag === "OL" ? "ordered-list" : "list",
          items,
        });
      }
      return;
    }

    if (tag === "IMG") {
      const src = node.getAttribute("src")?.trim();
      if (src) {
        blocks.push({ type: "image", content: src });
      }
      return;
    }

    const image = node.querySelector("img");
    if (image) {
      const src = image.getAttribute("src")?.trim();
      if (src) {
        blocks.push({ type: "image", content: src });
      }
      return;
    }

    const content = node.innerHTML.trim();
    if (content && content !== "<br>") {
      blocks.push({ type: "text", content });
    }
  });

  return blocks;
}

export default function WysiwygBlocksEditor({ value, onChange }: Props) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const lastEmittedRef = useRef("");
  const [isEmpty, setIsEmpty] = useState(true);
  const [formatState, setFormatState] = useState({
    bold: false,
    italic: false,
    underline: false,
    heading: false,
    unorderedList: false,
    orderedList: false,
  });

  useEffect(() => {
    const initialHtml = blocksToHtml(value);
    if (editorRef.current) {
      editorRef.current.innerHTML = initialHtml;
      setIsEmpty((editorRef.current.innerText ?? "").trim().length === 0);
    }
    lastEmittedRef.current = JSON.stringify(value);
  }, []);

  useEffect(() => {
    const incoming = JSON.stringify(value);
    if (incoming === lastEmittedRef.current) {
      return;
    }

    if (editorRef.current) {
      editorRef.current.innerHTML = blocksToHtml(value);
      setIsEmpty((editorRef.current.innerText ?? "").trim().length === 0);
    }
    lastEmittedRef.current = incoming;
  }, [value]);

  const emitChange = () => {
    const nextHtml = editorRef.current?.innerHTML ?? "";
    const nextBlocks = htmlToBlocks(nextHtml);
    lastEmittedRef.current = JSON.stringify(nextBlocks);
    setIsEmpty((editorRef.current?.innerText ?? "").trim().length === 0);
    onChange(nextBlocks);
  };

  const refreshFormatState = () => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const anchorNode = selection.anchorNode;
    if (!anchorNode) {
      return;
    }

    const anchorElement =
      anchorNode.nodeType === Node.ELEMENT_NODE
        ? (anchorNode as HTMLElement)
        : anchorNode.parentElement;

    if (!anchorElement || !editor.contains(anchorElement)) {
      return;
    }

    const formatValue = (document.queryCommandValue("formatBlock") || "")
      .toString()
      .toLowerCase()
      .replace(/[<>]/g, "");

    setFormatState({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      heading: formatValue === "h3",
      unorderedList: document.queryCommandState("insertUnorderedList"),
      orderedList: document.queryCommandState("insertOrderedList"),
    });
  };

  const runCommand = (command: string, valueArg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, valueArg);
    emitChange();
    refreshFormatState();
  };

  const addImage = () => {
    const imageUrl = window.prompt("Ссылка на изображение");
    if (!imageUrl) {
      return;
    }
    runCommand("insertImage", imageUrl);
  };

  useEffect(() => {
    const handleSelection = () => {
      refreshFormatState();
    };

    document.addEventListener("selectionchange", handleSelection);

    return () => {
      document.removeEventListener("selectionchange", handleSelection);
    };
  }, []);

  const toolbarButtonClass = (active: boolean) =>
    `rounded-lg border px-3 py-1.5 text-sm transition-colors ${
      active
        ? "border-[#c73f3f] bg-[#fff1f1] text-[#9e2f2f]"
        : "border-[#00000020]"
    }`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={toolbarButtonClass(formatState.bold)} onClick={() => runCommand("bold")}>B</button>
        <button type="button" className={`${toolbarButtonClass(formatState.italic)} italic`} onClick={() => runCommand("italic")}>I</button>
        <button type="button" className={`${toolbarButtonClass(formatState.underline)} underline`} onClick={() => runCommand("underline")}>U</button>
        <button type="button" className={toolbarButtonClass(formatState.heading)} onClick={() => runCommand("formatBlock", "h3")}>H3</button>
        <button type="button" className={toolbarButtonClass(formatState.unorderedList)} onClick={() => runCommand("insertUnorderedList")}>• List</button>
        <button type="button" className={toolbarButtonClass(formatState.orderedList)} onClick={() => runCommand("insertOrderedList")}>1. List</button>
        <button type="button" className={toolbarButtonClass(false)} onClick={addImage}>Image</button>
        <button type="button" className={toolbarButtonClass(false)} onClick={() => runCommand("removeFormat")}>Очистить формат</button>
      </div>

      <div className="relative">
        {isEmpty ? (
          <p className="pointer-events-none absolute left-4 top-3 text-sm text-[#8a8a8a]">
            Напишите текст статьи, добавьте заголовки, списки и изображения...
          </p>
        ) : null}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          className="min-h-[260px] rounded-xl border border-[#00000020] px-4 py-3 outline-none focus:border-[#c73f3f]"
          onInput={emitChange}
          onKeyUp={refreshFormatState}
          onMouseUp={refreshFormatState}
          onFocus={refreshFormatState}
        />
      </div>

      <p className="text-xs text-[#6e6e6e]">
        Содержимое сохраняется как JSON-блоки (`text`, `heading`, `list`, `ordered-list`, `image`).
      </p>
    </div>
  );
}
