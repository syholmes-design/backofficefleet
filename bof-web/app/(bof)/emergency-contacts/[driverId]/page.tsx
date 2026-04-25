import { EmergencyContactCard } from "@/components/emergency-contacts/EmergencyContactCard";
import { getDriverOperationalProfile } from "@/lib/driver-operational-profile";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import Link from "next/link";

export const metadata = {
  title: "Emergency Contact | BOF",
};

export default async function EmergencyContactPage({ params }: { params: Promise<{ driverId: string }> }) {
  const { driverId } = await params;
  
  return (
    <div className="bof-page">
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <Link href="/drivers" className="bof-link-secondary">
          Drivers
        </Link>
        <span aria-hidden> / </span>
        <span>Emergency Contact</span>
      </nav>
      <header className="bof-load-header">
        <div>
          <h1 className="bof-title bof-title-tight">Emergency Contact</h1>
          <p className="bof-muted bof-small">
            Emergency contact information for driver {driverId}.
          </p>
        </div>
      </header>
      <EmergencyContactPageClient driverId={driverId} />
    </div>
  );
}

function EmergencyContactPageClient({ driverId }: { driverId: string }) {
  const { data } = useBofDemoData();
  const profile = getDriverOperationalProfile(data, driverId);

  if (!profile) {
    return (
      <div className="bof-error-state">
        <p>Driver {driverId} not found.</p>
        <Link href="/drivers" className="bof-link-secondary">
          Back to Drivers
        </Link>
      </div>
    );
  }

  return (
    <div className="ec-single-page">
      <div className="ec-single-actions">
        <Link href={`/drivers/${driverId}`} className="bof-link-secondary">
          ← Back to Driver Profile
        </Link>
        {" · "}
        <Link href="/emergency-contacts" className="bof-link-secondary">
          All Emergency Contacts
        </Link>
      </div>
      <EmergencyContactCard driver={profile} />
    </div>
  );
}
