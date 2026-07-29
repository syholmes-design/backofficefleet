# Obsolete Shell Code Removal

## Removed

- Runtime phone icon/control creation from `Website/assets/js/site.js`.
- `.header-contact-icon` CSS selectors from `Website/assets/css/styles.css`.
- Source shell logo references to `header-lockup.svg` on public Wave 2/Wave 3 pages.

## Retained

- Customer demo and customer portal shells remain independent app shells.
- Interactive demo shell remains independent and hidden from the public marketing shell conversion.
- Legacy shell source classes remain in some public HTML for backwards compatibility, but the loaded public runtime installs the canonical public shell before interaction handlers run.

## Validation

Searches for obsolete phone-control markers and `header-lockup.svg` returned no remaining matches.
