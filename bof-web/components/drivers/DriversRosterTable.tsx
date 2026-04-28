"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { DriverAvatar } from "@/components/DriverAvatar";
import { driverPhotoPath } from "@/lib/driver-photo";
import { readinessFromDocuments, getOrderedDocumentsForDriver, assignedTrucksForDriver, primaryAssignedTruck, complianceNotesForDriver } from "@/lib/driver-queries";

type DriverRow = {
  id: string;
  name: string;
  photo: string;
  asset: string;
  status: string;
  statusLink?: string;
  compliance: {
    status: "ok" | "warn" | "danger";
    label: string;
    blocker?: string;
  };
  pendingPay: number;
  pendingPayReason?: string;
  actions: {
    profile: string;
    hr: string;
    vault: string;
    safety: string;
    settlements: string;
    dispatch: string;
  };
};

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function formatCityStateFromAddress(address?: string): string {
  if (!address) return "Unknown terminal";
  const parts = address.split(",");
  if (parts.length < 2) return address;
  const city = parts[parts.length - 2]?.trim();
  const stateZip = parts[parts.length - 1]?.trim() ?? "";
  const state = stateZip.split(" ")[0];
  if (!city || !state) return address;
  return `${city}, ${state}`;
}

function formatCityStateFromStop(stop?: string): string {
  if (!stop) return "Unknown destination";
  const parts = stop.split(" - ");
  return parts[parts.length - 1]?.trim() || stop;
}

