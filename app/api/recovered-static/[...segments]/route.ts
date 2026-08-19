import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ segments: string[] }> };

const RECOVERED_ROOT = path.join(process.cwd(), "recovered", "fork-restored-20260819");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".txt": "text/plain; charset=utf-8",
};

function resolveSafePath(segments: string[]): string | null {
  if (!segments.length) return null;
  if (segments.some((segment) => segment === ".." || segment.includes("\\"))) {
    return null;
  }

  const candidate = path.join(RECOVERED_ROOT, ...segments);
  const normalizedRoot = path.resolve(RECOVERED_ROOT);
  const normalizedCandidate = path.resolve(candidate);
  if (!normalizedCandidate.startsWith(normalizedRoot)) {
    return null;
  }
  return normalizedCandidate;
}

async function resolveTargetFile(absolutePath: string): Promise<string | null> {
  try {
    const stat = await fs.stat(absolutePath);
    if (stat.isDirectory()) {
      const indexPath = path.join(absolutePath, "index.html");
      await fs.access(indexPath);
      return indexPath;
    }
    return absolutePath;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code && code !== "ENOENT" && code !== "ENOTDIR") {
      throw error;
    }
    const withIndex = path.join(absolutePath, "index.html");
    try {
      await fs.access(withIndex);
      return withIndex;
    } catch (indexError) {
      const indexCode = (indexError as NodeJS.ErrnoException).code;
      if (indexCode && indexCode !== "ENOENT" && indexCode !== "ENOTDIR") {
        throw indexError;
      }
      return null;
    }
  }
}

export async function GET(_req: Request, ctx: Ctx) {
  const { segments } = await ctx.params;
  const safePath = resolveSafePath(segments);
  if (!safePath) {
    return new NextResponse("Not found", { status: 404 });
  }

  const targetFile = await resolveTargetFile(safePath);
  if (!targetFile) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = path.extname(targetFile).toLowerCase();
  const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

  try {
    const body = await fs.readFile(targetFile);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") {
      return new NextResponse("Not found", { status: 404 });
    }
    throw error;
  }
}
