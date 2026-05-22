import Link from "next/link";
import { MaintenanceSubnav } from "@/components/maintenance/MaintenanceSubnav";

export default function MaintenanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bof-page maint-module">
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <Link href="/dashboard">Dashboard</Link>
        <span aria-hidden> / </span>
        <span>Maintenance</span>
      </nav>
      <header className="maint-module-header">
        <h1 className="bof-title bof-title-tight">
          Asset readiness <span className="maint-teal">before dispatch</span>
        </h1>
        <p className="bof-muted bof-small">
          Equipment readiness, MAR-driven risk, and dispatch impact tied to the tractors, trailers, loads, and
          money-at-risk that decide whether work can move.
        </p>
      </header>
      <MaintenanceSubnav />
      {children}
    </div>
  );
}
