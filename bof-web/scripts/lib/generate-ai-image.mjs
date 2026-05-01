import fs from "fs";
import path from "path";

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function providerError(message, extra = {}) {
  const err = new Error(message);
  Object.assign(err, extra);
  return err;
}

async function resolveReplicateVersion(model, apiKey) {
  const configured = model || "black-forest-labs/flux-schnell";
  if (configured.includes(":")) {
    const [slug, version] = configured.split(":");
    if (!slug || !version) throw new Error(`Invalid BOF_REPLICATE_MODEL format: ${configured}`);
    return { slug, version };
  }
  if (!configured.includes("/")) {
    throw new Error(
      `BOF_REPLICATE_MODEL must be "owner/model" or "owner/model:version"; got "${configured}"`
    );
  }
  const [owner, name] = configured.split("/");
  const modelRes = await fetch(`https://api.replicate.com/v1/models/${owner}/${name}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!modelRes.ok) {
    const txt = await modelRes.text();
    throw new Error(`Replicate model lookup failed (${modelRes.status}): ${txt.slice(0, 300)}`);
  }
  const payload = await modelRes.json();
  const version = payload?.latest_version?.id;
  if (!version) {
    throw new Error(`Replicate model ${configured} has no latest_version id`);
  }
  return { slug: configured, version };
}

export async function generateEvidenceImage({
  provider,
  apiKey,
  model,
  prompt,
  outputPath,
  outputFormat = "png",
}) {
  if (provider === "openai") {
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
      throw providerError(`OpenAI image generation failed (${res.status}): ${txt.slice(0, 300)}`, {
        provider: "openai",
        status: res.status,
        retryable: res.status === 429,
      });
    }
    const payload = await res.json();
    const base64 = payload?.data?.[0]?.b64_json;
    if (!base64) {
      throw new Error("OpenAI image response missing image bytes");
    }
    ensureDir(path.dirname(outputPath));
    fs.writeFileSync(outputPath, Buffer.from(base64, "base64"));
    return;
  }

  if (provider === "replicate") {
    const resolved = await resolveReplicateVersion(model, apiKey);
    const createRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: resolved.version,
        input: {
          prompt,
          aspect_ratio: "16:9",
          output_format: outputFormat === "jpg" ? "jpg" : "png",
          output_quality: 90,
        },
      }),
    });
    if (!createRes.ok) {
      const txt = await createRes.text();
      let retryAfter;
      try {
        const parsed = JSON.parse(txt);
        retryAfter = Number(parsed?.retry_after);
      } catch {}
      throw providerError(`Replicate create failed (${createRes.status}): ${txt.slice(0, 300)}`, {
        provider: "replicate",
        status: createRes.status,
        retryable: createRes.status === 429,
        retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : undefined,
      });
    }
    let pred = await createRes.json();
    const started = Date.now();
    while (pred?.status === "starting" || pred?.status === "processing") {
      if (Date.now() - started > 90000) {
        throw new Error(`Replicate prediction timeout: ${pred?.id}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${pred.id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!pollRes.ok) {
        const txt = await pollRes.text();
        let retryAfter;
        try {
          const parsed = JSON.parse(txt);
          retryAfter = Number(parsed?.retry_after);
        } catch {}
        throw providerError(`Replicate poll failed (${pollRes.status}): ${txt.slice(0, 300)}`, {
          provider: "replicate",
          status: pollRes.status,
          retryable: pollRes.status === 429,
          retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : undefined,
        });
      }
      pred = await pollRes.json();
    }
    if (pred?.status !== "succeeded") {
      throw providerError(`Replicate generation failed: ${pred?.error || pred?.status || "unknown"}`, {
        provider: "replicate",
        status: 500,
        retryable: false,
      });
    }
    const out = Array.isArray(pred.output) ? pred.output[0] : pred.output;
    const outUrl = typeof out === "string" ? out : out?.url;
    if (!outUrl) {
      throw providerError("Replicate output URL missing", {
        provider: "replicate",
        status: 500,
        retryable: false,
      });
    }
    const imageRes = await fetch(outUrl);
    if (!imageRes.ok) {
      throw providerError(`Replicate output download failed (${imageRes.status})`, {
        provider: "replicate",
        status: imageRes.status,
        retryable: imageRes.status === 429,
      });
    }
    const bytes = new Uint8Array(await imageRes.arrayBuffer());
    ensureDir(path.dirname(outputPath));
    fs.writeFileSync(outputPath, bytes);
    return;
  }

  throw providerError(`Unsupported image provider: ${provider}`, {
    provider,
    status: 400,
    retryable: false,
  });
}
