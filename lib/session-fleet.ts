export type SessionMembership = {
  fleetId: string;
  roleCode: string;
  fleetSlug?: string;
  status?: string;
};

export type SessionUserWithMemberships = {
  id?: string;
  email?: string | null;
  memberships?: SessionMembership[];
};

export type SessionWithMemberships = {
  user?: SessionUserWithMemberships | null;
} | null;

export function getPrimaryFleetId(session: SessionWithMemberships) {
  const memberships = session?.user?.memberships ?? [];
  return memberships[0]?.fleetId ?? null;
}
