export type DriverHrHistoryRecord = {
  id: string;
  date: string;
  category: "Operations" | "Safety" | "Settlement" | "Training" | "HR";
  title: string;
  detail: string;
  status: "Open" | "In Progress" | "Complete" | "Reviewed";
  impact: "Dispatch" | "Settlement" | "Safety bonus" | "None";
  href?: string;
};

const BASELINE_RECORDS: DriverHrHistoryRecord[] = [
  {
    id: "annual-policy-ack",
    date: "2026-05-01",
    category: "HR",
    title: "Annual policy acknowledgment",
    detail: "Employee handbook, safety policy, and data handling acknowledgments are on file.",
    status: "Complete",
    impact: "None",
  },
  {
    id: "quarterly-performance-review",
    date: "2026-05-08",
    category: "Training",
    title: "Quarterly performance review",
    detail: "Manager review completed; next coaching or recognition item is driven by active operations records.",
    status: "Reviewed",
    impact: "None",
  },
];

const DRIVER_SPECIFIC_HISTORY: Record<string, DriverHrHistoryRecord[]> = {
  "DRV-001": [
    {
      id: "seal-exception-l001",
      date: "2026-05-18",
      category: "Operations",
      title: "Seal mismatch exception - Load L001",
      detail:
        "Pickup seal SEAL-83921 and delivery seal SEAL-83920 do not match. HR file carries the incident until dispatch and claims finish proof review.",
      status: "Open",
      impact: "Settlement",
      href: "/loads/L001",
    },
  ],
  "DRV-007": [
    {
      id: "lumper-qr-closeout-l007",
      date: "2026-05-18",
      category: "Settlement",
      title: "QR lumper closeout - Load L007",
      detail:
        "Driver is not responsible for chasing paper. BOF is waiting on dock-side QR authorization, empty-trailer proof, and Zelle payment confirmation before settlement closeout.",
      status: "Open",
      impact: "Settlement",
      href: "/loads/L007#lumper-workflow",
    },
  ],
  "DRV-010": [
    {
      id: "hos-coaching-l010",
      date: "2026-05-18",
      category: "Safety",
      title: "HOS coaching and acknowledgment - Load L010",
      detail:
        "Driver statement and coaching acknowledgment are required before dispatch release and safety bonus approval.",
      status: "In Progress",
      impact: "Safety bonus",
      href: "/safety",
    },
  ],
};

export function getDriverHrHistory(driverId: string): DriverHrHistoryRecord[] {
  return [...(DRIVER_SPECIFIC_HISTORY[driverId] ?? []), ...BASELINE_RECORDS];
}