export function DriversRosterTable() {
  const { data } = useBofDemoData();
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const rosterRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onOutsideClick(event: MouseEvent) {
      if (!rosterRootRef.current?.contains(event.target as Node)) {
        setDropdownOpen(null);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const driverRows = useMemo(() => {
    const settlements =
      (data as typeof data & {
        settlements?: Array<{
          driverId: string;
          netPay?: number;
          status?: string;
          pendingReason?: string;
        }>;
      }).settlements ?? [];
    const moneyAtRisk = data.moneyAtRisk ?? [];

    return data.drivers.map((driver) => {
      const documents = getOrderedDocumentsForDriver(data, driver.id);
      const readiness = readinessFromDocuments(documents);
      const trucks = assignedTrucksForDriver(data, driver.id);
      const primary = primaryAssignedTruck(data, driver.id);
      const compliance = complianceNotesForDriver(data, driver.id);

      const assetLabel =
        trucks.length === 0
          ? "Unassigned"
          : trucks.length === 1
            ? trucks[0]
            : `${primary ?? trucks[0]} (${trucks.length} assets)`;

      const activeLoad = data.loads.find(
        (l) =>
          l.driverId === driver.id && (l.status === "En Route" || l.status === "Pending")
      );
      const latestLoad = data.loads.find((l) => l.driverId === driver.id);
      const terminalLabel = formatCityStateFromAddress(driver.address);
      let status = `Available · ${terminalLabel} terminal`;
      let statusLink = undefined;

      if (activeLoad) {
        if (activeLoad.status === "En Route") {
          status = `In transit · L${activeLoad.number}`;
          statusLink = `/loads/${activeLoad.id}`;
        } else {
          status = `At receiver · ${formatCityStateFromStop(activeLoad.destination)}`;
          statusLink = `/loads/${activeLoad.id}`;
        }
      } else if (readiness.missing + readiness.expired > 0) {
        status = "In pipeline · Onboarding";
      } else if (latestLoad?.status === "Delivered") {
        status = `Off duty · Rest stop · ${terminalLabel.split(", ")[1] ?? "PA"}`;
      }

      let complianceStatus: "ok" | "warn" | "danger" = "ok";
      let complianceLabel = "Compliant";
      let blocker = undefined;

      const openHighRisk = compliance.filter(
        (c) =>
          (c.severity.toUpperCase() === "HIGH" || c.severity.toUpperCase() === "CRITICAL") &&
          c.status.toUpperCase() !== "CLOSED"
      );

      if (readiness.missing + readiness.expired > 0) {
        complianceStatus = "danger";
        complianceLabel = "Action required";
        blocker = `${readiness.missing + readiness.expired} items need attention`;
      } else if (openHighRisk.length > 0) {
        complianceStatus = "warn";
        complianceLabel = "At risk";
        blocker = `${openHighRisk.length} incident item(s) open`;
      }

      const driverMar = moneyAtRisk.filter(
        (row) =>
          row.driverId === driver.id &&
          !["CLOSED", "RESOLVED", "PAID"].includes((row.status ?? "").toUpperCase())
      );
      const pendingFromMar = driverMar.reduce((sum, row) => sum + (row.amount ?? 0), 0);

      const pendingSettlement = settlements.find(
        (row) => row.driverId === driver.id && row.status?.toUpperCase() === "PENDING"
      );
      const pendingFromSettlement = pendingSettlement?.netPay ?? 0;
      const pendingPay = pendingFromMar > 0 ? pendingFromMar : pendingFromSettlement;
      const pendingPayReason =
        driverMar[0]?.rootCause ??
        (pendingSettlement?.pendingReason
          ? `Settlement pending: ${pendingSettlement.pendingReason}`
          : undefined);

      return {
        id: driver.id,
        name: driver.name,
        photo: (driver as { photoUrl?: string }).photoUrl?.trim() || driverPhotoPath(driver.id),
        asset: assetLabel,
        status,
        statusLink,
        compliance: {
          status: complianceStatus,
          label: complianceLabel,
          blocker,
        },
        pendingPay,
        pendingPayReason,
        actions: {
          profile: `/drivers/${driver.id}/profile`,
          hr: `/drivers/${driver.id}/hr`,
          vault: `/drivers/${driver.id}/vault`,
          safety: `/drivers/${driver.id}/safety`,
          settlements: `/drivers/${driver.id}/settlements`,
          dispatch: `/drivers/${driver.id}/dispatch`,
        },
      };
    });
  }, [data]);

  const toggleDropdown = (driverId: string) => {
    setDropdownOpen(dropdownOpen === driverId ? null : driverId);
  };

  return (
    <div className="bof-page" ref={rosterRootRef}>
      <div className="bof-roster-header">
        <h1 className="bof-title">Driver Operations Roster</h1>
        <p className="bof-lead">
          Fleet-wide operations view with dispatch status, compliance posture, and pending pay exposure.
          Use Actions to route into each driver module without leaving roster context.
        </p>
      </div>

      <div className="bof-roster-table-container">
        <table className="bof-roster-table">
          <thead>
            <tr>
              <th className="bof-roster-header-cell">Driver</th>
              <th className="bof-roster-header-cell">Asset</th>
              <th className="bof-roster-header-cell">Status</th>
              <th className="bof-roster-header-cell">Compliance</th>
              <th className="bof-roster-header-cell">Pending Pay</th>
              <th className="bof-roster-header-cell">Action</th>
            </tr>
          </thead>
          <tbody>
            {driverRows.map((driver) => (
              <tr key={driver.id} className="bof-roster-row">
                <td className="bof-roster-cell bof-roster-driver-cell">
                  <div className="bof-roster-driver">
                    <DriverAvatar name={driver.name} photoUrl={driver.photo} size={40} />
                    <div className="bof-roster-driver-info">
                      <div className="bof-roster-driver-name">{driver.name}</div>
                      <div className="bof-roster-driver-id">
                        {driver.id} · {formatCityStateFromAddress(data.drivers.find((d) => d.id === driver.id)?.address)}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="bof-roster-cell">
                  <span className="bof-roster-asset">{driver.asset}</span>
                </td>
                
                <td className="bof-roster-cell">
                  {driver.statusLink ? (
                    <Link href={driver.statusLink} className="bof-roster-status-link">
                      {driver.status}
                    </Link>
                  ) : (
                    <span className="bof-roster-status">{driver.status}</span>
                  )}
                </td>
                
                <td className="bof-roster-cell">
                  <div className="bof-roster-compliance">
                    <span className={`bof-roster-compliance-pill bof-roster-compliance-${driver.compliance.status}`}>
                      {driver.compliance.label}
                    </span>
                    {driver.compliance.blocker && (
                      <div className="bof-roster-compliance-blocker">
                        {driver.compliance.blocker}
                      </div>
                    )}
                  </div>
                </td>
                
                <td className="bof-roster-cell">
                  <span className="bof-roster-pay">
                    {driver.pendingPay > 0 ? CURRENCY.format(driver.pendingPay) : "—"}
                  </span>
                  {driver.pendingPayReason && (
                    <div className="bof-roster-pay-reason">{driver.pendingPayReason}</div>
                  )}
                </td>
                
                <td className="bof-roster-cell">
                  <div className="bof-roster-actions">
                    <button
                      type="button"
                      className="bof-roster-action-button"
                      onClick={() => toggleDropdown(driver.id)}
                      aria-expanded={dropdownOpen === driver.id}
                      aria-haspopup="true"
                    >
                      Open
                      <svg 
                        className="bof-roster-action-chevron" 
                        width="12" 
                        height="8" 
                        viewBox="0 0 12 8"
                        style={{ transform: dropdownOpen === driver.id ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      >
                        <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    
                    {dropdownOpen === driver.id && (
                      <div className="bof-roster-dropdown">
                        <Link href={driver.actions.profile} className="bof-roster-dropdown-item">
                          Profile
                        </Link>
                        <Link href={driver.actions.hr} className="bof-roster-dropdown-item">
                          HR
                        </Link>
                        <Link href={driver.actions.vault} className="bof-roster-dropdown-item">
                          Vault
                        </Link>
                        <Link href={driver.actions.safety} className="bof-roster-dropdown-item">
                          Safety
                        </Link>
                        <Link href={driver.actions.settlements} className="bof-roster-dropdown-item">
                          Settlements
                        </Link>
                        <Link href={driver.actions.dispatch} className="bof-roster-dropdown-item">
                          Dispatch
                        </Link>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
