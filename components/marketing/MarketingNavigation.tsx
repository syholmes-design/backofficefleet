"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { MarketingBrandMark } from "@/components/marketing/MarketingBrandMark";
import { BOF_RUNTIME_LINKS } from "@/lib/marketing-runtime-links";

export function MarketingNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSectorsDropdownOpen, setIsSectorsDropdownOpen] = useState(false);
  const [isDemoDropdownOpen, setIsDemoDropdownOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSectorsDropdown = () => {
    setIsSectorsDropdownOpen(!isSectorsDropdownOpen);
    setIsDemoDropdownOpen(false);
  };

  const toggleDemoDropdown = () => {
    setIsDemoDropdownOpen(!isDemoDropdownOpen);
    setIsSectorsDropdownOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <MarketingBrandMark />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Sectors Dropdown */}
            <div className="relative">
              <button
                onClick={toggleSectorsDropdown}
                className="flex items-center text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Sectors
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              
              {isSectorsDropdownOpen && (
                <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <Link
                      href="/for-hire-carriers"
                      className={`block px-4 py-2 text-sm transition-colors ${
                        isActive("/for-hire-carriers")
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => setIsSectorsDropdownOpen(false)}
                    >
                      For-Hire Carriers
                    </Link>
                    <Link
                      href="/private-fleets"
                      className={`block px-4 py-2 text-sm transition-colors ${
                        isActive("/private-fleets")
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => setIsSectorsDropdownOpen(false)}
                    >
                      Private Fleets
                    </Link>
                    <Link
                      href="/government"
                      className={`block px-4 py-2 text-sm transition-colors ${
                        isActive("/government")
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => setIsSectorsDropdownOpen(false)}
                    >
                      Government
                    </Link>
                    <Link
                      href="/bof-vault"
                      className={`block px-4 py-2 text-sm transition-colors ${
                        isActive("/bof-vault")
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => setIsSectorsDropdownOpen(false)}
                    >
                      BOF Vault
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Demo Dropdown */}
            <div className="relative">
              <button
                onClick={toggleDemoDropdown}
                className="flex items-center text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Demo Preview
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
              
              {isDemoDropdownOpen && (
                <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <a
                      href={BOF_RUNTIME_LINKS.commandCenter}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        isActive("/command-center")
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => setIsDemoDropdownOpen(false)}
                    >
                      Command Center
                    </a>
                    <a
                      href={BOF_RUNTIME_LINKS.dispatch}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        isActive("/dispatch")
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => setIsDemoDropdownOpen(false)}
                    >
                      Dispatch
                    </a>
                    <a
                      href={BOF_RUNTIME_LINKS.vault}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        isActive("/documents/vault")
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => setIsDemoDropdownOpen(false)}
                    >
                      Driver Vault
                    </a>
                    <a
                      href={BOF_RUNTIME_LINKS.pretrip}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        isActive("/pretrip")
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => setIsDemoDropdownOpen(false)}
                    >
                      Pre-Trip
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* CTA Links */}
            <Link
              href="/product"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isActive("/product")
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Product
            </Link>
            <Link
              href="/driver-experience"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isActive("/driver-experience")
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Driver Experience
            </Link>
            <Link
              href="/fleet-operations"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isActive("/fleet-operations")
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Fleet Operations
            </Link>
            <Link
              href="/investors"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isActive("/investors")
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Investors
            </Link>
            <Link
              href="/contact"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isActive("/contact")
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Contact
            </Link>
            <Link
              href="/assessment"
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isActive("/assessment")
                  ? "text-blue-600"
                  : "text-gray-700 hover:text-blue-600"
              }`}
            >
              Assessment
            </Link>
            
            <Link
              href="/apply"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Apply / Request Review
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-700 hover:text-blue-600 p-2"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="py-2 space-y-1">
              {/* Mobile Sectors */}
              <div className="px-4 py-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Sectors
                </div>
                <Link
                  href="/for-hire-carriers"
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/for-hire-carriers")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  For-Hire Carriers
                </Link>
                <Link
                  href="/private-fleets"
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/private-fleets")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Private Fleets
                </Link>
                <Link
                  href="/government"
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/government")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Government
                </Link>
                <Link
                  href="/bof-vault"
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/bof-vault")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  BOF Vault
                </Link>
              </div>

              {/* Mobile Demo Preview */}
              <div className="px-4 py-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Demo Preview
                </div>
                <a
                  href={BOF_RUNTIME_LINKS.commandCenter}
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/command-center")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Command Center
                </a>
                <a
                  href={BOF_RUNTIME_LINKS.dispatch}
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/dispatch")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dispatch
                </a>
                <a
                  href={BOF_RUNTIME_LINKS.vault}
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/documents/vault")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Driver Vault
                </a>
                <a
                  href={BOF_RUNTIME_LINKS.pretrip}
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/pretrip")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pre-Trip
                </a>
              </div>

              {/* Mobile CTA Links */}
              <div className="px-4 py-2 space-y-2">
                <Link
                  href="/product"
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/product")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Product
                </Link>
                <Link
                  href="/driver-experience"
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/driver-experience")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Driver Experience
                </Link>
                <Link
                  href="/fleet-operations"
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/fleet-operations")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Fleet Operations
                </Link>
                <Link
                  href="/investors"
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/investors")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Investors
                </Link>
                <Link
                  href="/contact"
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/contact")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Contact
                </Link>
                <Link
                  href="/assessment"
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive("/assessment")
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Assessment
                </Link>
                <Link
                  href="/apply"
                  className="block bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium text-center transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Apply / Request Review
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
