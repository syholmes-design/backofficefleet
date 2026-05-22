import { COMPANY_OPERATIONS_VAULT_DOCUMENTS, getCompanyOperationsVaultSummary } from "@/lib/company-operations-vault";
import { CompanyOperationsVaultPageClient } from "@/components/documents/CompanyOperationsVaultPageClient";

export const metadata = {
  title: "Company Operations Vault | BOF",
  description: "Company-wide policies, SOPs, and governance documents",
};

export default function CompanyOperationsVaultPage() {
  const summary = getCompanyOperationsVaultSummary();

  return (
    <CompanyOperationsVaultPageClient
      documents={COMPANY_OPERATIONS_VAULT_DOCUMENTS}
      summaryCards={[
        {
          title: "Total Company Documents",
          value: summary.totalDocuments.toString(),
          description: "All company-level policies and procedures"
        },
        {
          title: "Active Policies",
          value: summary.activePolicies.toString(),
          description: "Currently active and operational documents"
        },
        {
          title: "Acknowledgments Required",
          value: summary.acknowledgmentsRequired.toString(),
          description: "Documents requiring employee acknowledgment"
        },
        {
          title: "Reviews Due Soon",
          value: summary.reviewsDueSoon.toString(),
          description: "Documents requiring review within 30 days"
        },
        {
          title: "Business Functions Covered",
          value: summary.businessFunctionsCovered.length.toString(),
          description: "Operational areas with documented procedures"
        }
      ]}
      categories={[
        "All",
        "HR & Employment Operations",
        "Payroll & Compensation",
        "Accounting & Finance",
        "Factoring & Receivables",
        "Insurance, Claims & Risk",
        "Vendor, Maintenance & Purchasing",
        "Safety & Compliance Governance",
        "Mission, Vision & Operating Principles",
        "IT, Security, Privacy & AI Governance"
      ]}
      acknowledgmentOverview={[
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
        },
        {
          documentTitle: "Acceptable Use of Company Systems",
          acknowledged: "8 of 12 drivers",
          missing: "4 missing"
        },
        {
          documentTitle: "AI Use and Automation Governance Policy",
          acknowledged: "6 of 12 drivers",
          missing: "6 missing"
        },
        {
          documentTitle: "Driver Worker Classification and Owner-Operator Engagement Policy",
          acknowledged: "12 of 12 drivers",
          missing: "0 missing"
        }
      ]}
      integrationCallouts={[
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
        },
        {
          title: "IT / Privacy / AI",
          description: "Security governance, data protection, and AI automation controls"
        },
        {
          title: "Worker Classification / Owner-Operators",
          description: "Driver classification procedures and owner-operator engagement policies"
        }
      ]}
      businessControlSection={{
        title: "Not just storage — business control",
        body: "The Company Operations Vault turns company documents into operating controls. Policies, SOPs, payroll procedures, factoring rules, insurance workflows, and governance materials are tied to the business functions they support, so BOF can surface what is active, what needs review, and what requires acknowledgment."
      }}
    />
  );
}
