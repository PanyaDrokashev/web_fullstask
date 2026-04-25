import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

import { getBackendApiBaseUrl, getBackendOrigin } from "@/shared/api/base-url";

function extractCatalogDir(rawDir: string): string {
  const trimmed = rawDir.trim();
  const withoutTrailingSlash = trimmed.endsWith("/")
    ? trimmed.slice(0, -1)
    : trimmed;

  if (withoutTrailingSlash.includes("/")) {
    const parts = withoutTrailingSlash.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? "";
  }

  return withoutTrailingSlash;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dirParam = searchParams.get("dir");

  if (!dirParam) {
    return NextResponse.json(
      { error: "Directory not specified" },
      { status: 400 },
    );
  }

  const normalizedDir = dirParam.startsWith("/") ? dirParam : `/${dirParam}`;

  if (!normalizedDir.startsWith("/catalog/")) {
    const slidesDir = path.join(process.cwd(), "public", normalizedDir);
    try {
      if (!fs.existsSync(slidesDir)) {
        return NextResponse.json(
          { error: "Directory not found" },
          { status: 404 },
        );
      }

      const filenames = fs.readdirSync(slidesDir);
      const images = filenames
        .filter((file) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file))
        .map((file) => `${normalizedDir}/${file}`);

      return NextResponse.json(images);
    } catch {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }

  const dir = extractCatalogDir(normalizedDir);
  if (!dir) {
    return NextResponse.json({ error: "Invalid directory" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${getBackendApiBaseUrl()}/content/catalog/slides/${encodeURIComponent(dir)}`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch slides from backend" },
        { status: response.status },
      );
    }

    const backendSlides = (await response.json()) as string[];
    const slides = backendSlides.map((path) => {
      if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
      }
      return `${getBackendOrigin()}${path}`;
    });

    return NextResponse.json(slides);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
