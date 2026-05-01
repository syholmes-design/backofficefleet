import fs from "fs";
import path from "path";

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export async function generateEvidenceImage({
  provider,
  apiKey,
  model,
  prompt,
  outputPath,
  outputFormat = "png",
}) {
  if (provider !== "openai") {
    throw new Error(`Unsupported image provider: ${provider}`);
  }
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model || "gpt-image-1",
      prompt,
      size: "1536x1024",
      response_format: "b64_json",
      output_format: outputFormat === "jpg" ? "jpeg" : outputFormat,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI image generation failed (${res.status}): ${txt.slice(0, 300)}`);
  }
  const payload = await res.json();
  const base64 = payload?.data?.[0]?.b64_json;
  if (!base64) {
    throw new Error("OpenAI image response missing image bytes");
  }
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, Buffer.from(base64, "base64"));
}
