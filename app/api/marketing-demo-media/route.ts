import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

const MEDIA_ROOT = path.resolve(process.cwd(), "recovered", "fork-restored-20260819", "assets");

const ALLOWED_MEDIA: Record<string, { relativePath: string; contentType: string }> = {
  "bof-aggregator.mp4": { relativePath: "videos/bof-aggregator.mp4", contentType: "video/mp4" },
  "bof-fleet-owner.mp4": { relativePath: "videos/bof-fleet-owner.mp4", contentType: "video/mp4" },
  "bof-business-operations.mp4": { relativePath: "videos/bof-business-operations.mp4", contentType: "video/mp4" },
  "bof-driver-vault.mp4": { relativePath: "videos/bof-driver-vault.mp4", contentType: "video/mp4" },
  "bof-customer-portal-load-intake.mp4": {
    relativePath: "videos/bof-customer-portal-load-intake.mp4",
    contentType: "video/mp4",
  },
  "bof-aggregator.jpg": { relativePath: "images/video-posters/bof-aggregator.jpg", contentType: "image/jpeg" },
  "bof-fleet-owner.jpg": { relativePath: "images/video-posters/bof-fleet-owner.jpg", contentType: "image/jpeg" },
  "bof-business-operations.jpg": {
    relativePath: "images/video-posters/bof-business-operations.jpg",
    contentType: "image/jpeg",
  },
  "bof-driver-vault.jpg": { relativePath: "images/video-posters/bof-driver-vault.jpg", contentType: "image/jpeg" },
  "bof-customer-portal-load-intake.jpg": {
    relativePath: "images/video-posters/bof-customer-portal-load-intake.jpg",
    contentType: "image/jpeg",
  },
};

function resolveAllowedMedia(name: string) {
  const item = ALLOWED_MEDIA[name];
  if (!item) return null;
  const filePath = path.resolve(MEDIA_ROOT, item.relativePath);
  const relative = path.relative(MEDIA_ROOT, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return { filePath, contentType: item.contentType };
}

export async function GET(request: Request) {
  const name = new URL(request.url).searchParams.get("name") ?? "";
  const media = resolveAllowedMedia(name);
  if (!media) return new Response("Not found", { status: 404 });

  const fileStat = await stat(media.filePath);
  const range = request.headers.get("range");
  if (range) {
    const match = /bytes=(\d+)-(\d*)/.exec(range);
    if (!match) return new Response("Range not satisfiable", { status: 416 });
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : Math.min(start + 1024 * 1024 - 1, fileStat.size - 1);
    if (start >= fileStat.size || end < start) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${fileStat.size}` },
      });
    }
    const stream = createReadStream(media.filePath, { start, end });
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      status: 206,
      headers: {
        "Content-Type": media.contentType,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${fileStat.size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  const stream = createReadStream(media.filePath);
  return new Response(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "Content-Type": media.contentType,
      "Content-Length": String(fileStat.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
