# Global Shell Correction Report

Date: July 28, 2026
Branch: `codex/design-system-2-wave-4`
Starting HEAD: `f283cdbf474221145aa8dfaa166ea562606a4c18`

## Summary

This pass corrects the public BOF shell by installing a canonical public header and footer through `Website/assets/js/site.js`, using the approved `boflogo-original.png` logo, removing the phone icon/control, and adding legal footer links.

The hidden customer portal and interactive demo shells were not converted to the marketing shell.

## Corrected Shell

- Header logo: `/assets/images/logo/boflogo-original.png`
- Top navigation: Who We Serve, Drivers, Dispatch & Operations, Safety & Compliance, Settlements & Billing, Business Operations, Policies & Procedures, Company
- Primary CTA: `/book-a-demo/`
- Footer columns: Company, Audiences, Products, Solutions, Get Started, Legal
- Legal links: `/privacy/`, `/terms/`, `/accessibility/`

## Phone Control Removal

Removed the runtime `.header-contact-icon` creation from `site.js` and removed stylesheet selectors for the obsolete phone control.

Validation search for `header-contact-icon`, `16.92`, and `header-lockup.svg` returned no remaining matches in public HTML, JS, or CSS.

## QA

Playwright route QA passed for 21 routes across desktop, tablet, and mobile:

- canonical header count: 1
- approved logo rendered
- phone control absent
- legal footer links present
- no horizontal overflow

Screenshot evidence is stored in `docs/design-system-2/screenshots/wave-4-global-shell-utility-review/`.
