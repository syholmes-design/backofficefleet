"use client";

import { useMemo, useState } from "react";
import { Printer, Search } from "lucide-react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  auditDriverOperationalProfiles,
  listDriverOperationalProfiles,
} from "@/lib/driver-operational-profile";
import { EmergencyContactCard } from "./EmergencyContactCard";

export function EmergencyContactList() {
  const { data } = useBofDemoData();
  const drivers = useMemo(() => listDriverOperationalProfiles(data), [data]);
  const audit = useMemo(() => auditDriverOperationalProfiles(data), [data]);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return drivers;
    return drivers.filter((d) => {
      const city = d.address.split(",")[1]?.trim().toLowerCase() ?? "";
      return (
        d.fullName.toLowerCase().includes(q) ||
        d.driverId.toLowerCase().includes(q) ||
        city.includes(q)
      );
    });
  }, [drivers, query]);

  const [activeId, setActiveId] = useState<string>(drivers[0]?.driverId ?? "");
  const visibleActive = filtered.some((d) => d.driverId === activeId)
    ? activeId
    : filtered[0]?.driverId ?? "";

  return (
    <div className="ec-list-page">
      <header className="ec-list-toolbar">
        <label className="ec-search-wrap">
          <Search size={16} aria-hidden />
          <input
            type="search"
            placeholder="Filter by driver name, ID, or city"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Filter emergency contact cards"
          />
        </label>
        <button type="button" className="ec-print-btn" onClick={() => window.print()}>
          <Printer size={14} aria-hidden />
          Print visible card
        </button>
      </header>
      {(audit.missingPrimary.length > 0 || audit.missingSecondary.length > 0) && (
        <p className="bof-muted bof-small" style={{ marginBottom: 8 }}>
          Missing contact data — primary:{" "}
          {audit.missingPrimary.length > 0 ? audit.missingPrimary.join(", ") : "none"} · secondary:{" "}
          {audit.missingSecondary.length > 0 ? audit.missingSecondary.join(", ") : "none"}.
        </p>
      )}

      <div className="ec-list-scroll">
        {filtered.map((driver) => (
          <section
            key={driver.driverId}
            className={`ec-list-item ${driver.driverId === visibleActive ? "is-print-target" : ""}`}
          >
            <div className="ec-list-item-head">
              <span className="ec-list-id">{driver.driverId}</span>
              <button
                type="button"
                className={driver.driverId === visibleActive ? "ec-focus-btn ec-focus-btn-active" : "ec-focus-btn"}
                onClick={() => setActiveId(driver.driverId)}
              >
                {driver.driverId === visibleActive ? "Visible" : "Set visible"}
              </button>
            </div>
            <EmergencyContactCard driver={driver} />
          </section>
        ))}
      </div>
    </div>
  );
}

