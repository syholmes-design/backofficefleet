import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

const STORAGE_ROOT = resolve(process.cwd(), "storage", "condition-evidence");

export type EvidenceStorageStatus = {
  kind: "local-filesystem";
  productionDurable: false;
  sharedAcrossInstances: false;
  survivesDeployment: false;
  public: false;
  label: "Local application storage. Production object storage is not connected.";
};

export function describeEvidenceStorage(): EvidenceStorageStatus {
  return {
    kind: "local-filesystem",
    productionDurable: false,
    sharedAcrossInstances: false,
    survivesDeployment: false,
    public: false,
    label: "Local application storage. Production object storage is not connected.",
  };
}

function assertInsideStorage(fullPath: string) {
  const fromRoot = relative(STORAGE_ROOT, fullPath);
  if (fromRoot === "" || fromRoot.startsWith("..") || isAbsolute(fromRoot)) {
    throw Object.assign(new Error("Storage path is not allowed."), { statusCode: 422 });
  }
}

export function evidenceFilePath(storageKey: string) {
  const fullPath = resolve(STORAGE_ROOT, storageKey);
  assertInsideStorage(fullPath);
  return fullPath;
}

export async function writeEvidenceFile(fleetId: string, evidenceId: string, fileName: string, bytes: Uint8Array) {
  const storageKey = join(fleetId, evidenceId, fileName).replace(/\\/g, "/");
  const fullPath = evidenceFilePath(storageKey);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, bytes);
  return storageKey;
}

export async function readEvidenceFile(storageKey: string) {
  return readFile(evidenceFilePath(storageKey));
}

export async function removeEvidenceFile(storageKey: string) {
  await rm(evidenceFilePath(storageKey), { force: true });
}
