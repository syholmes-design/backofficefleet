import { createPrismaOperatingProcessStore } from "@/lib/process-intelligence/prisma-store";
import type { OperatingProcessStore } from "@/lib/process-intelligence/store";

let store: OperatingProcessStore = createPrismaOperatingProcessStore();

export function getOperatingProcessStore(): OperatingProcessStore {
  return store;
}

export function setOperatingProcessStoreForTests(next: OperatingProcessStore) {
  store = next;
}

export function restoreDefaultOperatingProcessStore() {
  store = createPrismaOperatingProcessStore();
}
