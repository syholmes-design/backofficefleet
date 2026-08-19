"use client";

import { usePathname } from "next/navigation";
import { BofHeader } from "@/components/BofHeader";

export function ConditionalHeader() {
  const pathname = usePathname();
  
  // Don't show header on marketing routes
  const isMarketingRoute = pathname === '/' || 
    pathname.startsWith('/product') ||
    pathname.startsWith('/driver-experience') ||
    pathname.startsWith('/fleet-operations') ||
    pathname.startsWith('/investors') ||
    pathname.startsWith('/contact') ||
    pathname.startsWith('/apply') ||
    pathname.startsWith('/founding-fleet') ||
    pathname.startsWith('/blog') ||
    pathname.startsWith('/bof-vault') ||
    pathname.startsWith('/book-assessment') ||
    pathname.startsWith('/fleet-savings') ||
    pathname.startsWith('/for-hire-carriers') ||
    pathname.startsWith('/government') ||
    pathname.startsWith('/private-fleets');
  
  if (isMarketingRoute) {
    return null;
  }
  
  return <BofHeader />;
}
