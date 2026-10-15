/**
 * Initial use case: verification-partnership correspondence.
 * Maps counterparty domains to partner ids used in
 * docs/verification-partnerships/tracker.md. Domains come from public sources and
 * should be confirmed when the first real message arrives.
 */
export interface PartnerEntry {
  partnerId: string;
  name: string;
  domains: string[];
}

export const VERIFICATION_PARTNERS: readonly PartnerEntry[] = [
  { partnerId: "fmcsa", name: "FMCSA (incl. Clearinghouse, QCMobile)", domains: ["dot.gov"] },
  { partnerId: "psp-nicf", name: "FMCSA PSP / NIC Federal", domains: ["psp.fmcsa.dot.gov", "nicusa.com"] },
  { partnerId: "checkr", name: "Checkr", domains: ["checkr.com"] },
  { partnerId: "sambasafety", name: "SambaSafety", domains: ["sambasafety.com"] },
  { partnerId: "tenstreet", name: "Tenstreet", domains: ["tenstreet.com"] },
  { partnerId: "ca-dmv", name: "California DMV (EPN)", domains: ["dmv.ca.gov"] },
];

/** Every partner domain, for agent grants and the correspondence mailbox allowlist. */
export const VERIFICATION_PARTNER_DOMAINS: readonly string[] = VERIFICATION_PARTNERS.flatMap((p) => p.domains);

/** Most specific domain match wins (psp.fmcsa.dot.gov beats dot.gov). */
export function matchPartner(address: string): PartnerEntry | undefined {
  const domain = address.slice(address.lastIndexOf("@") + 1).toLowerCase();
  let best: { entry: PartnerEntry; len: number } | undefined;
  for (const entry of VERIFICATION_PARTNERS) {
    for (const d of entry.domains) {
      if ((domain === d || domain.endsWith(`.${d}`)) && (!best || d.length > best.len)) {
        best = { entry, len: d.length };
      }
    }
  }
  return best?.entry;
}
