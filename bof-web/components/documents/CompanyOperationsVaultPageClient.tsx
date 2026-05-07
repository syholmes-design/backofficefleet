"use client";

import { useState, useMemo } from "react";
import { CompanyOperationsVaultDocument, COMPANY_OPERATIONS_VAULT_DOCUMENTS, getCompanyOperationsVaultSummary } from "@/lib/company-operations-vault";

export interface CompanyOperationsVaultPageProps {
  documents?: CompanyOperationsVaultDocument[];
  summaryCards?: Array<{
    title: string;
    value: string;
    description: string;
  }>;
  categories?: string[];
  acknowledgmentOverview?: Array<{
    documentTitle: string;
    acknowledged: string;
    missing: string;
  }>;
  integrationCallouts?: Array<{
    title: string;
    description?: string;
  }>;
  businessControlSection?: {
    title: string;
    body: string;
  };
}

export function CompanyOperationsVaultPageClient({
  documents = COMPANY_OPERATIONS_VAULT_DOCUMENTS,
  summaryCards = [
    {
      title: "Total Company Documents",
      value: getCompanyOperationsVaultSummary().totalDocuments.toString(),
      description: "All company-level policies and procedures"
    },
    {
      title: "Active Policies",
      value: getCompanyOperationsVaultSummary().activePolicies.toString(),
      description: "Currently active and operational documents"
    },
    {
      title: "Acknowledgments Required",
      value: getCompanyOperationsVaultSummary().acknowledgmentsRequired.toString(),
      description: "Documents requiring employee acknowledgment"
    },
    {
      title: "Reviews Due Soon",
      value: getCompanyOperationsVaultSummary().reviewsDueSoon.toString(),
      description: "Documents requiring review within 30 days"
    },
    {
      title: "Business Functions Covered",
      value: getCompanyOperationsVaultSummary().businessFunctionsCovered.length.toString(),
      description: "Operational areas with documented procedures"
    }
  ],
  categories = [
    "All",
    "HR & Employment Operations",
    "Payroll & Compensation",
    "Accounting & Finance",
    "Factoring & Receivables",
    "Insurance, Claims & Risk",
    "Vendor, Maintenance & Purchasing",
    "Safety & Compliance Governance",
    "Mission, Vision & Operating Principles"
  ],
  acknowledgmentOverview = [
    {
      documentTitle: "Employee Handbook",
      acknowledged: "9 of 12 drivers",
      missing: "3 missing"
    },
    {
      documentTitle: "Code of Conduct",
      acknowledged: "10 of 12 drivers",
      missing: "2 missing"
    },
    {
      documentTitle: "Payroll Policy",
      acknowledged: "12 of 12 drivers",
      missing: "0 missing"
    },
    {
      documentTitle: "Safety Governance Policy",
      acknowledged: "11 of 12 drivers",
      missing: "1 missing"
    }
  ],
  integrationCallouts = [
    {
      title: "HR / Payroll",
      description: "Handbook, payroll policy, onboarding/offboarding, and deductions management"
    },
    {
      title: "Dispatch",
      description: "Claims SOP, proof requirements, and incident escalation"
    },
    {
      title: "Finance",
      description: "AP/AR procedures, factoring, and receivables management"
    },
    {
      title: "Safety / Compliance",
      description: "Governance policy, driver compliance, and review cycles"
    },
    {
      title: "Maintenance / Vendors",
      description: "Purchasing policy, maintenance standards, and vendor management"
    }
  ],
  businessControlSection = {
    title: "Not just storage — business control",
    body: "The Company Operations Vault turns company documents into operating controls. Policies, SOPs, payroll procedures, factoring rules, insurance workflows, and governance materials are tied to the business functions they support, so BOF can surface what is active, what needs review, and what requires acknowledgment."
  }
}: CompanyOperationsVaultPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredDocuments = useMemo(() => {
    let filtered = documents || COMPANY_OPERATIONS_VAULT_DOCUMENTS;

    if (selectedCategory && selectedCategory !== "All") {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.businessFunction.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [documents, selectedCategory, searchTerm]);

  const handleDocumentClick = (document: CompanyOperationsVaultDocument) => {
    // Open document in new tab
    window.open(`/generated/company-operations-vault/${document.filePath}`, '_blank');
  };

  return (
    <div className="bof-page">
      <h1 className="bof-title">Company Operations Vault</h1>
      <p className="bof-lead">
        Centralize policies, SOPs, finance records, factoring materials, insurance procedures, vendor agreements, and governance documents that keep fleet back office operating.
      </p>
      <p className="bof-muted bof-small bof-oper-sublead">
        BOF connects each document to the business function it controls - HR, payroll, finance, dispatch, compliance, safety, and risk.
      </p>

      {/* Summary Cards */}
      <div className="bof-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {summaryCards.map((card, index) => (
          <div key={index} className="bof-card">
            <h3 className="bof-card-title">{card.title}</h3>
            <div className="bof-card-value">{card.value}</div>
            <p className="bof-card-description">{card.description}</p>
          </div>
        ))}
      </div>

      {/* Category Filter */}
      <div className="bof-section">
        <div className="bof-section-header">
          <h2 className="bof-h2">Document Categories</h2>
          <div className="bof-controls">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bof-select"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search company documents"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bof-input"
            />
          </div>
        </div>

        {/* Document Cards */}
        <div className="bof-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {filteredDocuments.map((document) => (
            <div key={document.id} className="bof-card">
              <h3 className="bof-card-title">{document.title}</h3>
              <div className="bof-card-meta">
                <div className="bof-card-category">{document.category}</div>
                <div className="bof-card-status">{document.status}</div>
              </div>
              <div className="bof-card-description">{document.description}</div>
              <div className="bof-card-details">
                <div className="bof-detail">
                  <span className="bof-detail-label">Owner:</span>
                  <span className="bof-detail-value">{document.ownerTeam}</span>
                </div>
                <div className="bof-detail">
                  <span className="bof-detail-label">Last Reviewed:</span>
                  <span className="bof-detail-value">{document.lastReviewed}</span>
                </div>
                <div className="bof-detail">
                  <span className="bof-detail-label">Next Review:</span>
                  <span className="bof-detail-value">{document.nextReviewDue}</span>
                </div>
                <div className="bof-detail">
                  <span className="bof-detail-label">Applies to:</span>
                  <span className="bof-detail-value">{document.appliesTo.join(", ")}</span>
                </div>
                {document.acknowledgmentRequired && (
                  <div className="bof-detail">
                    <span className="bof-detail-label">Acknowledgment:</span>
                    <span className="bof-detail-value">Required</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDocumentClick(document)}
                className="bof-button bof-button-primary"
              >
                Open / Preview
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Acknowledgment Overview */}
      {acknowledgmentOverview && acknowledgmentOverview.length > 0 && (
        <div className="bof-section">
          <div className="bof-section-header">
            <h2 className="bof-h2">Acknowledgment Overview</h2>
          </div>
          <div className="bof-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {acknowledgmentOverview.map((overview, index) => (
              <div key={index} className="bof-card">
                <h3 className="bof-card-title">{overview.documentTitle}</h3>
                <div className="bof-card-stats">
                  <div className="bof-stat">
                    <span className="bof-stat-value">{overview.acknowledged}</span>
                    <span className="bof-stat-label">Acknowledged</span>
                  </div>
                  <div className="bof-stat">
                    <span className="bof-stat-value">{overview.missing}</span>
                    <span className="bof-stat-label">Missing</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integration Callouts */}
      {integrationCallouts && integrationCallouts.length > 0 && (
        <div className="bof-section">
          <div className="bof-section-header">
            <h2 className="bof-h2">Business Integration</h2>
          </div>
          <div className="bof-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {integrationCallouts.map((callout, index) => (
              <div key={index} className="bof-card">
                <h3 className="bof-card-title">{callout.title}</h3>
                <p className="bof-card-description">{callout.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business Control Section */}
      {businessControlSection && (
        <div className="bof-section">
          <div className="bof-section-header">
            <h2 className="bof-h2">Business Integration</h2>
          </div>
          <div className="bof-callout">
            <p>{businessControlSection.body}</p>
          </div>
        </div>
      )}
    </div>
  );
}
