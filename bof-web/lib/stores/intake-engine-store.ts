"use client";

import { create } from "zustand";
import type { CommandCenterItem } from "@/lib/executive-layer";
import { buildDraftLoadFromExtracted, buildDraftLoadFromTrip } from "@/lib/intake-engine-build-load";
import { INTAKE_ENGINE_SEED } from "@/lib/intake-engine-seed";
import type { ExtractedFields, IntakeRecord, IntakeStatus, ProposedTrip } from "@/lib/intake-engine-types";
import {
  dispatchLoadStampFromIntake,
  runIntakeLifecycleSideEffects,
  type DriverReadinessLogEntry,
} from "@/lib/intake-engine-triggers";
import { useDispatchDashboardStore } from "@/lib/stores/dispatch-dashboard-store";

function nowIso() {
  return new Date().toISOString();
}

function todayPrefix() {
  return new Date().toISOString().slice(0, 10);
}

function seedIntakeCommandCenterQueue(): CommandCenterItem[] {
  return [
    {
      id: "INTAKE-CC-IN-005",
      severity: "high",
      bucket: "Dispatch / proof",
      title: "Intake Engine · handwritten gate note (IN-005)",
      detail:
        "Low extraction confidence on facility scan — correlate receiver note with L004 seal timeline.",
      loadId: "L004",
      nextAction: "Open intake IN-005 and confirm gate instructions.",
      owner: "Operations",
      status: "Needs review",
    },
  ];
}

type IntakeEngineState = {
  intakes: IntakeRecord[];
  /** Intake-derived rows merged into Command Center (demo). */
  commandCenterIntakeItems: CommandCenterItem[];
  /** Driver doc finalizations (demo audit trail). */
  driverReadinessLog: DriverReadinessLogEntry[];

  getIntake: (intake_id: string) => IntakeRecord | undefined;
  patchIntake: (intake_id: string, patch: Partial<IntakeRecord>) => void;
  setExtracted: (intake_id: string, extracted: Partial<ExtractedFields>) => void;
  setTripRow: (intake_id: string, trip_id: string, patch: Partial<ProposedTrip>) => void;

  approveIntake: (intake_id: string) => void;
  holdIntake: (intake_id: string) => void;
  requestInfo: (intake_id: string) => void;

  matchToDriver: (intake_id: string, driver_id: string | null) => void;
  matchToLoad: (intake_id: string, load_id: string | null) => void;

  approveAllTrips: (intake_id: string) => void;
  approveTrip: (intake_id: string, trip_id: string, approved: boolean) => void;
  holdBatch: (intake_id: string) => void;
  splitIntoTrips: (intake_id: string) => void;

  finalizeIntake: (intake_id: string) => { ok: boolean; message: string };
};

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

