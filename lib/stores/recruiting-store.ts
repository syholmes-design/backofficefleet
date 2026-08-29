"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEMO_CANDIDATES,
  DEMO_POSITIONS,
  type RecruitingCandidate,
  type RecruitingPosition,
} from "@/lib/recruiting-demo-data";

type RecruitingStore = {
  positions: RecruitingPosition[];
  candidates: RecruitingCandidate[];
  activeCandidateId: string;
  createPosition: (position: Omit<RecruitingPosition, "id" | "createdAt" | "status">) => string;
  addCandidate: (candidate: RecruitingCandidate) => void;
  updateCandidateStage: (candidateId: string, stage: RecruitingCandidate["pipelineStage"]) => void;
  toggleOnboardingCheckitem: (candidateId: string, itemId: string) => void;
  activateCandidateAsDriver: (candidateId: string) => string;
  getCandidateById: (candidateId: string) => RecruitingCandidate | undefined;
  getPositionById: (positionId: string) => RecruitingPosition | undefined;
};

export const useRecruitingStore = create<RecruitingStore>()(
  persist(
    (set, get) => ({
      positions: DEMO_POSITIONS,
      candidates: DEMO_CANDIDATES,
      activeCandidateId: "CAND-001",

      createPosition: (input) => {
        const newId = `POS-${String(get().positions.length + 1).padStart(3, "0")}`;
        const newPos: RecruitingPosition = {
          ...input,
          id: newId,
          status: "OPEN",
          createdAt: new Date().toISOString().slice(0, 10),
        };
        set((state) => ({ positions: [newPos, ...state.positions] }));
        return newId;
      },

      addCandidate: (newCandidate) => {
        set((state) => {
          // Check for duplicate application (same email & position)
          const existing = state.candidates.find(
            (c) => c.email.toLowerCase() === newCandidate.email.toLowerCase() && c.positionId === newCandidate.positionId
          );
          if (existing) {
            return {
              candidates: state.candidates.map((c) =>
                c.id === existing.id
                  ? { ...c, pipelineStage: "QUALIFICATION_REVIEW" as const }
                  : c
              ),
              activeCandidateId: existing.id,
            };
          }
          return {
            candidates: [newCandidate, ...state.candidates],
            activeCandidateId: newCandidate.id,
          };
        });
      },

      updateCandidateStage: (candidateId, stage) => {
        set((state) => ({
          candidates: state.candidates.map((c) =>
            c.id === candidateId ? { ...c, pipelineStage: stage } : c
          ),
        }));
      },

      toggleOnboardingCheckitem: (candidateId, itemId) => {
        set((state) => ({
          candidates: state.candidates.map((c) => {
            if (c.id !== candidateId) return c;
            const updatedList = c.onboardingChecklist.map((item) => {
              if (item.id !== itemId) return item;
              return {
                ...item,
                completed: !item.completed,
                verifiedAt: !item.completed ? new Date().toISOString().slice(0, 10) : undefined,
              };
            });
            return { ...c, onboardingChecklist: updatedList };
          }),
        }));
      },

      activateCandidateAsDriver: (candidateId) => {
        const candidate = get().getCandidateById(candidateId);
        if (!candidate) return "";
        const driverId = candidate.activatedDriverId || "DRV-DEMO-001";
        set((state) => ({
          candidates: state.candidates.map((c) =>
            c.id === candidateId
              ? {
                  ...c,
                  pipelineStage: "ACTIVATED",
                  activatedDriverId: driverId,
                  onboardingChecklist: c.onboardingChecklist.map((item) => ({ ...item, completed: true })),
                }
              : c
          ),
        }));
        return driverId;
      },

      getCandidateById: (candidateId) => {
        return get().candidates.find((c) => c.id === candidateId);
      },

      getPositionById: (positionId) => {
        return get().positions.find((p) => p.id === positionId);
      },
    }),
    {
      name: "bof-recruiting-store-v1",
    }
  )
);
