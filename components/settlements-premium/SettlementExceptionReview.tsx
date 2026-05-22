"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Users, DollarSign, FileText, Clock, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { DriverSettlementRow } from "./SettlementsCommandCenter";

interface SettlementExceptionReviewProps {
  settlementRows: DriverSettlementRow[];
}

interface PolicyReference {
  title: string;
  path: string;
  section?: string;
  description: string;
}

interface SettlementException {
  id: string;
  type: "family-support" | "missing-proof" | "large-deduction" | "settlement-hold" | "low-net" | "data-mismatch";
  title: string;
  description: string;
  affectedDrivers: string[];
  amount?: number;
  severity: "high" | "medium" | "low";
  status: "pending" | "under-review" | "resolved";
  nextAction: string;
  cta: string;
  ctaLink?: string;
  policyReference?: PolicyReference;
}

interface PolicyAccordionProps {
  policyReference: PolicyReference;
  exceptionType: string;
}

function PolicyAccordion({ policyReference, exceptionType }: PolicyAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getBorderColor = (type: string) => {
    switch (type) {
      case "family-support": return "border-orange-600";
      case "large-deduction": return "border-red-600";
      case "missing-proof": return "border-blue-600";
      case "settlement-hold": return "border-purple-600";
      default: return "border-slate-600";
    }
  };
  
  const getBgColor = (type: string) => {
    switch (type) {
      case "family-support": return "bg-orange-900/10";
      case "large-deduction": return "bg-red-900/10";
      case "missing-proof": return "bg-blue-900/10";
      case "settlement-hold": return "bg-purple-900/10";
      default: return "bg-slate-900/10";
    }
  };
  
  return (
    <div className={`mt-4 border-l-4 ${getBorderColor(exceptionType)} ${getBgColor(exceptionType)} rounded-r-lg`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-slate-700/50 transition-colors"
      >
        <span className="text-xs font-medium text-amber-400">
          {isExpanded ? "Hide relevant policy" : "Show relevant policy"}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-3 w-3 text-amber-400" />
        ) : (
          <ChevronDown className="h-3 w-3 text-amber-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-3 border-t border-slate-700/50">
          <div className="pt-3">
            <h5 className="text-xs font-medium text-white mb-2">{policyReference.title}</h5>
            <p className="text-xs text-slate-400 mb-3">{policyReference.description}</p>
            
            <div className="space-y-2">
              <a
                href={policyReference.path}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-amber-400 underline hover:text-amber-300 block"
              >
                {policyReference.section ? `§${policyReference.section.split('-')[1]}.${policyReference.section.split('-')[2]} — Quick Jump` : "View Full Policy"}
              </a>
              
              <a
                href={policyReference.path.split('#')[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-400 hover:text-slate-300 block"
              >
                Full policy document →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SettlementExceptionReview({ settlementRows }: SettlementExceptionReviewProps) {
  const exceptions = useMemo(() => {
    const exceptionList: SettlementException[] = [];
    
    // Family Support / Withholding exceptions
    const familySupportDrivers = settlementRows.filter(row => 
      row.familySupport && row.familySupport > 0
    );
    
    if (familySupportDrivers.length > 0) {
      const totalFamilySupport = familySupportDrivers.reduce((sum, row) => sum + (row.familySupport || 0), 0);
      exceptionList.push({
        id: "family-support",
        type: "family-support",
        title: "Family Support Withholding Active",
        description: "Drivers have active family support, child support, or garnishment deductions requiring review",
        affectedDrivers: familySupportDrivers.map(row => row.driverName),
        amount: totalFamilySupport,
        severity: "medium",
        status: "pending",
        nextAction: "Review withholding compliance and documentation",
        cta: "Review Withholding",
        policyReference: {
          title: "Payroll, Compensation and Deductions Policy",
          path: "/generated/company-operations-vault/04-payroll-compensation-and-deductions-policy.html#section-4-2",
          section: "section-4-2",
          description: "Confirm withholding amount, support order documentation, and pay-period treatment."
        }
      });
    }

    // Settlement holds / needs review
    const holdDrivers = settlementRows.filter(row => 
      row.status === "Needs Review" || row.status === "Hold"
    );
    
    if (holdDrivers.length > 0) {
      exceptionList.push({
        id: "settlement-holds",
        type: "settlement-hold",
        title: "Settlement Holds / Payment Issues",
        description: "Driver settlements require review before payment processing",
        affectedDrivers: holdDrivers.map(row => row.driverName),
        severity: "high",
        status: "under-review",
        nextAction: "Clear holds and approve settlements for payment",
        cta: "Review Holds",
        policyReference: {
          title: "Accounting / Finance Close / AP / AR SOP",
          path: "/generated/company-operations-vault/05-accounting-finance-close-ap-ar-sop.html",
          description: "Confirm settlement should not release until required proof and reconciliation records are complete."
        }
      });
    }

    // Large deduction exceptions (deductions > 30% of gross)
    const largeDeductionDrivers = settlementRows.filter(row => 
      row.grossPay > 0 && (row.deductions / row.grossPay) > 0.3
    );
    
    if (largeDeductionDrivers.length > 0) {
      const totalLargeDeductions = largeDeductionDrivers.reduce((sum, row) => sum + row.deductions, 0);
      exceptionList.push({
        id: "large-deduction",
        type: "large-deduction",
        title: "Large Deduction Review Required",
        description: "Drivers with deductions exceeding 30% of gross pay need verification",
        affectedDrivers: largeDeductionDrivers.map(row => row.driverName),
        amount: totalLargeDeductions,
        severity: "medium",
        status: "pending",
        nextAction: "Verify deduction accuracy and approve if correct",
        cta: "Review Deductions",
        policyReference: {
          title: "Payroll, Compensation and Deductions Policy",
          path: "/generated/company-operations-vault/04-payroll-compensation-and-deductions-policy.html#section-4-5",
          section: "section-4-5",
          description: "Verify deduction source, authorization, and approval before payment."
        }
      });
    }

    // Low net pay exceptions (net pay < $500)
    const lowNetDrivers = settlementRows.filter(row => 
      row.netPay > 0 && row.netPay < 500
    );
    
    if (lowNetDrivers.length > 0) {
      exceptionList.push({
        id: "low-net",
        type: "low-net",
        title: "Low Net Pay Alert",
        description: "Drivers with unusually low net payments may need review",
        affectedDrivers: lowNetDrivers.map(row => row.driverName),
        severity: "low",
        status: "pending",
        nextAction: "Verify if low pay is correct or if there are missing components",
        cta: "Review Low Pay",
        policyReference: {
          title: "Payroll, Compensation and Deductions Policy",
          path: "/generated/company-operations-vault/04-payroll-compensation-and-deductions-policy.html",
          description: "Review deduction authorization, family support withholding, and approval documentation before settlement release."
        }
      });
    }

    // Missing reimbursement opportunities
    const noReimbursementDrivers = settlementRows.filter(row => 
      row.grossPay > 2000 && (!row.fuelReimbursement || row.fuelReimbursement === 0)
    );
    
    if (noReimbursementDrivers.length > 0) {
      exceptionList.push({
        id: "missing-reimbursement",
        type: "missing-proof",
        title: "Potential Missing Reimbursements",
        description: "High-earning drivers with no fuel reimbursements may have missing expense claims",
        affectedDrivers: noReimbursementDrivers.map(row => row.driverName),
        severity: "low",
        status: "pending",
        nextAction: "Review fuel receipts and expense claims",
        cta: "Review Reimbursements",
        policyReference: {
          title: "Accounting / Finance Close / AP / AR SOP",
          path: "/generated/company-operations-vault/05-accounting-finance-close-ap-ar-sop.html#section-5-2",
          section: "section-5-2",
          description: "Verify fuel receipt documentation and reimbursement processing procedures."
        }
      });
    }

    return exceptionList;
  }, [settlementRows]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high": return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case "medium": return <Clock className="h-4 w-4 text-amber-400" />;
      case "low": return <FileText className="h-4 w-4 text-blue-400" />;
      default: return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high": return "bg-red-900/30 text-red-300 border border-red-700/50";
      case "medium": return "bg-amber-900/30 text-amber-300 border border-amber-700/50";
      case "low": return "bg-blue-900/30 text-blue-300 border border-blue-700/50";
      default: return "bg-gray-900/30 text-gray-300 border border-gray-700/50";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return "bg-slate-900/30 text-slate-300 border border-slate-700/50";
      case "under-review": return "bg-blue-900/30 text-blue-300 border border-blue-700/50";
      case "resolved": return "bg-green-900/30 text-green-300 border border-green-700/50";
      default: return "bg-gray-900/30 text-gray-300 border border-gray-700/50";
    }
  };

  if (exceptions.length === 0) {
    return (
      <div className="bg-slate-900 rounded-lg shadow-lg border border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <h3 className="text-lg font-semibold text-slate-100">Settlement Exceptions</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-green-400 mb-2">
            <CheckCircle className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-slate-300 font-medium">No exceptions found</p>
          <p className="text-slate-400 text-sm mt-1">All settlements are ready for processing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg shadow-lg border border-slate-700">
      <div className="px-6 py-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <h3 className="text-lg font-semibold text-slate-100">Settlement Exceptions / Required Review</h3>
          <span className="bg-amber-900/30 text-amber-300 border border-amber-700/50 px-2 py-1 rounded text-xs font-medium">
            {exceptions.length} issues
          </span>
        </div>
        <p className="text-slate-400 text-sm mt-1">
          Review these items before settlement approval
        </p>
      </div>

      <div className="divide-y divide-slate-700">
        {exceptions.map((exception) => (
          <div key={exception.id} className="p-6 hover:bg-slate-800/50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {getSeverityIcon(exception.severity)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="text-slate-100 font-medium mb-1">{exception.title}</h4>
                    <p className="text-slate-400 text-sm mb-3">{exception.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-slate-400" />
                        <span className="text-slate-300 text-sm">
                          {exception.affectedDrivers.length} driver{exception.affectedDrivers.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      {exception.amount && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-3 w-3 text-slate-400" />
                          <span className="text-slate-300 text-sm">{formatCurrency(exception.amount)}</span>
                        </div>
                      )}
                      
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityBadge(exception.severity)}`}>
                        {exception.severity.charAt(0).toUpperCase() + exception.severity.slice(1)}
                      </span>
                      
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(exception.status)}`}>
                        {exception.status.replace('-', ' ').charAt(0).toUpperCase() + exception.status.replace('-', ' ').slice(1)}
                      </span>
                    </div>

                    {exception.affectedDrivers.length > 0 && (
                      <div className="mb-3">
                        <p className="text-slate-400 text-xs mb-1">Affected drivers:</p>
                        <div className="flex flex-wrap gap-1">
                          {exception.affectedDrivers.slice(0, 3).map((driver, index) => (
                            <span key={index} className="bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs">
                              {driver}
                            </span>
                          ))}
                          {exception.affectedDrivers.length > 3 && (
                            <span className="bg-slate-800 text-slate-400 px-2 py-1 rounded text-xs">
                              +{exception.affectedDrivers.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="bg-slate-800/50 rounded p-3 mb-3">
                      <p className="text-slate-300 text-sm mb-1">
                        <strong>Next step:</strong> {exception.nextAction}
                      </p>
                    </div>

                    {/* Internal Policy Check Section */}
                    {exception.policyReference && (
                      <div className="bg-blue-900/20 border border-blue-700/50 rounded p-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-blue-400" />
                          <h5 className="text-sm font-medium text-blue-300">Internal policy check</h5>
                        </div>
                        <p className="text-blue-200 text-sm font-medium mb-1">{exception.policyReference.title}</p>
                        <p className="text-blue-300 text-xs mb-3">{exception.policyReference.description}</p>
                        <a 
                          href={exception.policyReference.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
                        >
                          Open policy →
                        </a>
                      </div>
                    )}

                    {/* Policy Accordion */}
                    {exception.policyReference && (
                      <PolicyAccordion 
                        policyReference={exception.policyReference} 
                        exceptionType={exception.type}
                      />
                    )}
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  {exception.policyReference && (
                    <a 
                      href={exception.policyReference.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded text-sm font-medium transition-colors"
                    >
                      Review policy
                    </a>
                  )}
                  <a
                    href={exception.ctaLink ?? exception.policyReference?.path ?? "/settlements"}
                    target={exception.policyReference?.path ? "_blank" : undefined}
                    rel={exception.policyReference?.path ? "noopener noreferrer" : undefined}
                    className="rounded bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700"
                  >
                    {exception.cta}
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
