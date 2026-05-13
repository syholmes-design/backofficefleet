"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  getOperationsFileCabinetItems,
  getOperationsFileCabinetCategories,
  getOperationsFileCabinetTypes,
  getOperationsFileCabinetAudiences,
  getOperationsFileCabinetStatuses,
  type OperationsFileCabinetItem,
  type OperationsFileCabinetCategory,
  type OperationsFileCabinetType,
  type OperationsFileCabinetAudience,
  type OperationsFileCabinetStatus,
} from "@/lib/operations-file-cabinet";

type QuickFilter =
  | "all"
  | "driver"
  | "dispatch"
  | "policies"
  | "claims-legal"
  | "training"
  | "finance";

export function OperationsFileCabinetClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<OperationsFileCabinetCategory | "all">("all");
  const [selectedType, setSelectedType] = useState<OperationsFileCabinetType | "all">("all");
  const [selectedAudience, setSelectedAudience] = useState<OperationsFileCabinetAudience | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<OperationsFileCabinetStatus | "all">("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");

  const allItems = useMemo(() => getOperationsFileCabinetItems(), []);
  const categories = useMemo(() => getOperationsFileCabinetCategories(), []);
  const types = useMemo(() => getOperationsFileCabinetTypes(), []);
  const audiences = useMemo(() => getOperationsFileCabinetAudiences(), []);
  const statuses = useMemo(() => getOperationsFileCabinetStatuses(), []);

  // Quick filter to categories mapping
  const getCategoriesForQuickFilter = useCallback((filter: QuickFilter): OperationsFileCabinetCategory[] => {
    switch (filter) {
      case "all":
        return categories;
      case "driver":
        return ["Driver Qualification Files", "Secondary Driver Documents"];
      case "dispatch":
        return ["Dispatch & Load Operations"];
      case "policies":
        return ["Policies & SOPs"];
      case "claims-legal":
        return ["Safety / Claims / Insurance", "Contracts / Customer / Legal"];
      case "training":
        return ["Training & Knowledge Base"];
      case "finance":
        return ["Finance / Settlements / Back Office"];
      default:
        return categories;
    }
  }, [categories]);

  const getQuickFilterLabel = (filter: QuickFilter): string => {
    switch (filter) {
      case "all":
        return "All documents";
      case "driver":
        return "Driver Files";
      case "dispatch":
        return "Dispatch Forms";
      case "policies":
        return "Policies & SOPs";
      case "claims-legal":
        return "Claims & Legal";
      case "training":
        return "Training Library";
      case "finance":
        return "Finance Back Office";
      default:
        return "All documents";
    }
  };

  const scrollToResults = () => {
    const element = document.getElementById("featured-documents");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleQuickFilterClick = (filter: QuickFilter) => {
    setQuickFilter(filter);
    setSelectedCategory("all"); // Reset category filter when using quick filter
    scrollToResults();
  };

  // Group items by their group property
  const groupItems = (items: typeof filteredItems) => {
    const groups = items.reduce((acc, item) => {
      const group = item.group || "Other";
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(item);
      return acc;
    }, {} as Record<string, typeof filteredItems>);

    // Define group order
    const groupOrder = [
      "Blank Templates",
      "Company Policies & SOPs", 
      "BOF Dispatch Templates",
      "External Resources",
      "Completed Demo Samples",
      "Needs Review / Coming Later"
    ];

    // Sort groups according to predefined order, then alphabetically for any others
    return Object.keys(groups)
      .sort((a, b) => {
        const aIndex = groupOrder.indexOf(a);
        const bIndex = groupOrder.indexOf(b);
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.localeCompare(b);
      })
      .map(group => ({
        name: group,
        items: groups[group]
      }));
  };

  // Featured items - curated list of high-value documents with actual links only
  const featuredItems = useMemo(() => {
    return allItems.filter(item => 
      item.status !== "coming_soon" && 
      item.status !== "needs_review" &&
      item.href && 
      item.href.startsWith("/generated/") &&
      [
        // Driver Qualification Files (real documents only)
        "driver-cdl", "driver-medical", "driver-mvr", "driver-clearinghouse", 
        "driver-i9", "driver-w9", "driver-emergency-contacts", "driver-bank-info",
        "driver-policy-acknowledgment", "driver-road-test", "driver-employment-verification",
        "driver-incident-history",
        
        // Company Policies & SOPs (real generated policies only)
        "hr-employee-handbook", "policy-code-of-conduct", "hr-onboarding-checklist",
        "driver-withholding", "policy-accounting-finance", "policy-factoring-receivables",
        "claims-escalation-sop", "policy-vendor-maintenance", "policy-safety-compliance",
        "policy-information-security", "policy-privacy-data", "policy-ai-governance",
        "policy-tax-audit-readiness", "policy-cash-flow-management",
        
        // Dispatch & Load Documents (real generated files only)
        "contract-master-agreement", "dispatch-work-order", "dispatch-rate-confirmation",
        "dispatch-bol", "dispatch-pod",
        "claims-cargo-intake", "claims-insurance-notice",
        
        // HR Documents (real files only)
        "hr-termination-checklist"
      ].includes(item.id)
    );
  }, [allItems]);

  const filteredItems = useMemo(() => {
    const quickFilterCategories = getCategoriesForQuickFilter(quickFilter);
    
    return allItems.filter(item => {
      const matchesSearch = searchTerm === "" || 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = (selectedCategory === "all" && quickFilter === "all") || 
        (selectedCategory !== "all" && item.category === selectedCategory) ||
        (selectedCategory === "all" && quickFilter !== "all" && quickFilterCategories.includes(item.category));
      const matchesType = selectedType === "all" || item.type === selectedType;
      const matchesAudience = selectedAudience === "all" || item.audience.includes(selectedAudience);
      const matchesStatus = selectedStatus === "all" || item.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesType && matchesAudience && matchesStatus;
    });
  }, [allItems, searchTerm, selectedCategory, selectedType, selectedAudience, selectedStatus, quickFilter, getCategoriesForQuickFilter]);

  const comingSoonItems = useMemo(() => {
    return allItems.filter(item => item.status === "coming_soon");
  }, [allItems]);

  const categorySummary = useMemo(() => {
    return categories.map(category => {
      const items = allItems.filter(item => item.category === category);
      const availableCount = items.filter(item => item.status === "available" || item.status === "available_route").length;
      const templateCount = items.filter(item => item.status === "template").length;
      const externalCount = items.filter(item => item.status === "external_resource").length;
      const comingSoonCount = items.filter(item => item.status === "coming_soon").length;
      
      return {
        category,
        description: getCategoryDescription(category),
        totalItems: items.length,
        availableCount,
        templateCount,
        externalCount,
        comingSoonCount,
        primaryHref: getCategoryPrimaryHref(category),
        primaryCta: getCategoryPrimaryCta(category),
      };
    });
  }, [categories, allItems]);

  function getCategoryDescription(category: OperationsFileCabinetCategory): string {
    switch (category) {
      case "Driver Qualification Files":
        return "Core driver credentials and compliance documentation";
      case "Secondary Driver Documents":
        return "Performance, coaching, and ongoing driver records";
      case "Dispatch & Load Operations":
        return "Load management, dispatch forms, and operational procedures";
      case "Safety / Claims / Insurance":
        return "Incident reporting, claims processing, and safety compliance";
      case "HR / Talent / Performance":
        return "Recruiting, onboarding, and performance management";
      case "Policies & SOPs":
        return "Company policies and standard operating procedures";
      case "Finance / Settlements / Back Office":
        return "Payroll, settlements, and financial procedures";
      case "Training & Knowledge Base":
        return "Training materials, videos, and knowledge resources";
      case "Contracts / Customer / Legal":
        return "Customer agreements, contracts, and legal templates";
      default:
        return "Documentation and resources";
    }
  }

  function getCategoryPrimaryHref(_category: OperationsFileCabinetCategory): string {
    // Return "#" for in-page filtering/jumping instead of module navigation
    return "#";
  }

  function getCategoryPrimaryCta(category: OperationsFileCabinetCategory): string {
    switch (category) {
      case "Driver Qualification Files":
        return "Browse documents →";
      case "Secondary Driver Documents":
        return "Show files →";
      case "Dispatch & Load Operations":
        return "Show templates →";
      case "Safety / Claims / Insurance":
        return "Show forms →";
      case "HR / Talent / Performance":
        return "Show policies →";
      case "Policies & SOPs":
        return "Show policies →";
      case "Finance / Settlements / Back Office":
        return "Show forms →";
      case "Training & Knowledge Base":
        return "Show resources →";
      case "Contracts / Customer / Legal":
        return "Show agreements →";
      default:
        return "Browse documents →";
    }
  }

  function getItemCta(item: OperationsFileCabinetItem): string {
    // Handle completed demo samples
    if (item.group === "Completed Demo Samples") {
      return "View completed sample →";
    }
    
    // Handle blank templates
    if (item.group === "Blank Templates") {
      return "Open blank template →";
    }
    
    // Handle company policies
    if (item.group === "Company Policies & SOPs") {
      return "View policy →";
    }
    
    // Handle BOF dispatch templates
    if (item.group === "BOF Dispatch Templates") {
      return "View template →";
    }
    
    // Handle external resources
    if (item.group === "External Resources") {
      return "Open guidance →";
    }
    
    // Fallback to type-based CTA
    switch (item.type) {
      case "template":
        return "Open blank template →";
      case "policy":
      case "sop":
        return "View policy →";
      case "form":
        return "Fill out form →";
      case "driver-file":
        return "View document →";
      case "video":
        return "Watch video →";
      case "article":
        return "Read article →";
      case "checklist":
        return "Use checklist →";
      case "contract":
        return "View contract →";
      default:
        return "View →";
    }
  }

  function getSourceChip(item: OperationsFileCabinetItem): { text: string; color: string } {
    if (item.source === "generated") {
      return { text: "Generated document", color: "#22c55e" };
    } else if (item.source === "template") {
      return { text: "Template", color: "#3b82f6" };
    } else if (item.source === "external") {
      return { text: "External resource", color: "#a855f7" };
    } else if (item.href?.startsWith("/")) {
      return { text: "App route", color: "#f59e0b" };
    } else {
      return { text: "Document", color: "#6b7280" };
    }
  }

  function getStatusColor(status: OperationsFileCabinetStatus): string {
    switch (status) {
      case "available":
        return "rgba(34, 197, 94, 0.2)";
      case "available_route":
        return "rgba(34, 197, 94, 0.3)";
      case "template":
        return "rgba(59, 130, 246, 0.2)";
      case "needs_review":
        return "rgba(251, 146, 60, 0.2)";
      case "external_resource":
        return "rgba(168, 85, 247, 0.2)";
      case "coming_soon":
        return "rgba(107, 114, 128, 0.2)";
      default:
        return "rgba(107, 114, 128, 0.2)";
    }
  }

  function getStatusTextColor(status: OperationsFileCabinetStatus): string {
    switch (status) {
      case "available":
        return "#22c55e";
      case "available_route":
        return "#22c55e";
      case "template":
        return "#3b82f6";
      case "needs_review":
        return "#fb923c";
      case "external_resource":
        return "#a855f7";
      case "coming_soon":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  }

  return (
    <div className="bof-page" style={{ paddingBottom: "8rem" }}>
      {/* Hero Section with Watermark */}
      <div style={{
        marginBottom: "2rem",
        position: "relative"
      }}>
        {/* Hero Watermark */}
        <div style={{
          position: "absolute",
          top: "-2rem",
          right: "-2rem",
          width: "300px",
          height: "200px",
          opacity: 0.15,
          pointerEvents: "none",
          zIndex: 0,
          background: `url("/generated/marketing/operations-file-cabinet-watermark.png") no-repeat center center`,
          backgroundSize: "contain",
          filter: "brightness(0.8) contrast(1.2)"
        }} />
        
        {/* Hero Content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 className="bof-title">Operations File Cabinet</h1>
          <p className="bof-lead">
            Driver files, company policies, dispatch forms, training materials, SOPs, claims documents, and back-office templates in one organized operating library.
          </p>
          
          {/* Hero Chips */}
          <div style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            marginTop: "1rem"
          }}>
            {[
              "all",
              "driver",
              "dispatch", 
              "policies",
              "claims-legal",
              "training",
              "finance"
            ].map(filter => {
              const isActive = quickFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => handleQuickFilterClick(filter as QuickFilter)}
                  style={{
                    display: "inline-block",
                    padding: "0.25rem 0.75rem",
                    backgroundColor: isActive 
                      ? "rgba(20, 184, 166, 0.2)" 
                      : "rgba(59, 130, 246, 0.1)",
                    border: isActive 
                      ? "1px solid rgba(20, 184, 166, 0.4)" 
                      : "1px solid rgba(59, 130, 246, 0.2)",
                    borderRadius: "16px",
                    fontSize: "0.8rem",
                    color: isActive ? "#14b8a6" : "#3b82f6",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    outline: "none"
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.2)";
                      e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.4)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
                      e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.2)";
                    }
                  }}
                >
                  {getQuickFilterLabel(filter as QuickFilter)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "1rem",
        marginBottom: "2rem"
      }}>
        {categorySummary.map(summary => (
          <div
            key={summary.category}
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              padding: "1.5rem"
            }}
          >
            <h3 style={{
              fontSize: "1.1rem",
              fontWeight: "600",
              color: "#ffffff",
              margin: "0 0 0.5rem 0"
            }}>
              {summary.category}
            </h3>
            <p style={{
              fontSize: "0.9rem",
              color: "rgba(255, 255, 255, 0.7)",
              margin: "0 0 1rem 0",
              lineHeight: "1.4"
            }}>
              {summary.description}
            </p>
            <div style={{
              display: "flex",
              gap: "1rem",
              marginBottom: "1rem",
              fontSize: "0.8rem",
              flexWrap: "wrap"
            }}>
              <span style={{ color: "#22c55e" }}>
                {summary.availableCount} available
              </span>
              <span style={{ color: "#3b82f6" }}>
                {summary.templateCount} templates
              </span>
              <span style={{ color: "#a855f7" }}>
                {summary.externalCount} external
              </span>
              <span style={{ color: "#6b7280" }}>
                {summary.comingSoonCount} coming soon
              </span>
            </div>
            <button
              onClick={() => setSelectedCategory(summary.category)}
              style={{
                display: "inline-block",
                padding: "0.5rem 1rem",
                backgroundColor: "rgba(59, 130, 246, 0.2)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "6px",
                color: "#3b82f6",
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: "500",
                cursor: "pointer"
              }}
            >
              {summary.primaryCta}
            </button>
          </div>
        ))}
      </div>

      {/* Filtered Results Heading */}
      {(quickFilter !== "all" || selectedCategory !== "all" || searchTerm !== "") && (
        <div style={{
          marginBottom: "1.5rem"
        }}>
          <h2 style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            color: "#14b8a6",
            margin: "0 0 0.5rem 0"
          }}>
            Showing {quickFilter !== "all" ? getQuickFilterLabel(quickFilter) : selectedCategory !== "all" ? selectedCategory : searchTerm ? "Search Results" : "All Documents"}
          </h2>
          <p style={{
            fontSize: "0.9rem",
            color: "#64748b",
            margin: "0"
          }}>
            {filteredItems.length} document{filteredItems.length !== 1 ? "s" : ""} found
          </p>
        </div>
      )}

      {/* Featured Documents & Templates */}
      <div id="featured-documents" style={{
        marginBottom: "2rem"
      }}>
        <h2 style={{
          fontSize: "1.5rem",
          fontWeight: "600",
          color: "#ffffff",
          margin: "0 0 1rem 0"
        }}>
          {quickFilter !== "all" || selectedCategory !== "all" || searchTerm !== "" 
            ? "Filtered Documents" 
            : "Featured Documents & Templates"}
        </h2>
        {(quickFilter !== "all" || selectedCategory !== "all" || searchTerm !== "") ? (
            // Show grouped filtered items when any filter is applied
            (() => {
              const groupedItems = groupItems(filteredItems);
              return (
                <div>
                  {groupedItems.map(group => (
                    <div key={group.name} style={{ marginBottom: "2rem" }}>
                      <h3 style={{
                        fontSize: "1.1rem",
                        fontWeight: "600",
                        color: "#14b8a6",
                        margin: "0 0 1rem 0",
                        paddingBottom: "0.5rem",
                        borderBottom: "1px solid rgba(20, 184, 166, 0.3)"
                      }}>
                        {group.name}
                      </h3>
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: "1rem"
                      }}>
                        {group.items.map(item => {
                          const sourceChip = getSourceChip(item);
                          const cta = getItemCta(item);
                          return (
                            <div
                              key={item.id}
                              style={{
                                backgroundColor: "rgba(255, 255, 255, 0.05)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "12px",
                                padding: "1.5rem",
                                transition: "all 0.2s ease"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                              }}
                            >
                              <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: "0.75rem"
                              }}>
                                <h3 style={{
                                  fontSize: "1rem",
                                  fontWeight: "600",
                                  color: "#ffffff",
                                  margin: "0",
                                  lineHeight: "1.4"
                                }}>
                                  {item.title}
                                </h3>
                                {sourceChip && (
                                  <span style={{
                                    fontSize: "0.7rem",
                                    padding: "0.2rem 0.5rem",
                                    borderRadius: "12px",
                                    backgroundColor: `${sourceChip.color}20`,
                                    color: sourceChip.color,
                                    fontWeight: "500",
                                    whiteSpace: "nowrap"
                                  }}>
                                    {sourceChip.text}
                                  </span>
                                )}
                              </div>
                              <p style={{
                                fontSize: "0.875rem",
                                color: "#94a3b8",
                                margin: "0 0 1rem 0",
                                lineHeight: "1.5"
                              }}>
                                {item.description}
                              </p>
                              {item.href ? (
                                <Link
                                  href={item.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    fontSize: "0.875rem",
                                    fontWeight: "500",
                                    color: "#14b8a6",
                                    textDecoration: "none",
                                    transition: "color 0.2s ease"
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = "#0d9488";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = "#14b8a6";
                                  }}
                                >
                                  {cta}
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                    <polyline points="15,3 21,3 21,9"></polyline>
                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                  </svg>
                                </Link>
                              ) : (
                                <span style={{
                                  fontSize: "0.875rem",
                                  color: "#64748b",
                                  fontStyle: "italic"
                                }}>
                                  {item.status === "coming_soon" ? "Coming soon" : "Not available"}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          ) : (
            // Show featured items when no filters are applied
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1rem"
            }}>
              {featuredItems.map(item => {
                const sourceChip = getSourceChip(item);
                const cta = getItemCta(item);
                return (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      padding: "1.5rem",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                    }}
                  >
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "0.75rem"
                    }}>
                      <h3 style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        color: "#ffffff",
                        margin: "0",
                        lineHeight: "1.4"
                      }}>
                        {item.title}
                      </h3>
                      {sourceChip && (
                        <span style={{
                          fontSize: "0.7rem",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "12px",
                          backgroundColor: `${sourceChip.color}20`,
                          color: sourceChip.color,
                          fontWeight: "500",
                          whiteSpace: "nowrap"
                        }}>
                          {sourceChip.text}
                        </span>
                      )}
                    </div>
                    <p style={{
                      fontSize: "0.875rem",
                      color: "#94a3b8",
                      margin: "0 0 1rem 0",
                      lineHeight: "1.5"
                    }}>
                      {item.description}
                    </p>
                    {item.href ? (
                      <Link
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                          color: "#14b8a6",
                          textDecoration: "none",
                          transition: "color 0.2s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#0d9488";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#14b8a6";
                        }}
                      >
                        {cta}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15,3 21,3 21,9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </Link>
                    ) : (
                      <span style={{
                        fontSize: "0.875rem",
                        color: "#64748b",
                        fontStyle: "italic"
                      }}>
                        Coming soon
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
      </div>

      {/* Search and Filters */}
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "2rem"
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem"
        }}>
          <div>
            <label style={{
              display: "block",
              fontSize: "0.8rem",
              color: "rgba(255, 255, 255, 0.7)",
              marginBottom: "0.5rem"
            }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "6px",
                color: "#ffffff",
                fontSize: "0.9rem"
              }}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "0.8rem",
              color: "rgba(255, 255, 255, 0.7)",
              marginBottom: "0.5rem"
            }}>
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as OperationsFileCabinetCategory | "all")}
              style={{
                width: "100%",
                padding: "0.5rem",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "6px",
                color: "#ffffff",
                fontSize: "0.9rem"
              }}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "0.8rem",
              color: "rgba(255, 255, 255, 0.7)",
              marginBottom: "0.5rem"
            }}>
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as OperationsFileCabinetType | "all")}
              style={{
                width: "100%",
                padding: "0.5rem",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "6px",
                color: "#ffffff",
                fontSize: "0.9rem"
              }}
            >
              <option value="all">All Types</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "0.8rem",
              color: "rgba(255, 255, 255, 0.7)",
              marginBottom: "0.5rem"
            }}>
              Audience
            </label>
            <select
              value={selectedAudience}
              onChange={(e) => setSelectedAudience(e.target.value as OperationsFileCabinetAudience | "all")}
              style={{
                width: "100%",
                padding: "0.5rem",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "6px",
                color: "#ffffff",
                fontSize: "0.9rem"
              }}
            >
              <option value="all">All Audiences</option>
              {audiences.map(audience => (
                <option key={audience} value={audience}>{audience}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "0.8rem",
              color: "rgba(255, 255, 255, 0.7)",
              marginBottom: "0.5rem"
            }}>
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as OperationsFileCabinetStatus | "all")}
              style={{
                width: "100%",
                padding: "0.5rem",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "6px",
                color: "#ffffff",
                fontSize: "0.9rem"
              }}
            >
              <option value="all">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Featured File Cabinet */}
      <div style={{
        minHeight: "100vh",
        backgroundColor: "#1a1a1a",
        color: "#ffffff",
        padding: "2rem",
        paddingBottom: "6rem"
      }}>
        <h2 style={{
          fontSize: "1.5rem",
          fontWeight: "600",
          color: "#ffffff",
          margin: "0 0 1.5rem 0"
        }}>
          Featured File Cabinet
        </h2>
        <p style={{
          fontSize: "1rem",
          color: "rgba(255, 255, 255, 0.7)",
          margin: "0 0 2rem 0",
          lineHeight: "1.5"
        }}>
          Essential documents, policies, and templates with actual links to real files.
        </p>
        
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "1rem"
        }}>
          {featuredItems.map(item => (
            <div
              key={item.id}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                padding: "1.5rem"
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "1rem"
              }}>
                <h3 style={{
                  fontSize: "1rem",
                  fontWeight: "600",
                  color: "#ffffff",
                  margin: "0",
                  flex: 1
                }}>
                  {item.title}
                </h3>
                <span
                  style={{
                    padding: "0.25rem 0.5rem",
                    backgroundColor: getStatusColor(item.status),
                    border: `1px solid ${getStatusTextColor(item.status)}33`,
                    borderRadius: "4px",
                    fontSize: "0.7rem",
                    color: getStatusTextColor(item.status),
                    fontWeight: "500",
                    textTransform: "capitalize",
                    marginLeft: "0.5rem"
                  }}
                >
                  {item.status.replace("_", " ")}
                </span>
              </div>

              <div style={{
                marginBottom: "1rem"
              }}>
                <div style={{
                  fontSize: "0.8rem",
                  color: "rgba(255, 255, 255, 0.7)",
                  marginBottom: "0.5rem"
                }}>
                  {item.category}
                </div>
                <div style={{
                  fontSize: "0.9rem",
                  color: "rgba(255, 255, 255, 0.8)",
                  lineHeight: "1.4",
                  marginBottom: "0.5rem"
                }}>
                  {item.description}
                </div>
              </div>

              <div style={{
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
                marginBottom: "1rem"
              }}>
                {item.audience.map(audience => (
                  <span
                    key={audience}
                    style={{
                      padding: "0.2rem 0.5rem",
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "12px",
                      fontSize: "0.7rem",
                      color: "rgba(255, 255, 255, 0.7)"
                    }}
                  >
                    {audience}
                  </span>
                ))}
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.5rem"
              }}>
                <span
                  style={{
                    padding: "0.2rem 0.5rem",
                    backgroundColor: `${getSourceChip(item).color}20`,
                    border: `1px solid ${getSourceChip(item).color}33`,
                    borderRadius: "4px",
                    fontSize: "0.7rem",
                    color: getSourceChip(item).color,
                    fontWeight: "500"
                  }}
                >
                  {getSourceChip(item).text}
                </span>
                {item.href ? (
                  <Link
                    href={item.href}
                    style={{
                      display: "inline-block",
                      padding: "0.5rem 1rem",
                      backgroundColor: "rgba(59, 130, 246, 0.2)",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      borderRadius: "6px",
                      color: "#3b82f6",
                      textDecoration: "none",
                      fontSize: "0.8rem",
                      fontWeight: "500"
                    }}
                  >
                    {getItemCta(item)} →
                  </Link>
                ) : item.status === "external_resource" ? (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.5rem 1rem",
                      backgroundColor: "rgba(168, 85, 247, 0.2)",
                      border: "1px solid rgba(168, 85, 247, 0.3)",
                      borderRadius: "6px",
                      color: "#a855f7",
                      fontSize: "0.8rem",
                      fontWeight: "500"
                    }}
                  >
                    External link →
                  </span>
                ) : (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.5rem 1rem",
                      backgroundColor: "rgba(107, 114, 128, 0.2)",
                      border: "1px solid rgba(107, 114, 128, 0.3)",
                      borderRadius: "6px",
                      color: "#6b7280",
                      fontSize: "0.8rem",
                      fontWeight: "500"
                    }}
                  >
                    Coming soon
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Planned Cabinet Additions */}
      <div style={{
        marginBottom: "2rem"
      }}>
        <h2 style={{
          fontSize: "1.2rem",
          fontWeight: "600",
          color: "rgba(255, 255, 255, 0.9)",
          margin: "0 0 1rem 0"
        }}>
          Planned Cabinet Additions
        </h2>
        <p style={{
          fontSize: "0.9rem",
          color: "rgba(255, 255, 255, 0.6)",
          margin: "0 0 1.5rem 0",
          lineHeight: "1.4"
        }}>
          These items are planned for future implementation.
        </p>
        
        <div style={{
          backgroundColor: "rgba(255, 255, 255, 0.02)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          borderRadius: "8px",
          padding: "1rem"
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "0.75rem"
          }}>
            {comingSoonItems.map(item => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.5rem",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  borderRadius: "6px"
                }}
              >
                <span
                  style={{
                    padding: "0.2rem 0.4rem",
                    backgroundColor: "rgba(107, 114, 128, 0.2)",
                    border: "1px solid rgba(107, 114, 128, 0.3)",
                    borderRadius: "4px",
                    fontSize: "0.6rem",
                    color: "#6b7280",
                    fontWeight: "500",
                    textTransform: "capitalize",
                    whiteSpace: "nowrap"
                  }}
                >
                  Coming soon
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: "0.85rem",
                    color: "rgba(255, 255, 255, 0.8)",
                    fontWeight: "500"
                  }}>
                    {item.title}
                  </div>
                  <div style={{
                    fontSize: "0.75rem",
                    color: "rgba(255, 255, 255, 0.5)"
                  }}>
                    {item.category}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Browse All Documents (when searching/filtering) */}
      {(searchTerm || selectedCategory !== "all" || selectedType !== "all" || selectedAudience !== "all" || selectedStatus !== "all") && (
        <div>
          <h2 style={{
            fontSize: "1.2rem",
            fontWeight: "600",
            color: "#ffffff",
            margin: "0 0 1.5rem 0"
          }}>
            Browse All Documents
          </h2>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: "1rem"
          }}>
            {filteredItems.map(item => (
              <div
                key={item.id}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "1.5rem"
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "1rem"
                }}>
                  <h3 style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#ffffff",
                    margin: "0",
                    flex: 1
                  }}>
                    {item.title}
                  </h3>
                  <span
                    style={{
                      padding: "0.25rem 0.5rem",
                      backgroundColor: getStatusColor(item.status),
                      border: `1px solid ${getStatusTextColor(item.status)}33`,
                      borderRadius: "4px",
                      fontSize: "0.7rem",
                      color: getStatusTextColor(item.status),
                      fontWeight: "500",
                      textTransform: "capitalize",
                      marginLeft: "0.5rem"
                    }}
                  >
                    {item.status.replace("_", " ")}
                  </span>
                </div>

                <div style={{
                  marginBottom: "1rem"
                }}>
                  <div style={{
                    fontSize: "0.8rem",
                    color: "rgba(255, 255, 255, 0.7)",
                    marginBottom: "0.5rem"
                  }}>
                    {item.category}
                  </div>
                  <div style={{
                    fontSize: "0.9rem",
                    color: "rgba(255, 255, 255, 0.8)",
                    lineHeight: "1.4",
                    marginBottom: "0.5rem"
                  }}>
                    {item.description}
                  </div>
                </div>

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <span
                    style={{
                      padding: "0.2rem 0.5rem",
                      backgroundColor: `${getSourceChip(item).color}20`,
                      border: `1px solid ${getSourceChip(item).color}33`,
                      borderRadius: "4px",
                      fontSize: "0.7rem",
                      color: getSourceChip(item).color,
                      fontWeight: "500"
                    }}
                  >
                    {getSourceChip(item).text}
                  </span>
                  {item.href ? (
                    <Link
                      href={item.href}
                      style={{
                        display: "inline-block",
                        padding: "0.5rem 1rem",
                        backgroundColor: "rgba(59, 130, 246, 0.2)",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                        borderRadius: "6px",
                        color: "#3b82f6",
                        textDecoration: "none",
                        fontSize: "0.8rem",
                        fontWeight: "500"
                      }}
                    >
                      {getItemCta(item)} →
                    </Link>
                  ) : item.status === "external_resource" ? (
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.5rem 1rem",
                        backgroundColor: "rgba(168, 85, 247, 0.2)",
                        border: "1px solid rgba(168, 85, 247, 0.3)",
                        borderRadius: "6px",
                        color: "#a855f7",
                        fontSize: "0.8rem",
                        fontWeight: "500"
                      }}
                    >
                      External link →
                    </span>
                  ) : (
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.5rem 1rem",
                        backgroundColor: "rgba(107, 114, 128, 0.2)",
                        border: "1px solid rgba(107, 114, 128, 0.3)",
                        borderRadius: "6px",
                        color: "#6b7280",
                        fontSize: "0.8rem",
                        fontWeight: "500"
                      }}
                    >
                      Coming soon
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div style={{
              textAlign: "center",
              padding: "3rem",
              color: "rgba(255, 255, 255, 0.6)"
            }}>
              <p style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                No documents found matching your criteria
              </p>
              <p style={{ fontSize: "0.9rem" }}>
                Try adjusting your search or filters to see more results
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
