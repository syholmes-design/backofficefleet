import type { RegulatorySourceType } from "@prisma/client";

export type RegulatorySourceSeed = {
  sourceType: RegulatorySourceType;
  agency: string;
  title: string;
  sourceUrl: string;
  externalIdentifier: string;
};

/** Official source index only; requirement text is not inferred from these URLs. */
export const AUTHORITATIVE_FMCSA_SOURCES: readonly RegulatorySourceSeed[] = [
  {
    sourceType: "REGULATION",
    agency: "eCFR",
    title: "Title 49, Transportation, Subtitle B, Chapter III",
    sourceUrl: "https://www.ecfr.gov/current/title-49/subtitle-B/chapter-III",
    externalIdentifier: "49-CFR-300-399",
  },
  {
    sourceType: "FMCSA_GUIDANCE",
    agency: "FMCSA",
    title: "FMCSA Regulations and Interpretations",
    sourceUrl: "https://www.fmcsa.dot.gov/regulations",
    externalIdentifier: "FMCSA-REGULATIONS",
  },
  {
    sourceType: "FEDERAL_REGISTER",
    agency: "Federal Motor Carrier Safety Administration",
    title: "Federal Register notices and rulemaking",
    sourceUrl: "https://www.federalregister.gov/agencies/federal-motor-carrier-safety-administration",
    externalIdentifier: "FMCSA-FEDERAL-REGISTER",
  },
  {
    sourceType: "FMCSA_TRAINING",
    agency: "FMCSA",
    title: "FMCSA safety and educational resources",
    sourceUrl: "https://www.fmcsa.dot.gov/safety",
    externalIdentifier: "FMCSA-SAFETY-EDUCATION",
  },
];

export const INITIAL_REGULATORY_SCOPE = [
  "49 CFR Parts 300-399",
  "49 CFR Part 40",
  "49 CFR Parts 100-185",
  "49 CFR Part 571",
] as const;