export const useIntakeEngineStore = create<IntakeEngineState>((set, get) => ({
  intakes: INTAKE_ENGINE_SEED.map((r) => clone(r)),
  commandCenterIntakeItems: seedIntakeCommandCenterQueue(),
  driverReadinessLog: [],

  getIntake: (intake_id) => get().intakes.find((i) => i.intake_id === intake_id),

  patchIntake: (intake_id, patch) =>
    set((s) => ({
      intakes: s.intakes.map((i) => (i.intake_id === intake_id ? { ...i, ...patch } : i)),
    })),

  setExtracted: (intake_id, extracted) =>
    set((s) => ({
      intakes: s.intakes.map((i) =>
        i.intake_id === intake_id ? { ...i, extracted: { ...i.extracted, ...extracted } } : i
      ),
    })),

  setTripRow: (intake_id, trip_id, patch) =>
    set((s) => ({
      intakes: s.intakes.map((i) => {
        if (i.intake_id !== intake_id) return i;
        return {
          ...i,
          proposed_trips: i.proposed_trips.map((t) =>
            t.trip_id === trip_id ? { ...t, ...patch } : t
          ),
        };
      }),
    })),

  approveIntake: (intake_id) =>
    set((s) => ({
      intakes: s.intakes.map((i) => {
        if (i.intake_id !== intake_id) return i;
        if (i.status === "finalized" || i.status === "rejected") return i;
        return { ...i, status: "ready_for_approval" as IntakeStatus, needs_review: false };
      }),
    })),

  holdIntake: (intake_id) => {
    set((s) => ({
      intakes: s.intakes.map((i) =>
        i.intake_id === intake_id ? { ...i, status: "on_hold" as IntakeStatus } : i
      ),
    }));
    const i = get().getIntake(intake_id);
    if (i) {
      runIntakeLifecycleSideEffects(i, "hold", {
        pushCommandCenterIntake: (item) =>
          set((st) => ({
            commandCenterIntakeItems: [...st.commandCenterIntakeItems, item],
          })),
        pushDriverReadiness: (entry) =>
          set((st) => ({
            driverReadinessLog: [...st.driverReadinessLog, entry],
          })),
      });
    }
  },

  requestInfo: (intake_id) => {
    set((s) => ({
      intakes: s.intakes.map((i) =>
        i.intake_id === intake_id ? { ...i, status: "awaiting_info" as IntakeStatus } : i
      ),
    }));
    const i = get().getIntake(intake_id);
    if (i) {
      runIntakeLifecycleSideEffects(i, "request_info", {
        pushCommandCenterIntake: (item) =>
          set((st) => ({
            commandCenterIntakeItems: [...st.commandCenterIntakeItems, item],
          })),
        pushDriverReadiness: (entry) =>
          set((st) => ({
            driverReadinessLog: [...st.driverReadinessLog, entry],
          })),
      });
    }
  },

  matchToDriver: (intake_id, driver_id) =>
    set((s) => ({
      intakes: s.intakes.map((i) =>
        i.intake_id === intake_id ? { ...i, linked_driver_id: driver_id } : i
      ),
    })),

  matchToLoad: (intake_id, load_id) =>
    set((s) => ({
      intakes: s.intakes.map((i) =>
        i.intake_id === intake_id ? { ...i, linked_load_id: load_id } : i
      ),
    })),

  approveAllTrips: (intake_id) =>
    set((s) => ({
      intakes: s.intakes.map((i) => {
        if (i.intake_id !== intake_id) return i;
        return {
          ...i,
          proposed_trips: i.proposed_trips.map((t) =>
            t.trip_status === "held" ? t : { ...t, trip_status: "approved" as const }
          ),
        };
      }),
    })),

  approveTrip: (intake_id, trip_id, approved) =>
    set((s) => ({
      intakes: s.intakes.map((i) => {
        if (i.intake_id !== intake_id) return i;
        return {
          ...i,
          proposed_trips: i.proposed_trips.map((t) =>
            t.trip_id === trip_id
              ? { ...t, trip_status: approved ? ("approved" as const) : ("pending" as const) }
              : t
          ),
        };
      }),
    })),

  holdBatch: (intake_id) =>
    set((s) => ({
      intakes: s.intakes.map((i) => {
        if (i.intake_id !== intake_id) return i;
        return {
          ...i,
          status: "on_hold" as IntakeStatus,
          proposed_trips: i.proposed_trips.map((t) => ({ ...t, trip_status: "held" as const })),
        };
      }),
    })),

  splitIntoTrips: (intake_id) => {
    const parent = get().intakes.find((i) => i.intake_id === intake_id);
    if (!parent || parent.intake_kind !== "multi_trip" || parent.proposed_trips.length === 0) {
      return;
    }
    const children: IntakeRecord[] = parent.proposed_trips.map((trip, idx) => ({
      ...clone(parent),
      intake_id: `${intake_id}-S${idx + 1}`,
      parent_intake_id: intake_id,
      intake_kind: "single_trip",
      status: "new" as IntakeStatus,
      subject_line: `${parent.subject_line} (split trip ${trip.row_number})`,
      proposed_trips: [],
      attachments: [],
      extracted: {
        ...parent.extracted,
        load_number: `${parent.extracted.load_number ?? "BATCH"}-${trip.row_number}`,
      },
      missing_items: [...trip.missing_items],
      finalized_at: null,
      derived_load_ids: [],
      review_notes: `Split from ${intake_id} · trip ${trip.trip_id}`,
      intake_demo_flags: parent.intake_demo_flags
        ? { ...parent.intake_demo_flags }
        : undefined,
    }));

    set((s) => ({
      intakes: [
        ...s.intakes.map((i) =>
          i.intake_id === intake_id
            ? {
                ...i,
                status: "finalized" as IntakeStatus,
                finalized_at: nowIso(),
                review_notes: `${i.review_notes}\nSplit into ${children.length} child intakes: ${children.map((c) => c.intake_id).join(", ")}`.trim(),
                derived_load_ids: i.derived_load_ids,
              }
            : i
        ),
        ...children,
      ],
    }));
  },

  finalizeIntake: (intake_id) => {
    const intake = get().intakes.find((i) => i.intake_id === intake_id);
    if (!intake) return { ok: false, message: "Intake not found." };
    if (intake.status === "finalized") return { ok: false, message: "Already finalized." };

    const derived: string[] = [];
    const dispatch = useDispatchDashboardStore.getState();
    let nextTrips = intake.proposed_trips;
    const stamp = dispatchLoadStampFromIntake(intake);

    if (intake.intake_kind === "single_trip") {
      const load = {
        ...buildDraftLoadFromExtracted(intake.extracted, {
          dispatch_notes: `Intake ${intake.intake_id} · ${intake.subject_line}`,
        }),
        ...stamp,
      };
      dispatch.appendLoad(load);
      derived.push(load.load_id);
    } else if (intake.intake_kind === "multi_trip") {
      const approved = intake.proposed_trips.filter((t) => t.trip_status === "approved");
      if (approved.length === 0) {
        return { ok: false, message: "Approve at least one trip row before finalize." };
      }
      for (const trip of approved) {
        const load = {
          ...buildDraftLoadFromTrip(
            { ...trip, trip_status: "finalized" },
            intake.extracted,
            `Intake ${intake.intake_id}`
          ),
          ...stamp,
        };
        dispatch.appendLoad(load);
        derived.push(load.load_id);
      }
      nextTrips = intake.proposed_trips.map((t) =>
        approved.some((a) => a.trip_id === t.trip_id) ? { ...t, trip_status: "finalized" as const } : t
      );
    }

    set((s) => ({
      intakes: s.intakes.map((i) =>
        i.intake_id === intake_id
          ? {
              ...i,
              status: "finalized" as IntakeStatus,
              finalized_at: nowIso(),
              derived_load_ids: [...i.derived_load_ids, ...derived],
              needs_review: false,
              proposed_trips: intake.intake_kind === "multi_trip" ? nextTrips : i.proposed_trips,
            }
          : i
      ),
    }));

    const finalizedIntake = get().getIntake(intake_id);
    if (finalizedIntake) {
      runIntakeLifecycleSideEffects(finalizedIntake, "finalize", {
        pushCommandCenterIntake: (item) =>
          set((st) => ({
            commandCenterIntakeItems: [...st.commandCenterIntakeItems, item],
          })),
        pushDriverReadiness: (entry) =>
          set((st) => ({
            driverReadinessLog: [...st.driverReadinessLog, entry],
          })),
      });
    }

    return {
      ok: true,
      message:
        derived.length > 0
          ? `Finalized · ${derived.length} draft load(s) on dispatch board (${derived.join(", ")}).`
          : "Finalized · document logged (no new dispatch row for this intake type).",
    };
  },
}));

export function intakeKpis(intakes: IntakeRecord[]) {
  const day = todayPrefix();
  return {
    newCount: intakes.filter((i) => i.status === "new").length,
    needsReview: intakes.filter((i) => i.status === "needs_review").length,
    readyApproval: intakes.filter((i) => i.status === "ready_for_approval").length,
    finalizedToday: intakes.filter(
      (i) => i.status === "finalized" && i.finalized_at && i.finalized_at.startsWith(day)
    ).length,
  };
}
