import raw from "./demo-data.json";

export type BofData = typeof raw;

export function getBofData(): BofData {
  return raw;
}
