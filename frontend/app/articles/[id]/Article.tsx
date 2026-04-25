import { Image } from "@heroui/image";

import { IArticle, IArticlePart } from "@/shared/types/content";

export interface IArticleProps {
  article: IArticle;
}

function ArticleContent({ part }: { part: IArticlePart | string }) {
  if (typeof part === "string") {
    return <p className="leading-relaxed">{part}</p>;
  }

  switch (part.type) {
    case "text":
      return (
        <div
          className="article-richtext leading-relaxed"
          dangerouslySetInnerHTML={{ __html: part.content ?? "" }}
        />
      );

    case "heading":
      return (
        <h4
          className="font-semibold text-lg mt-4 mb-2"
          dangerouslySetInnerHTML={{ __html: part.content ?? "" }}
        />
      );

    case "image":
      return <Image src={part.content!} alt="" className="rounded-2xl my-4 w-full object-cover" />;

    case "list":
    case "ordered-list": {
      const isOrdered = part.type === "ordered-list";
      const Tag = isOrdered ? "ol" : "ul";
      const className = isOrdered ? "list-decimal pl-6 space-y-3" : "list-disc pl-6 space-y-3";

      return (
        <Tag className={className}>
          {part.items?.map((item, i) => (
            <li key={i} className="leading-relaxed">
              <ArticleListItem item={item} />
            </li>
          ))}
        </Tag>
      );
    }

    default:
      return null;
  }
}

function ArticleListItem({ item }: { item: string | NonNullable<IArticlePart["items"]>[number] }) {
  if (typeof item === "string") {
    return <span>{item}</span>;
  }

  return (
    <div className="space-y-2">
      {item.heading && <div className="font-medium text-base">{item.heading}</div>}
      {item.text && <p className="text-gray-800">{item.text}</p>}
      {item.items && (
        <ArticleContent
          part={{
            type: "list",
            items: item.items as IArticlePart["items"],
          }}
        />
      )}
    </div>
  );
}

export default function Article({ article }: IArticleProps) {
  return (
    <div className="text-black p-8 max-w-4xl bg-white flex flex-col gap-4 rounded-4xl shadow">
      {article.content.map((item, idx) => (
        <ArticleContent key={idx} part={item} />
      ))}
    </div>
  );
}
