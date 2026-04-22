import { EmergencyContactList } from "@/components/emergency-contacts/EmergencyContactList";
import { emergencyContactDrivers } from "@/lib/emergency-contacts/drivers";

export const metadata = {
  title: "Emergency Contacts | BOF",
};

export default function EmergencyContactsPage() {
  return (
    <div className="bof-page">
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <span>Drivers</span>
        <span aria-hidden> / </span>
        <span>Emergency Contacts</span>
      </nav>
      <header className="bof-load-header">
        <div>
          <h1 className="bof-title bof-title-tight">Emergency Contacts</h1>
          <p className="bof-muted bof-small">
            BOF emergency contact cards aligned to the copied DRV reference HTML templates.
          </p>
        </div>
      </header>
      <EmergencyContactList drivers={emergencyContactDrivers} />
    </div>
  );
}

