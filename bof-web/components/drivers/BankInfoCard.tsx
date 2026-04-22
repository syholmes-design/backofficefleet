import type { BankInfoData } from "@/lib/bank-info/bankInfoData";

function maskAccount(account: string): string {
  const digits = account.replace(/\D/g, "");
  if (!digits) return "••••••0000";
  const tail = digits.slice(-4);
  return `••••••${tail}`;
}

function initials(fullName: string): string {
  const parts = fullName.split(" ").filter(Boolean);
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

function checkNumberFromDriverId(driverId: string): string {
  const idx = Number(driverId.replace("DRV-", "")) || 1;
  return String(1000 + idx * 7);
}

export function BankInfoCard({ data }: { data: BankInfoData }) {
  const fullAddress = `${data.streetAddress}, ${data.city}, ${data.state} ${data.zip}`;
  const masked = maskAccount(data.accountNumber);
  const checkNo = checkNumberFromDriverId(data.driverId);
  const micr = `${data.routingNumber} ${masked.replace(/•/g, "")} ${checkNo}`;

  return (
    <article className="bank-card-shell" aria-label={`Bank information card for ${data.fullName}`}>
      <div className="bank-card-top-bar">
        <h1>Bank Information Card</h1>
        <span className="bank-card-driver-badge">{data.driverId}</span>
      </div>

      <section className="bank-card-driver-section">
        <div className="bank-card-driver-header">
          <div className="bank-card-avatar">{initials(data.fullName)}</div>
          <div>
            <p className="bank-card-driver-name">{data.fullName}</p>
            <p className="bank-card-driver-meta">{data.driverId} • BackOfficeFleet Driver</p>
          </div>
        </div>

        <div className="bank-card-info-grid">
          <div className="bank-card-info-row">
            <span className="bank-card-info-label">Address</span>
            <span className="bank-card-info-value">{fullAddress}</span>
          </div>
          <div className="bank-card-info-row">
            <span className="bank-card-info-label">Phone</span>
            <span className="bank-card-info-value">{data.phone}</span>
          </div>
          <div className="bank-card-info-row">
            <span className="bank-card-info-label">Email</span>
            <span className="bank-card-info-value">{data.email}</span>
          </div>
          <div className="bank-card-info-row">
            <span className="bank-card-info-label">Payment</span>
            <span className="bank-card-info-value">{data.paymentPreference}</span>
          </div>
        </div>
      </section>

      <section className="bank-card-banking-section">
        <h2 className="bank-card-section-title">Banking Details</h2>
        <div className="bank-card-bank-grid">
          <div className="bank-card-bank-field">
            <span className="bank-card-bank-label">Bank Name</span>
            <span className="bank-card-bank-value">{data.bankName}</span>
          </div>
          <div className="bank-card-bank-field">
            <span className="bank-card-bank-label">Account Type</span>
            <span
              className={
                data.accountType === "Checking"
                  ? "bank-card-acct-badge bank-card-acct-badge-checking"
                  : "bank-card-acct-badge bank-card-acct-badge-savings"
              }
            >
              {data.accountType}
            </span>
          </div>
          <div className="bank-card-bank-field">
            <span className="bank-card-bank-label">Routing Number</span>
            <span className="bank-card-bank-value bank-card-mono">{data.routingNumber}</span>
          </div>
          <div className="bank-card-bank-field">
            <span className="bank-card-bank-label">Account Number</span>
            <span className="bank-card-bank-value bank-card-mono">{masked}</span>
          </div>
          <div className="bank-card-bank-field">
            <span className="bank-card-bank-label">Submission Date</span>
            <span className="bank-card-bank-value">{data.submissionDate}</span>
          </div>
          <div className="bank-card-bank-field">
            <span className="bank-card-bank-label">Verification Status</span>
            <span className="bank-card-status-badge">
              <span className="bank-card-status-dot" />
              Verified
            </span>
          </div>
        </div>
      </section>

      <section className="bank-card-check-section">
        <h2 className="bank-card-section-title">Voided Check — Visual Verification</h2>
        <div className="bank-card-check-container">
          <div className="bank-card-void-watermark">VOID</div>
          <div className="bank-card-check-inner">
            <div className="bank-card-check-top">
              <div className="bank-card-check-payer">
                <div className="bank-card-check-payer-name">{data.fullName}</div>
                <div>{data.streetAddress}</div>
                <div>
                  {data.city}, {data.state} {data.zip}
                </div>
              </div>
              <div>
                <div className="bank-card-check-bank-name">{data.bankName}</div>
                <div className="bank-card-check-number">No. {checkNo}</div>
              </div>
            </div>

            <div className="bank-card-check-middle">
              <div className="bank-card-check-date-line">
                <span className="bank-card-check-date-label">Date</span>
                <div className="bank-card-check-date-box">___ / ___ / ______</div>
              </div>
              <div className="bank-card-check-payto">
                <span className="bank-card-check-payto-label">
                  Pay to the
                  <br />
                  Order of
                </span>
                <div className="bank-card-check-payto-line" />
                <div className="bank-card-check-amount-box">$ ______</div>
              </div>
            </div>

            <div>
              <div className="bank-card-check-memo-sig">
                <div className="bank-card-check-memo">
                  <span className="bank-card-check-memo-label">Memo</span>
                  <div className="bank-card-check-memo-line" />
                </div>
                <div className="bank-card-check-sig-line" />
              </div>
              <div className="bank-card-check-micr">
                <span className="bank-card-micr-text">{micr}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bank-card-w9-strip">
        <div className="bank-card-w9-item">
          <span className="bank-card-w9-label">Tax Classification</span>
          <span className="bank-card-w9-value">{data.taxClassification}</span>
        </div>
        <div className="bank-card-w9-item">
          <span className="bank-card-w9-label">TIN Type</span>
          <span className="bank-card-w9-value">{data.tinType}</span>
        </div>
        <div className="bank-card-w9-item">
          <span className="bank-card-w9-label">W-9 Status</span>
          <span className="bank-card-w9-badge">✓ Received</span>
        </div>
      </div>

      <footer className="bank-card-footer">
        <span className="bank-card-footer-brand">BackOfficeFleet</span> — Bank Information Card •
        Confidential
      </footer>
    </article>
  );
}

