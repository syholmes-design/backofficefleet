import { formatUsd } from "@/lib/format-money";

interface CommandCenterKpisProps {
  criticalIssues: number;
  revenueAtRisk: number;
  driversBlocked: number;
  loadsMissingProof: number;
}

export function CommandCenterKpis({
  criticalIssues,
  revenueAtRisk,
  driversBlocked,
  loadsMissingProof
}: CommandCenterKpisProps) {
  return (
    <section style={{ marginBottom: '2rem' }}>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#ffffff',
        margin: '0 0 1rem 0'
      }}>
        Operational KPIs
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          padding: '1rem'
        }}>
          <div style={{
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '0.25rem'
          }}>
            Critical Issues
          </div>
          <div style={{
            fontSize: '1.8rem',
            fontWeight: '700',
            color: '#ef4444',
            marginBottom: '0.25rem'
          }}>
            {criticalIssues}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            Requires immediate attention
          </div>
        </div>

        <div style={{
          backgroundColor: 'rgba(251, 146, 60, 0.1)',
          border: '1px solid rgba(251, 146, 60, 0.2)',
          borderRadius: '8px',
          padding: '1rem'
        }}>
          <div style={{
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '0.25rem'
          }}>
            Revenue at Risk
          </div>
          <div style={{
            fontSize: '1.8rem',
            fontWeight: '700',
            color: '#fb923c',
            marginBottom: '0.25rem'
          }}>
            {formatUsd(revenueAtRisk)}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            Settlement & proof exposure
          </div>
        </div>

        <div style={{
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '8px',
          padding: '1rem'
        }}>
          <div style={{
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '0.25rem'
          }}>
            Drivers Blocked / Under Review
          </div>
          <div style={{
            fontSize: '1.8rem',
            fontWeight: '700',
            color: '#3b82f6',
            marginBottom: '0.25rem'
          }}>
            {driversBlocked}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            Unique drivers flagged
          </div>
        </div>

        <div style={{
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          borderRadius: '8px',
          padding: '1rem'
        }}>
          <div style={{
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '0.25rem'
          }}>
            Loads Missing Proof
          </div>
          <div style={{
            fontSize: '1.8rem',
            fontWeight: '700',
            color: '#a855f7',
            marginBottom: '0.25rem'
          }}>
            {loadsMissingProof}
          </div>
          <div style={{
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            Proof gaps requiring attention
          </div>
        </div>
      </div>
    </section>
  );
}
