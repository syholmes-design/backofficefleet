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
