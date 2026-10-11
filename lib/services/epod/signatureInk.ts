import { deflateSync, inflateSync } from "node:zlib";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const MIN_INK_PIXELS = 8;

function httpError(message: string, statusCode: number) {
  return Object.assign(new Error(message), { statusCode });
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const value of bytes) {
    crc ^= value;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (~crc) >>> 0;
}

function chunk(type: string, data: Uint8Array) {
  const typeBytes = new Uint8Array(Buffer.from(type));
  const body = new Uint8Array(typeBytes.length + data.length);
  body.set(typeBytes, 0);
  body.set(data, typeBytes.length);
  const length = new Uint8Array(4);
  new DataView(length.buffer).setUint32(0, data.length);
  const crc = new Uint8Array(4);
  new DataView(crc.buffer).setUint32(0, crc32(body));
  const out = new Uint8Array(12 + data.length);
  out.set(length, 0);
  out.set(body, 4);
  out.set(crc, 8 + data.length);
  return out;
}

export function encodeRgbPng(width: number, height: number, rgb: Uint8Array) {
  if (rgb.byteLength !== width * height * 3) {
    throw new Error("RGB buffer does not match the PNG size.");
  }
  const raw = new Uint8Array(height * (1 + width * 3));
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (1 + width * 3);
    raw[rowStart] = 0;
    raw.set(rgb.subarray(y * width * 3, (y + 1) * width * 3), rowStart + 1);
  }
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const compressed = deflateSync(raw);
  const parts = [
    new Uint8Array(PNG_SIGNATURE),
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", new Uint8Array()),
  ];
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const png = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    png.set(part, offset);
    offset += part.byteLength;
  }
  return png;
}

function readUint32(bytes: Uint8Array, offset: number) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset);
}

function paeth(left: number, up: number, upLeft: number) {
  const estimate = left + up - upLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upLeftDistance = Math.abs(estimate - upLeft);
  if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
  if (upDistance <= upLeftDistance) return up;
  return upLeft;
}

export function assertSignatureHasInk(bytes: Uint8Array) {
  if (bytes.byteLength < 8 || !PNG_SIGNATURE.every((value, index) => bytes[index] === value)) {
    throw httpError("Signature content is not a PNG.", 422);
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = -1;
  const idat: Uint8Array[] = [];
  while (offset + 12 <= bytes.byteLength) {
    const length = readUint32(bytes, offset);
    const type = Buffer.from(bytes.subarray(offset + 4, offset + 8)).toString("ascii");
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > bytes.byteLength) {
      throw httpError("Signature content is not a PNG.", 422);
    }
    const data = bytes.subarray(dataStart, dataEnd);
    if (type === "IHDR") {
      if (data.byteLength < 13) throw httpError("Signature content is not a PNG.", 422);
      width = readUint32(data, 0);
      height = readUint32(data, 4);
      const bitDepth = data[8];
      colorType = data[9];
      const interlace = data[12];
      if (bitDepth !== 8 || interlace !== 0 || ![0, 2, 6].includes(colorType)) {
        throw httpError("Signature image format is not supported.", 422);
      }
      if (width < 1 || height < 1 || width > 2000 || height > 1000) {
        throw httpError("Signature image format is not supported.", 422);
      }
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    offset = dataEnd + 4;
  }
  if (!width || !height || idat.length === 0) {
    throw httpError("Signature content is not a PNG.", 422);
  }
  const channels = colorType === 0 ? 1 : colorType === 2 ? 3 : 4;
  const compressed = new Uint8Array(idat.reduce((sum, part) => sum + part.byteLength, 0));
  let idatOffset = 0;
  for (const part of idat) {
    compressed.set(part, idatOffset);
    idatOffset += part.byteLength;
  }
  let raw: Uint8Array;
  try {
    raw = inflateSync(compressed);
  } catch {
    throw httpError("Signature content is not a PNG.", 422);
  }
  const rowLength = 1 + width * channels;
  if (raw.byteLength < height * rowLength) {
    throw httpError("Signature content is not a PNG.", 422);
  }
  const prior = new Uint8Array(width * channels);
  const current = new Uint8Array(width * channels);
  let ink = 0;
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * rowLength;
    const filter = raw[rowStart];
    const row = raw.subarray(rowStart + 1, rowStart + rowLength);
    for (let index = 0; index < current.length; index += 1) {
      const left = index >= channels ? current[index - channels] : 0;
      const up = prior[index] ?? 0;
      const upLeft = index >= channels ? prior[index - channels] ?? 0 : 0;
      const value = row[index] ?? 0;
      if (filter === 0) current[index] = value;
      else if (filter === 1) current[index] = (value + left) & 255;
      else if (filter === 2) current[index] = (value + up) & 255;
      else if (filter === 3) current[index] = (value + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) current[index] = (value + paeth(left, up, upLeft)) & 255;
      else throw httpError("Signature content is not a PNG.", 422);
    }
    for (let x = 0; x < width; x += 1) {
      const pixel = current.subarray(x * channels, (x + 1) * channels);
      const opaque = channels === 4 ? (pixel[3] ?? 0) >= 20 : true;
      const white =
        channels === 1
          ? (pixel[0] ?? 255) >= 250
          : (pixel[0] ?? 255) >= 250 && (pixel[1] ?? 255) >= 250 && (pixel[2] ?? 255) >= 250;
      if (opaque && !white) ink += 1;
    }
    prior.set(current);
  }
  if (ink < MIN_INK_PIXELS) {
    throw httpError("Signature is blank.", 422);
  }
  return { inkPixels: ink, width, height };
}
