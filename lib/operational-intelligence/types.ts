import type { OperatingRecordType } from "@/lib/services/operatingRecordService";

export type OperationalDataAuthority = "LIVE" | "PARTIAL" | "UNAVAILABLE";

export type OperationalIntelligenceCitation = {
  recordType: OperatingRecordType | "FLEET_SUMMARY";
  recordId: string;
  title: string;
  route: string;
};

export type OperationalIntelligenceRecommendation = {
  label: string;
  href: string;
  claimClass: "RECOMMENDATION";
  executable: false;
};

export type OperationalIntelligenceAnswer = {
  intent: string;
  question: string;
  answer: string;
  dataAuthority: OperationalDataAuthority;
  citations: OperationalIntelligenceCitation[];
  recommendations: OperationalIntelligenceRecommendation[];
  limitations: string[];
};

export type OperationalIntelligenceContext = {
  recordType?: OperatingRecordType;
  recordId?: string;
  loadId?: string;
  driverId?: string;
};
