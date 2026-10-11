"use client";

import { createContext, useContext } from "react";

const EpodAvailabilityContext = createContext(true);

export function EpodAvailabilityProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  return <EpodAvailabilityContext.Provider value={enabled}>{children}</EpodAvailabilityContext.Provider>;
}

export function useEpodEnabled() {
  return useContext(EpodAvailabilityContext);
}
