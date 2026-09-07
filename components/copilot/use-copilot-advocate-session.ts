"use client";

import { useEffect, useState } from "react";
import {
  resolveCopilotAdvocateAccess,
  sessionUserFromAuthPayload,
  type CopilotAccessDecision,
} from "@/lib/copilot/copilot-advocate-access";
import { getV3OperationalData } from "@/lib/v3-operational-loader";
import type { V3OperationalData } from "@/lib/v3-operational-types";

export function useCopilotAdvocateSession() {
  const [v3, setV3] = useState<V3OperationalData | null>(null);
  const [access, setAccess] = useState<CopilotAccessDecision>(() =>
    resolveCopilotAdvocateAccess(null, { sessionResolved: false }),
  );

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/session")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled) return;
        setAccess(resolveCopilotAdvocateAccess(sessionUserFromAuthPayload(payload), { sessionResolved: true }));
      })
      .catch(() => {
        if (!cancelled) {
          setAccess(resolveCopilotAdvocateAccess(null, { sessionResolved: true }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!access.allowed) {
      setV3(null);
      return;
    }
    let cancelled = false;
    void getV3OperationalData()
      .then((payload) => {
        if (!cancelled) setV3(payload);
      })
      .catch(() => {
        if (!cancelled) setV3(null);
      });
    return () => {
      cancelled = true;
    };
  }, [access.allowed]);

  return { access, v3 };
}
