"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
  pendingPay: string;
  actions: {
    profile: string;
    hr: string;
    vault: string;
    safety: string;
    settlements: string;
    dispatch?: string;
  };
};

export function DriversRosterTable() {
  const { data } = useBofDemoData();
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  const driverRows = useMemo(() => {
    return data.drivers.map((driver) => {
      const documents = getOrderedDocumentsForDriver(data, driver.id);
      const readiness = readinessFromDocuments(documents);
      const trucks = assignedTrucksForDriver(data, driver.id);
      const primary = primaryAssignedTruck(data, driver.id);
      const compliance = complianceNotesForDriver(data, driver.id);
      
      // Asset assignment
      const assetLabel = trucks.length === 0 
        ? "Unassigned" 
        : trucks.length === 1 
          ? trucks[0] 
          : `${primary ?? trucks[0]} (${trucks.length} assets)`;

      // Current operational status
      const activeLoad = data.loads.find(l => l.driverId === driver.id && (l.status === "En Route" || l.status === "Pending"));
      let status = "Available · Terminal";
      let statusLink = undefined;
      
      if (activeLoad) {
        if (activeLoad.status === "En Route") {
          status = `In transit · ${activeLoad.number}`;
          statusLink = `/loads/${activeLoad.id}`;
        } else {
          status = `At receiver · ${activeLoad.destination || "Destination"}`;
          statusLink = `/loads/${activeLoad.id}`;
        }
      } else if (readiness.missing + readiness.expired > 0) {
        status = "In pipeline · Onboarding";
      }

      // Compliance status
      let complianceStatus: "ok" | "warn" | "danger" = "ok";
      let complianceLabel = "Compliant";
      let blocker = undefined;
      
      if (readiness.missing + readiness.expired > 0) {
        complianceStatus = "danger";
        complianceLabel = "Action required";
        blocker = `${readiness.missing + readiness.expired} items need attention`;
      } else if (compliance.some(c => c.severity.toUpperCase() === "HIGH" && c.status.toUpperCase() !== "CLOSED")) {
        complianceStatus = "warn";
        complianceLabel = "At risk";
        blocker = "Compliance items need review";
      }

      // Pending pay (mock data for now - would come from settlements)
      const pendingPay = Math.floor(Math.random() * 2000) + 500;

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
          blocker
        },
        pendingPay: `$${pendingPay}`,
        actions: {
          profile: `/drivers/${driver.id}`,
          hr: `/emergency-contacts/${driver.id}`,
          vault: `/documents`,
          safety: `/safety`,
          settlements: `/settlements`,
          dispatch: activeLoad ? `/loads/${activeLoad.id}` : undefined
        }
      };
    });
  }, [data]);

  const toggleDropdown = (driverId: string) => {
    setDropdownOpen(dropdownOpen === driverId ? null : driverId);
  };

  return (
    <div className="bof-page">
      <div className="bof-roster-header">
        <h1 className="bof-title">Drivers</h1>
        <p className="bof-lead">
          Fleet-wide driver roster with operational status, compliance, and settlement data. 
          Individual driver details available through profile actions.
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
                      <div className="bof-roster-driver-id">{driver.id}</div>
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
                  <span className="bof-roster-pay">{driver.pendingPay}</span>
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
                      Actions
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
                        {driver.actions.dispatch && (
                          <Link href={driver.actions.dispatch} className="bof-roster-dropdown-item">
                            Current Load
                          </Link>
                        )}
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
