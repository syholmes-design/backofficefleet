import type { DriverWithEC } from "@/lib/emergency-contacts/drivers";

export function EmergencyContactCard({ driver }: { driver: DriverWithEC }) {
  const initials = `${driver.firstName[0] ?? ""}${driver.lastName[0] ?? ""}`.toUpperCase();

  return (
    <article className="ec-card-shell" aria-label={`Emergency contact card for ${driver.fullName}`}>
      <div className="ec-top-bar">
        <h2>Emergency Contact Card</h2>
        <span className="ec-driver-badge">{driver.id}</span>
      </div>

      <section className="ec-driver-section">
        <div className="ec-driver-header">
          <div className="ec-avatar">{initials}</div>
          <div>
            <p className="ec-driver-name">{driver.fullName}</p>
            <p className="ec-driver-meta">
              {driver.id} • {driver.licenseClass} • {driver.licenseNumber} ({driver.licenseState})
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
            <span className="ec-info-value">{driver.fullAddress}</span>
          </div>
          <div className="ec-info-row">
            <span className="ec-info-label">DOB</span>
            <span className="ec-info-value">{driver.dob}</span>
          </div>
          <div className="ec-info-row">
            <span className="ec-info-label">CDL</span>
            <span className="ec-info-value">
              {driver.licenseClass} {driver.licenseNumber} ({driver.licenseState})
            </span>
          </div>
          <div className="ec-info-row">
            <span className="ec-info-label">Gender</span>
            <span className="ec-info-value">{driver.gender}</span>
          </div>
        </div>
      </section>

      <div className="ec-physical-strip">
        <div className="ec-phys-item">
          <span className="ec-phys-label">Hair</span>
          <span className="ec-phys-value">{driver.hair}</span>
        </div>
        <span className="ec-phys-divider">|</span>
        <div className="ec-phys-item">
          <span className="ec-phys-label">Eyes</span>
          <span className="ec-phys-value">{driver.eyes}</span>
        </div>
        <span className="ec-phys-divider">|</span>
        <div className="ec-phys-item">
          <span className="ec-phys-label">Height</span>
          <span className="ec-phys-value">{driver.height}</span>
        </div>
        <span className="ec-phys-divider">|</span>
        <div className="ec-phys-item">
          <span className="ec-phys-label">Weight</span>
          <span className="ec-phys-value">{driver.weight} lbs</span>
        </div>
        <span className="ec-phys-divider">|</span>
        <div className="ec-phys-item">
          <span className="ec-phys-label">Ethnicity</span>
          <span className="ec-phys-value">{driver.ethnicity}</span>
        </div>
      </div>

      <section className="ec-section">
        <p className="ec-section-title">Emergency Contacts</p>
        <div className="ec-grid">
          <div className="ec-contact-card ec-contact-card-primary">
            <p className="ec-tier-label">Primary Contact</p>
            <p>
              <span className="ec-contact-name">{driver.primaryContact.name}</span>
              <span className="ec-contact-rel">({driver.primaryContact.relationship})</span>
            </p>
            <p className="ec-contact-phone">{driver.primaryContact.phone}</p>
            <p className="ec-contact-detail">
              <a href={`mailto:${driver.primaryContact.email}`}>{driver.primaryContact.email}</a>
              <br />
              {driver.primaryContact.address}
            </p>
          </div>

          <div className="ec-contact-card ec-contact-card-secondary">
            <p className="ec-tier-label">Secondary Contact</p>
            <p>
              <span className="ec-contact-name">{driver.secondaryContact.name}</span>
              <span className="ec-contact-rel">({driver.secondaryContact.relationship})</span>
            </p>
            <p className="ec-contact-phone">{driver.secondaryContact.phone}</p>
            <p className="ec-contact-detail">
              <a href={`mailto:${driver.secondaryContact.email}`}>{driver.secondaryContact.email}</a>
              <br />
              {driver.secondaryContact.address}
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

