const PREFIX = "intake:";

/** Canonical BOF intake-owned entity id for document mapping and draft artifacts. */
export function toBofIntakeEntityId(intakeId: string): string {
  const trimmed = intakeId.trim();
  if (!trimmed) return `${PREFIX}unknown`;
  return trimmed.startsWith(PREFIX) ? trimmed : `${PREFIX}${trimmed}`;
}

export function isBofIntakeEntityId(entityId: string): boolean {
  return entityId.startsWith(PREFIX);
}

export function fromBofIntakeEntityId(entityId: string): string {
  if (!isBofIntakeEntityId(entityId)) return entityId;
  return entityId.slice(PREFIX.length);
}

/** Stable intake-scoped synthetic key for pre-load contexts (customer/facility/etc.). */
export function intakeScopedSyntheticKey(
  kind: "customer" | "facility" | "destination" | "contract",
  intakeEntityId: string,
  seed?: string
): string {
  const intakeId = fromBofIntakeEntityId(intakeEntityId);
  const cleanSeed = (seed ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!cleanSeed) return `${kind}:${intakeId}`;
  return `${kind}:${intakeId}:${cleanSeed}`;
}
