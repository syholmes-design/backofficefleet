import Link from "next/link";
import type { CommandCenterIssueViewModel } from "@/lib/command-center/command-center-issue-view-model";

interface CommandCenterActionBoardProps {
  issues: CommandCenterIssueViewModel[];
  backhaulAlert?: {
    title: string;
    severity: string;
    reason: string;
    recommendedFix: string;
  };
}

export function CommandCenterActionBoard({ issues, backhaulAlert }: CommandCenterActionBoardProps) {
  // Get top priority issues (first 6)
  const priorityIssues = issues.slice(0, 6);

  // Helper to get route based on issue type
  const getIssueRoute = (issue: CommandCenterIssueViewModel) => {
    switch (issue.issueType) {
      case 'settlement':
        return '/settlements';
      case 'driver_compliance':
        return '/drivers';
      case 'proof_documents':
        return '/dispatch';
      case 'safety_claims':
        return '/safety';
      case 'revenue':
        return '/settlements';
      default:
        return '/command-center';
    }
  };

  // Helper to get priority color
  const getPriorityColor = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return '#ef4444';
      case 'High':
        return '#fb923c';
      case 'Medium':
        return '#fbbf24';
      case 'Watch':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  return (
    <section>
      <h2 style={{
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#ffffff',
        margin: '0 0 1rem 0'
      }}>
        What Needs Attention Now
      </h2>

      {/* Backhaul Alert if present */}
      {backhaulAlert && (
        <div style={{
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: 'rgba(251, 146, 60, 0.1)',
          border: '1px solid rgba(251, 146, 60, 0.3)',
          borderRadius: '8px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '0.5rem'
          }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#fb923c',
              margin: '0'
            }}>
              {backhaulAlert.title}
            </h3>
            <span style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: 'rgba(251, 146, 60, 0.2)',
              border: '1px solid rgba(251, 146, 60, 0.4)',
              borderRadius: '4px',
              fontSize: '0.7rem',
              color: '#fb923c',
              fontWeight: '500',
              textTransform: 'uppercase'
            }}>
              {backhaulAlert.severity}
            </span>
          </div>
          <p style={{
            fontSize: '0.9rem',
            color: 'rgba(255, 255, 255, 0.8)',
            margin: '0 0 0.5rem 0'
          }}>
            {backhaulAlert.reason}
          </p>
          <p style={{
            fontSize: '0.85rem',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: '0'
          }}>
            <strong>Recommended fix:</strong> {backhaulAlert.recommendedFix}
          </p>
        </div>
      )}

      {/* Action Board */}
      <div style={{
        display: 'grid',
        gap: '1rem'
      }}>
        {priorityIssues.map((issue) => (
          <div
            key={issue.id}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '1rem',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '1rem',
              alignItems: 'flex-start'
            }}>
              {/* Main Content */}
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: `${getPriorityColor(issue.severityLabel)}20`,
                    border: `1px solid ${getPriorityColor(issue.severityLabel)}40`,
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    color: getPriorityColor(issue.severityLabel),
                    fontWeight: '500',
                    textTransform: 'uppercase'
                  }}>
                    {issue.severityLabel}
                  </span>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#ffffff',
                    margin: '0'
                  }}>
                    {issue.headline}
                  </h3>
                </div>

                <p style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255, 255, 255, 0.8)',
                  margin: '0 0 0.5rem 0',
                  lineHeight: '1.4'
                }}>
                  {issue.whyItMatters}
                </p>

                {issue.exposureLabel && (
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#fb923c',
                    marginBottom: '0.5rem'
                  }}>
                    <strong>Impact:</strong> {issue.exposureLabel}
                  </div>
                )}

                {issue.recommendedFix && (
                  <div style={{
                    fontSize: '0.85rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '0.5rem'
                  }}>
                    <strong>Next move:</strong> {issue.recommendedFix}
                  </div>
                )}

                {/* Status Chips */}
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                  marginTop: '0.5rem'
                }}>
                  {issue.driverId && (
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      color: '#3b82f6'
                    }}>
                      Driver: {issue.driverId}
                    </span>
                  )}
                  {issue.loadId && (
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      backgroundColor: 'rgba(168, 85, 247, 0.2)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      color: '#a855f7'
                    }}>
                      Load: {issue.loadId}
                    </span>
                  )}
                  <span style={{
                    padding: '0.2rem 0.5rem',
                    backgroundColor: 'rgba(107, 114, 128, 0.2)',
                    border: '1px solid rgba(107, 114, 128, 0.3)',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    color: '#9ca3af'
                  }}>
                    {issue.issueType.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <Link
                href={getIssueRoute(issue)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '6px',
                  color: '#22c55e',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                Review →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Compact Bar Chart */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#ffffff',
          margin: '0 0 1rem 0'
        }}>
          Open Exception Summary
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem'
        }}>
          {[
            { label: 'Revenue at Risk', count: issues.filter(i => i.exposureLabel).length, color: '#fb923c' },
            { label: 'Loads Missing Proof', count: issues.filter(i => i.issueType === 'proof_documents').length, color: '#a855f7' },
            { label: 'Drivers Under Review', count: new Set(issues.filter(i => i.driverId).map(i => i.driverId)).size, color: '#3b82f6' },
            { label: 'Critical Issues', count: issues.filter(i => i.severityLabel === 'Critical').length, color: '#ef4444' }
          ].map((item, index) => (
            <div key={index} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '700',
                color: item.color,
                marginBottom: '0.25rem'
              }}>
                {item.count}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
