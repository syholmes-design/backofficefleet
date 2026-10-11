import { rejectDemoOperationalKey } from "@/lib/uos/demo-operational-keys";

export const CARGO_PHOTO_ROLES = ["LOADED_TRAILER", "EMPTY_TRAILER"] as const;
export type CargoPhotoRole = (typeof CARGO_PHOTO_ROLES)[number];

const MAX_BYTES = 8 * 1024 * 1024;

export function assertCargoPhoto(input: {
  role: string;
  loadId: string;
  fleetId: string;
  evidenceFleetId?: string | null;
  evidenceLoadId?: string | null;
  mimeType: string;
  bytes: Uint8Array;
  callerStorageKey?: string | null;
  callerDocumentId?: string | null;
  callerTimestamp?: string | null;
}) {
  rejectDemoOperationalKey(input.loadId, "loadId");
  if (!CARGO_PHOTO_ROLES.includes(input.role as CargoPhotoRole)) {
    throw Object.assign(new Error("Photo role is not supported."), { statusCode: 422 });
  }
  if (input.callerStorageKey?.trim()) {
    throw Object.assign(new Error("A caller-supplied storage key is not accepted."), { statusCode: 422 });
  }
  if (input.callerDocumentId?.trim()) {
    throw Object.assign(new Error("A caller-supplied document id is not accepted."), { statusCode: 422 });
  }
  if (input.callerTimestamp?.trim()) {
    throw Object.assign(new Error("A caller-supplied timestamp is not a verified capture time."), { statusCode: 422 });
  }
  const mimeType = input.mimeType.trim().toLowerCase() === "image/jpg" ? "image/jpeg" : input.mimeType.trim().toLowerCase();
  if (mimeType !== "image/png" && mimeType !== "image/jpeg") {
    throw Object.assign(new Error("Photograph must be a PNG or JPEG file."), { statusCode: 422 });
  }
  if (/https?:\/\//i.test(mimeType)) {
    throw Object.assign(new Error("A web address is not a photograph."), { statusCode: 422 });
  }
  if (input.bytes.byteLength <= 0) {
    throw Object.assign(new Error("Photograph file is required."), { statusCode: 422 });
  }
  if (input.bytes.byteLength > MAX_BYTES) {
    throw Object.assign(new Error("Photograph exceeds the 8 MB limit."), { statusCode: 422 });
  }
  const png = input.bytes[0] === 0x89 && input.bytes[1] === 0x50 && input.bytes[2] === 0x4e && input.bytes[3] === 0x47;
  const jpeg = input.bytes[0] === 0xff && input.bytes[1] === 0xd8 && input.bytes[2] === 0xff;
  if (mimeType === "image/png" && !png) {
    throw Object.assign(new Error("Photograph content is not a PNG."), { statusCode: 422 });
  }
  if (mimeType === "image/jpeg" && !jpeg) {
    throw Object.assign(new Error("Photograph content is not a JPEG."), { statusCode: 422 });
  }
  if (input.evidenceFleetId && input.evidenceFleetId !== input.fleetId) {
    throw Object.assign(new Error("Evidence belongs to another fleet."), { statusCode: 403 });
  }
  if (input.evidenceLoadId && input.evidenceLoadId !== input.loadId) {
    throw Object.assign(new Error("Evidence belongs to another load."), { statusCode: 422 });
  }
  return { role: input.role as CargoPhotoRole, mimeType };
}
