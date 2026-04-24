"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  MessageChannelType,
  MessageExpectedResponseType,
  MessageRecipientType,
  MessageStatus,
  MessageType,
  ReadinessMessage,
} from "@/lib/load-readiness-messaging";

type FinalReadinessArtifact = {
  loadId: string;
  artifactUrl: string;
  artifactGeneratedAt: string;
  artifactFileName: string;
  html: string;
};

type NewMessageInput = {
  loadId: string;
  driverId?: string;
  recipientType: MessageRecipientType;
  recipientName: string;
  recipientRole: string;
  channelType: MessageChannelType;
  messageType: MessageType;
  subject: string;
  messageBody: string;
  expectedResponseType: MessageExpectedResponseType;
  relatedWorkflowImpact: string;
  exceptionId?: string;
};

type LoadReadinessMessagingState = {
  messagesByLoadId: Record<string, ReadinessMessage[]>;
  artifactsByLoadId: Record<string, FinalReadinessArtifact>;
  sendMessage: (input: NewMessageInput) => string;
  markDelivered: (loadId: string, messageId: string) => void;
  recordResponse: (loadId: string, messageId: string, responseValue: string) => void;
  markExpired: (loadId: string, messageId: string) => void;
  getMessagesForLoad: (loadId: string) => ReadinessMessage[];
  saveFinalReadinessArtifact: (
    loadId: string,
    artifactFileName: string,
    html: string
  ) => FinalReadinessArtifact;
  getFinalReadinessArtifact: (loadId: string) => FinalReadinessArtifact | null;
};

function nowIso() {
  return new Date().toISOString();
}

function messageId(loadId: string) {
  return `MSG-${loadId}-${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
}

function stableSummaryUrl(loadId: string) {
  return `/loads/${encodeURIComponent(loadId)}/readiness-summary`;
}

export const useLoadReadinessMessagingStore = create<LoadReadinessMessagingState>()(
  persist(
    (set, get) => ({
      messagesByLoadId: {},
      artifactsByLoadId: {},

      sendMessage: (input) => {
        const id = messageId(input.loadId);
        const row: ReadinessMessage = {
          messageId: id,
          loadId: input.loadId,
          driverId: input.driverId,
          recipientType: input.recipientType,
          recipientName: input.recipientName,
          recipientRole: input.recipientRole,
          channelType: input.channelType,
          messageType: input.messageType,
          subject: input.subject,
          messageBody: input.messageBody,
          expectedResponseType: input.expectedResponseType,
          responseValue: null,
          responseReceivedAt: null,
          sentAt: nowIso(),
          status: "pending",
          relatedWorkflowImpact: input.relatedWorkflowImpact,
          exceptionId: input.exceptionId,
        };
        set((s) => ({
          messagesByLoadId: {
            ...s.messagesByLoadId,
            [input.loadId]: [row, ...(s.messagesByLoadId[input.loadId] ?? [])],
          },
        }));
        return id;
      },

      markDelivered: (loadId, messageId) =>
        set((s) => ({
          messagesByLoadId: {
            ...s.messagesByLoadId,
            [loadId]: (s.messagesByLoadId[loadId] ?? []).map((m) =>
              m.messageId === messageId ? { ...m, status: "delivered" as MessageStatus } : m
            ),
          },
        })),

      recordResponse: (loadId, messageId, responseValue) =>
        set((s) => ({
          messagesByLoadId: {
            ...s.messagesByLoadId,
            [loadId]: (s.messagesByLoadId[loadId] ?? []).map((m) =>
              m.messageId === messageId
                ? {
                    ...m,
                    status: "responded" as MessageStatus,
                    responseValue,
                    responseReceivedAt: nowIso(),
                  }
                : m
            ),
          },
        })),

      markExpired: (loadId, messageId) =>
        set((s) => ({
          messagesByLoadId: {
            ...s.messagesByLoadId,
            [loadId]: (s.messagesByLoadId[loadId] ?? []).map((m) =>
              m.messageId === messageId ? { ...m, status: "expired" as MessageStatus } : m
            ),
          },
        })),

      getMessagesForLoad: (loadId) => get().messagesByLoadId[loadId] ?? [],

      saveFinalReadinessArtifact: (loadId, artifactFileName, html) => {
        const artifact: FinalReadinessArtifact = {
          loadId,
          artifactUrl: stableSummaryUrl(loadId),
          artifactGeneratedAt: nowIso(),
          artifactFileName,
          html,
        };
        set((s) => ({
          artifactsByLoadId: {
            ...s.artifactsByLoadId,
            [loadId]: artifact,
          },
        }));
        return artifact;
      },

      getFinalReadinessArtifact: (loadId) => get().artifactsByLoadId[loadId] ?? null,
    }),
    {
      name: "bof:load-readiness-messaging:v1",
      partialize: (state) => ({
        messagesByLoadId: state.messagesByLoadId,
        artifactsByLoadId: state.artifactsByLoadId,
      }),
    }
  )
);
