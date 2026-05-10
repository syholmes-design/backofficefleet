#!/usr/bin/env node

/**
 * BOF PORTALS DROPDOWN AUDIT
 * Purpose: Debug why Portals dropdown is not working
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function auditPortalsDropdown() {
  console.log("=== BOF PORTALS DROPDOWN AUDIT ===\n");
  
  // Check header component
  const headerPath = path.join(ROOT, "components", "BofHeader.tsx");
  console.log("=== HEADER COMPONENT ANALYSIS ===");
  
  if (fs.existsSync(headerPath)) {
    const headerContent = fs.readFileSync(headerPath, "utf8");
    
    // Check marketing paths
    const marketingOnlyPaths = [
      "/",
      "/for-hire-carriers", 
      "/private-fleets",
      "/government",
      "/bof-vault",
      "/book-assessment",
      "/apply",
      "/fleet-savings"
    ];
    
    const testRoutes = [
      "/",
      "/dashboard", 
      "/drivers",
      "/loads",
      "/settlements",
      "/documents",
      "/portals",
      "/portals/manager",
      "/portals/customer", 
      "/portals/driver",
      "/assessment/bof-vault"
    ];
    
    console.log("Route Header Analysis:");
    testRoutes.forEach(route => {
      const isMarketing = marketingOnlyPaths.includes(route);
      const headerType = isMarketing ? "Marketing Header" : "Demo/App Header";
      const hasPortals = !isMarketing; // PortalsDropdown only in demo header
      console.log(`${route.padEnd(20)} | ${headerType.padEnd(18)} | Portals: ${hasPortals ? "✅" : "❌"}`);
    });
    
    // Check PortalsDropdown implementation
    console.log(`\n=== PORTALS DROPDOWN IMPLEMENTATION ===`);
    const hasPortalsDropdown = headerContent.includes("function PortalsDropdown()");
    const hasPortalsNav = headerContent.includes("const portalsNav = [");
    const hasZIndexFix = headerContent.includes("zIndex: 9999");
    const hasOnClickHandler = headerContent.includes("onClick={() => setIsOpen(!isOpen)}");
    const hasStateManagement = headerContent.includes("const [isOpen, setIsOpen] = useState(false)");
    
    console.log(`PortalsDropdown function: ${hasPortalsDropdown ? "✅" : "❌"}`);
    console.log(`Portals navigation array: ${hasPortalsNav ? "✅" : "❌"}`);
    console.log(`Z-index fix (9999): ${hasZIndexFix ? "✅" : "❌"}`);
    console.log(`Click handler: ${hasOnClickHandler ? "✅" : "❌"}`);
    console.log(`State management: ${hasStateManagement ? "✅" : "❌"}`);
    
    // Check dropdown rendering
    console.log(`\n=== DROPDOWN RENDERING LOGIC ===`);
    const hasConditionalRender = headerContent.includes("{isOpen && (");
    const hasDropdownDiv = headerContent.includes("absolute top-full left-0");
    const hasMouseEvents = headerContent.includes("onMouseEnter={openDropdown}");
    const hasClickClose = headerContent.includes("onClick={() => setIsOpen(false)}");
    
    console.log(`Conditional render: ${hasConditionalRender ? "✅" : "❌"}`);
    console.log(`Dropdown positioning: ${hasDropdownDiv ? "✅" : "❌"}`);
    console.log(`Mouse events: ${hasMouseEvents ? "✅" : "❌"}`);
    console.log(`Click to close: ${hasClickClose ? "✅" : "❌"}`);
    
    // Extract portal links
    console.log(`\n=== PORTAL LINKS ===`);
    const portalLinksMatch = headerContent.match(/\{ href: "([^"]+)", label: "([^"]+)"/g);
    if (portalLinksMatch) {
      portalLinksMatch.forEach(link => {
        const match = link.match(/\{ href: "([^"]+)", label: "([^"]+)"/);
        if (match) {
          console.log(`${match[2]}: ${match[1]}`);
        }
      });
    }
    
  } else {
    console.log("❌ BofHeader.tsx not found");
  }
  
  // Check portal routes
  console.log(`\n=== PORTAL ROUTES ===`);
  const portalRoutes = [
    "app/portals/page.tsx",
    "app/portals/manager/page.tsx",
    "app/portals/customer/page.tsx", 
    "app/portals/driver/page.tsx"
  ];
  
  portalRoutes.forEach(route => {
    const routePath = path.join(ROOT, route);
    const exists = fs.existsSync(routePath);
    console.log(`${route}: ${exists ? "✅" : "❌"}`);
  });
  
  // Check for any CSS conflicts
  console.log(`\n=== POTENTIAL CSS CONFLICTS ===`);
  const globalsPath = path.join(ROOT, "app", "globals.css");
  if (fs.existsSync(globalsPath)) {
    const globalsContent = fs.readFileSync(globalsPath, "utf8");
    const hasOverflowHidden = globalsContent.includes("overflow: hidden");
    const hasZIndexConflicts = globalsContent.includes("z-50") || globalsContent.includes("z-40");
    const hasPointerEventsNone = globalsContent.includes("pointer-events: none");
    
    console.log(`Overflow hidden rules: ${hasOverflowHidden ? "⚠️  POTENTIAL CONFLICT" : "✅ OK"}`);
    console.log(`Z-index conflicts: ${hasZIndexConflicts ? "⚠️  POTENTIAL CONFLICT" : "✅ OK"}`);
    console.log(`Pointer-events none: ${hasPointerEventsNone ? "⚠️  POTENTIAL CONFLICT" : "✅ OK"}`);
  }
}

auditPortalsDropdown();
