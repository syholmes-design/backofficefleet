import type { BofData } from "@/lib/load-bof-data";

/**
 * Generate rich driver profile HTML for all drivers using BOF source of truth
 * Modeled after John Carter's canonical profile dashboard
 */

type DriverProfileFields = BofData["drivers"][0] & {
  dateOfBirth?: string;
  licenseClass?: string;
  licenseState?: string;
  bankName?: string;
  bankAccountType?: string;
  bankAccountLast4?: string;
  paymentPreference?: string;
  bankInfoStatus?: string;
  taxClassification?: string;
  tinType?: string;
  emergencyContactEmail?: string;
  emergencyContactAddress?: string;
  secondaryContactName?: string;
  secondaryContactRelationship?: string;
  secondaryContactPhone?: string;
  secondaryContactEmail?: string;
  secondaryContactAddress?: string;
};

export function generateDriverProfileHTML(driver: DriverProfileFields): string {
  const initials = driver.name.split(" ").map(n => n[0]).join("");
  const addressParts = driver.address.split(",");
  const city = addressParts[1]?.trim() || "";
  const stateZip = addressParts[2]?.trim() || "";
  const state = stateZip.split(" ")[0] || "";
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${driver.name} – Driver Profile Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #814BE7;
      --primary-light: #C17BFD;
      --bg: #F7F7F7;
      --card-bg: #FFFFFF;
      --text: #1F1F24;
      --text-muted: #6E7191;
      --border: #E2E4ED;
      --success: #34C563;
      --warning: #F59E0B;
      --danger: #E73B4F;
      --info: #3B82F6;
      --radius: 12px;
      --shadow: 0 0 0 1px var(--border), 0 2px 8px rgba(7,2,23,0.05);
      --shadow-hover: 0 0 0 1px var(--border), 0 4px 16px rgba(7,2,23,0.10);
      --font: 'Open Sans', system-ui, -apple-system, sans-serif;
    }
    @media (prefers-color-scheme: dark) {
      :root:not(.light) {
        --bg: #1E2235;
        --card-bg: #2D3148;
        --text: #E2E4ED;
        --text-muted: #A2A7BD;
        --border: #484D66;
        --shadow: 0 0 0 1px var(--border), 0 2px 8px rgba(7,2,23,0.15);
        --shadow-hover: 0 0 0 1px var(--border), 0 4px 16px rgba(7,2,23,0.25);
      }
    }
    :root.dark {
      --bg: #1E2235;
      --card-bg: #2D3148;
      --text: #E2E4ED;
      --text-muted: #A2A7BD;
      --border: #484D66;
      --shadow: 0 0 0 1px var(--border), 0 2px 8px rgba(7,2,23,0.15);
      --shadow-hover: 0 0 0 1px var(--border), 0 4px 16px rgba(7,2,23,0.25);
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font);
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    .header {
      text-align: center;
      margin-bottom: 3rem;
    }
    .logo-mark {
      display: inline-block;
      width: 48px;
      height: 48px;
      background: var(--primary);
      color: white;
      border-radius: 12px;
      font-weight: 700;
      font-size: 20px;
      line-height: 48px;
      margin-bottom: 1rem;
    }
    .title {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    .subtitle {
      color: var(--text-muted);
      font-size: 0.9rem;
    }
    .profile-header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 2rem;
      padding: 2rem;
      background: var(--card-bg);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }
    .driver-avatar {
      width: 80px;
      height: 80px;
      background: var(--primary);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: 600;
    }
    .driver-name-block h2 {
      font-size: 1.5rem;
      margin-bottom: 0.25rem;
    }
    .driver-name-block p {
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }
    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-badge.valid {
      background: var(--success);
      color: white;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .card {
      background: var(--card-bg);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 1.5rem;
      transition: box-shadow 0.2s;
    }
    .card:hover {
      box-shadow: var(--shadow-hover);
    }
    .card-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: var(--primary);
    }
    .info-grid {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 0.75rem;
    }
    .info-label {
      font-weight: 600;
      color: var(--text-muted);
      font-size: 0.9rem;
    }
    .info-value {
      font-weight: 500;
    }
    .contact-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border);
    }
    .contact-item:last-child {
      border-bottom: none;
    }
    .footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
      color: var(--text-muted);
      font-size: 0.8rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div class="logo-mark">BOF</div>
      <div>
        <h1 class="title">${driver.name} — Driver Profile Dashboard</h1>
        <p class="subtitle">Professional Driver Profile &amp; Compliance Overview | Driver ID: ${driver.id} | BackOfficeFleet Demo</p>
      </div>
    </header>

    <section class="profile-header">
      <div class="driver-avatar">${initials}</div>
      <div class="driver-name-block">
        <h2>${driver.name}</h2>
        <p>${driver.id} &bull; ${city}, ${state}</p>
        <div class="status-badge valid">VALID</div>
      </div>
    </section>

    <div class="grid">
      <div class="card">
        <h3 class="card-title">Personal Information</h3>
        <div class="info-grid">
          <div class="info-label">Full Name</div>
          <div class="info-value">${driver.name}</div>
          
          <div class="info-label">Driver ID</div>
          <div class="info-value">${driver.id}</div>
          
          <div class="info-label">Address</div>
          <div class="info-value">${driver.address}</div>
          
          <div class="info-label">Phone</div>
          <div class="info-value">${driver.phone}</div>
          
          <div class="info-label">Email</div>
          <div class="info-value">${driver.email}</div>
          
          <div class="info-label">Date of Birth</div>
          <div class="info-value">${driver.dateOfBirth}</div>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">License Information</h3>
        <div class="info-grid">
          <div class="info-label">License Class</div>
          <div class="info-value">${driver.licenseClass}</div>
          
          <div class="info-label">License State</div>
          <div class="info-value">${driver.licenseState}</div>
          
          <div class="info-label">CDL Number</div>
          <div class="info-value">${driver.referenceCdlNumber}</div>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">Banking Information</h3>
        <div class="info-grid">
          <div class="info-label">Bank Name</div>
          <div class="info-value">${driver.bankName}</div>
          
          <div class="info-label">Account Type</div>
          <div class="info-value">${driver.bankAccountType}</div>
          
          <div class="info-label">Account Last 4</div>
          <div class="info-value">****${driver.bankAccountLast4}</div>
          
          <div class="info-label">Payment Preference</div>
          <div class="info-value">${driver.paymentPreference}</div>
          
          <div class="info-label">Bank Info Status</div>
          <div class="info-value">${driver.bankInfoStatus}</div>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">Tax Information</h3>
        <div class="info-grid">
          <div class="info-label">Tax Classification</div>
          <div class="info-value">${driver.taxClassification}</div>
          
          <div class="info-label">TIN Type</div>
          <div class="info-value">${driver.tinType}</div>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">Emergency Contact</h3>
        <div class="contact-item">
          <span>Name</span>
          <span>${driver.emergencyContactName}</span>
        </div>
        <div class="contact-item">
          <span>Relationship</span>
          <span>${driver.emergencyContactRelationship}</span>
        </div>
        <div class="contact-item">
          <span>Phone</span>
          <span>${driver.emergencyContactPhone}</span>
        </div>
        <div class="contact-item">
          <span>Email</span>
          <span>${driver.emergencyContactEmail}</span>
        </div>
        <div class="contact-item">
          <span>Address</span>
          <span>${driver.emergencyContactAddress}</span>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">Secondary Contact</h3>
        <div class="contact-item">
          <span>Name</span>
          <span>${driver.secondaryContactName}</span>
        </div>
        <div class="contact-item">
          <span>Relationship</span>
          <span>${driver.secondaryContactRelationship}</span>
        </div>
        <div class="contact-item">
          <span>Phone</span>
          <span>${driver.secondaryContactPhone}</span>
        </div>
        <div class="contact-item">
          <span>Email</span>
          <span>${driver.secondaryContactEmail}</span>
        </div>
        <div class="contact-item">
          <span>Address</span>
          <span>${driver.secondaryContactAddress}</span>
        </div>
      </div>
    </div>

    <footer class="footer">
      <p>BackOfficeFleet Driver Profile Dashboard | Generated: ${new Date().toLocaleDateString()} | This is a demo profile for illustration purposes</p>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Generate rich driver profiles for all drivers and update the demo data
 */
export function generateAllDriverProfiles(data: BofData): BofData {
  const updatedData = { ...data };
  
  // Update each driver's profile URL to point to the rich profile
  updatedData.documents = updatedData.documents.map(doc => {
    if (doc.type === "Driver profile (HTML)") {
      const driver = updatedData.drivers.find(d => d.id === doc.driverId);
      if (driver) {
        return {
          ...doc,
          fileUrl: `/documents/drivers/${doc.driverId}/${doc.driverId.toLowerCase()}-profile-dashboard.html`,
          previewUrl: `/documents/drivers/${doc.driverId}/${doc.driverId.toLowerCase()}-profile-dashboard.html`,
        };
      }
    }
    return doc;
  });
  
  return updatedData;
}
