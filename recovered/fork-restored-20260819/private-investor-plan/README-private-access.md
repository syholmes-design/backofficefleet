# BOF Private Investor Plan Access Notes

This route is private presentation material. The JavaScript passcode gate is a presentation convenience only; it is not true server-side security.

Before sharing `/private-investor-plan/` externally, protect the folder with hosting-level Basic Auth through the hosting provider or cPanel.

## Required posture

- Keep `/private-investor-plan/` unlinked from public navigation, sitemap, homepage cards, demo pages, and customer portal pages.
- Keep the page `noindex,nofollow`.
- Create investor or presenter credentials outside the repository.
- Do not commit `.htpasswd`, `.htpasswds`, password files, password hashes, real usernames, or real passwords.
- Keep `Website/private-investor-plan/.htaccess.example` credential-free.

## Suggested cPanel / shared-hosting steps

1. Open cPanel Directory Privacy or the hosting provider's equivalent tool.
2. Select `/private-investor-plan/`.
3. Enable password protection for that directory.
4. Create one or more investor or presenter users.
5. Confirm the server writes the real `.htaccess` and password file.
6. Confirm the password file lives outside the public web root.
7. Test in a private/incognito browser session.
8. Confirm the browser requires Basic Auth before the JavaScript passcode screen appears.

The JavaScript passcode gate may remain as a second presentation layer after server-level access protection is enabled.
