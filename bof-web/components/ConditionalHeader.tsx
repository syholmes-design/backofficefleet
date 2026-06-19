"use client";

import { usePathname } from "next/navigation";
import { BofHeader } from "@/components/BofHeader";

export function ConditionalHeader() {
  const pathname = usePathname();
  
  // Don't show the global product header on routes with their own controlled shell.
  const isMarketingRoute = pathname === '/' || 
    pathname.startsWith('/apply') ||
    pathname.startsWith('/bof-vault') ||
    pathname.startsWith('/book-assessment') ||
    pathname.startsWith('/fleet-savings') ||
    pathname.startsWith('/for-hire-carriers') ||
    pathname.startsWith('/government') ||
    pathname.startsWith('/private-fleets') ||
    pathname.startsWith('/customer-portal');
  
  if (isMarketingRoute) {
    return null;
  }
  
  return <BofHeader />;
}
