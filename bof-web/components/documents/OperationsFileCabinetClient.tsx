"use client";

import { useState, useMemo } from "react";
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

export function OperationsFileCabinetClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<OperationsFileCabinetCategory | "all">("all");
  const [selectedType, setSelectedType] = useState<OperationsFileCabinetType | "all">("all");
  const [selectedAudience, setSelectedAudience] = useState<OperationsFileCabinetAudience | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<OperationsFileCabinetStatus | "all">("all");

  const allItems = useMemo(() => getOperationsFileCabinetItems(), []);
  const categories = useMemo(() => getOperationsFileCabinetCategories(), []);
  const types = useMemo(() => getOperationsFileCabinetTypes(), []);
  const audiences = useMemo(() => getOperationsFileCabinetAudiences(), []);
  const statuses = useMemo(() => getOperationsFileCabinetStatuses(), []);

  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesSearch = searchTerm === "" || 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchesType = selectedType === "all" || item.type === selectedType;
      const matchesAudience = selectedAudience === "all" || item.audience.includes(selectedAudience);
      const matchesStatus = selectedStatus === "all" || item.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesType && matchesAudience && matchesStatus;
    });
  }, [allItems, searchTerm, selectedCategory, selectedType, selectedAudience, selectedStatus]);

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

  function getCategoryPrimaryHref(category: OperationsFileCabinetCategory): string {
    switch (category) {
      case "Driver Qualification Files":
      case "Secondary Driver Documents":
        return "/drivers";
      case "Dispatch & Load Operations":
        return "/dispatch";
      case "Safety / Claims / Insurance":
        return "/safety";
      case "Finance / Settlements / Back Office":
        return "/settlements";
      case "Training & Knowledge Base":
        return "/safety";
      default:
        return "/documents";
    }
  }

  function getCategoryPrimaryCta(category: OperationsFileCabinetCategory): string {
    switch (category) {
      case "Driver Qualification Files":
        return "View driver files";
      case "Secondary Driver Documents":
        return "View driver records";
      case "Dispatch & Load Operations":
        return "Open dispatch forms";
      case "Safety / Claims / Insurance":
        return "View safety resources";
      case "HR / Talent / Performance":
        return "View HR resources";
      case "Policies & SOPs":
        return "View policies";
      case "Finance / Settlements / Back Office":
        return "View finance forms";
      case "Training & Knowledge Base":
        return "View training";
      case "Contracts / Customer / Legal":
        return "View contracts";
      default:
        return "View documents";
    }
  }

  function getItemCta(item: OperationsFileCabinetItem): string {
    switch (item.type) {
      case "driver-file":
        return "View file";
      case "template":
        return "View template";
      case "policy":
        return "View policy";
      case "checklist":
        return "View checklist";
      case "form":
        return "View form";
      case "video":
        return "Watch video";
      case "article":
        return "Read article";
      case "sop":
        return "View SOP";
      case "contract":
        return "View contract";
      default:
        return "Open";
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
    <div className="bof-page">
      {/* Hero Section */}
      <div style={{
        marginBottom: "2rem"
      }}>
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
            "Driver files",
            "Dispatch forms", 
            "Policies & SOPs",
            "Claims & legal",
            "Training library",
            "Finance back office"
          ].map(chip => (
            <span
              key={chip}
              style={{
                display: "inline-block",
                padding: "0.25rem 0.75rem",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                borderRadius: "16px",
                fontSize: "0.8rem",
                color: "#3b82f6",
                fontWeight: "500"
              }}
            >
              {chip}
            </span>
          ))}
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
            <Link
              href={summary.primaryHref}
              style={{
                display: "inline-block",
                padding: "0.5rem 1rem",
                backgroundColor: "rgba(59, 130, 246, 0.2)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                borderRadius: "6px",
                color: "#3b82f6",
                textDecoration: "none",
                fontSize: "0.9rem",
                fontWeight: "500"
              }}
            >
              {summary.primaryCta} →
            </Link>
          </div>
        ))}
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

      {/* Document Cards */}
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
              alignItems: "center"
            }}>
              <span style={{
                fontSize: "0.8rem",
                color: "rgba(255, 255, 255, 0.6)",
                fontStyle: "italic"
              }}>
                {item.type}
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
  );
}
