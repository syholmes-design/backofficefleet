"use client";

import { useMemo, useState } from "react";
import { Printer, Search } from "lucide-react";
import type { DriverWithEC } from "@/lib/emergency-contacts/drivers";
import { EmergencyContactCard } from "./EmergencyContactCard";

export function EmergencyContactList({ drivers }: { drivers: DriverWithEC[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return drivers;
    return drivers.filter((d) => {
      const city = d.fullAddress.split(",")[1]?.trim().toLowerCase() ?? "";
      return (
        d.fullName.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        city.includes(q)
      );
    });
  }, [drivers, query]);

  const [activeId, setActiveId] = useState<string>(drivers[0]?.id ?? "");
  const visibleActive = filtered.some((d) => d.id === activeId)
    ? activeId
    : filtered[0]?.id ?? "";

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

      <div className="ec-list-scroll">
        {filtered.map((driver) => (
          <section
            key={driver.id}
            className={`ec-list-item ${driver.id === visibleActive ? "is-print-target" : ""}`}
          >
            <div className="ec-list-item-head">
              <span className="ec-list-id">{driver.id}</span>
              <button
                type="button"
                className={driver.id === visibleActive ? "ec-focus-btn ec-focus-btn-active" : "ec-focus-btn"}
                onClick={() => setActiveId(driver.id)}
              >
                {driver.id === visibleActive ? "Visible" : "Set visible"}
              </button>
            </div>
            <EmergencyContactCard driver={driver} />
          </section>
        ))}
      </div>
    </div>
  );
}

