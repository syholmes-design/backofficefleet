import type { DriverOperationalProfile } from "@/lib/driver-operational-profile";

export function EmergencyContactCard({ driver }: { driver: DriverOperationalProfile }) {
  const parts = driver.fullName.split(" ");
  const initials = `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();

  return (
    <article className="ec-card-shell" aria-label={`Emergency contact card for ${driver.fullName}`}>
      <div className="ec-top-bar">
        <h2>Emergency Contact Card</h2>
        <span className="ec-driver-badge">{driver.driverId}</span>
      </div>

      <section className="ec-driver-section">
        <div className="ec-driver-header">
          <div className="ec-avatar">{initials}</div>
          <div>
            <p className="ec-driver-name">{driver.fullName}</p>
            <p className="ec-driver-meta">
              {driver.driverId} • {driver.licenseClass} • {driver.licenseNumber} ({driver.licenseState})
            </p>
          </div>
        </div>

        <div className="ec-info-grid">
          <div className="ec-info-row">
            <span className="ec-info-label">Phone</span>
            <span className="ec-info-value">{driver.phone}</span>
          </div>
          <div className="ec-info-row">
            <span className="ec-info-label">Email</span>
            <span className="ec-info-value">{driver.email}</span>
          </div>
          <div className="ec-info-row">
            <span className="ec-info-label">Address</span>
            <span className="ec-info-value">{driver.address || "Not on file"}</span>
          </div>
          <div className="ec-info-row">
            <span className="ec-info-label">DOB</span>
            <span className="ec-info-value">{driver.dob || "Not on file"}</span>
          </div>
          <div className="ec-info-row">
            <span className="ec-info-label">CDL</span>
            <span className="ec-info-value">
              {driver.licenseClass} {driver.licenseNumber} ({driver.licenseState})
            </span>
          </div>
        </div>
      </section>

      <section className="ec-section">
        <p className="ec-section-title">Emergency Contacts</p>
        <div className="ec-grid">
          <div className="ec-contact-card ec-contact-card-primary">
            <p className="ec-tier-label">Primary Contact</p>
            <p>
              <span className="ec-contact-name">{driver.primaryEmergencyName || "Not on file"}</span>
              <span className="ec-contact-rel">
                ({driver.primaryEmergencyRelationship || "Not on file"})
              </span>
            </p>
            <p className="ec-contact-phone">{driver.primaryEmergencyPhone || "Not on file"}</p>
            <p className="ec-contact-detail">
              {driver.primaryEmergencyEmail ? (
                <a href={`mailto:${driver.primaryEmergencyEmail}`}>{driver.primaryEmergencyEmail}</a>
              ) : (
                "Not on file"
              )}
              <br />
              {driver.primaryEmergencyAddress || "Not on file"}
            </p>
          </div>

          <div className="ec-contact-card ec-contact-card-secondary">
            <p className="ec-tier-label">Secondary Contact</p>
            <p>
              <span className="ec-contact-name">{driver.secondaryEmergencyName || "Not on file"}</span>
              <span className="ec-contact-rel">
                ({driver.secondaryEmergencyRelationship || "Not on file"})
              </span>
            </p>
            <p className="ec-contact-phone">{driver.secondaryEmergencyPhone || "Not on file"}</p>
            <p className="ec-contact-detail">
              {driver.secondaryEmergencyEmail ? (
                <a href={`mailto:${driver.secondaryEmergencyEmail}`}>{driver.secondaryEmergencyEmail}</a>
              ) : (
                "Not on file"
              )}
              <br />
              {driver.secondaryEmergencyAddress || "Not on file"}
            </p>
          </div>
        </div>
      </section>

      <footer className="ec-footer">
        <span>
          BackOfficeFleet • Confidential — Authorized Personnel Only • Last Updated: 04/21/2026
        </span>
        <span className="ec-active-badge">Active</span>
      </footer>
    </article>
  );
}

