---
name: website-ftp-upload
description: Use for BOF Website-only FTPS deployment, FTP over TLS dry runs, uploading the current static Website folder to ftp.backofficefleet.com with explicit TLS, and preventing uploads from bof-web-Original, .codex, project root, or any non-Website folder.
---

# Website FTPS Upload

Use this skill when the user asks to upload, deploy, publish, sync, FTP, FTPS, or FTP-over-TLS the current BOF website.

## Scope

- Upload only `D:\Websites\Sylvester Sr\BOF\Website`.
- Do not upload `Website\.htaccess`; the client explicitly asked not to transfer it.
- Do not upload `bof-web-Original`, `.codex`, project-root files, backups, source notes, screenshots, recordings, or any folder outside `Website`.
- Do not implement site changes as part of this skill unless the user separately asks for implementation.
- Do not store FTP/FTPS usernames or passwords in `SKILL.md`, `AGENTS.md`, scripts, checklists, logs, or public project files.
- The user has explicitly chosen unattended uploads over maximum passphrase secrecy. The only approved stored passphrase location is `.codex/secrets/website-ftps-passphrase.txt`; never print its contents or commit it.

## Connection

- Server: `ftp.backofficefleet.com`
- Port: `21`
- Protocol: explicit FTPS, meaning FTP over TLS on port `21`.
- Credential: prefer the passphrase-encrypted credential file created by `save-website-ftp-credential.ps1`.
- Unattended credential unlock: if `.codex/secrets/website-ftps-passphrase.txt` exists, the uploader reads it automatically so dry runs and uploads can run without user intervention on synced computers.
- Project preference: this host currently presents an invalid FTPS certificate, and the user intentionally bypasses that warning in FileZilla. For BOF uploads to this specific host, use `-AllowInvalidCertificate` unless the user explicitly asks to test strict certificate validation.

## Required Workflow

1. Confirm the request is for the current BOF `Website` folder.
2. If website files changed in the same turn, run relevant validation first.
3. Run a dry run. If runtime credentials, an encrypted credential plus runtime passphrase, or the saved unattended passphrase file are available, the dry run compares remote file size, remote timestamp, and the remote deploy manifest hashes before listing upload candidates. Without credentials, dry run stays offline and reports the local inventory.

```powershell
.\.codex\skills\website-ftp-upload\scripts\upload-website-ftp.ps1 -DryRun -AllowInvalidCertificate
```

4. Review the dry-run file count and confirm it is only `Website` content.
5. Upload only after the user has asked to deploy or clearly approved deployment. If `.codex/secrets/website-ftps-passphrase.txt` exists, the upload runs without an interactive passphrase prompt:

```powershell
.\.codex\skills\website-ftp-upload\scripts\upload-website-ftp.ps1 -AllowInvalidCertificate
```

To create or refresh the encrypted credential file:

```powershell
.\.codex\skills\website-ftp-upload\scripts\save-website-ftp-credential.ps1
```

To save the credential-file passphrase for unattended uploads across synced computers:

```powershell
.\.codex\skills\website-ftp-upload\scripts\save-website-ftp-passphrase.ps1
```

If launching from File Explorer or a normal Windows double-click workflow, use the `.cmd` wrappers so Windows does not open the PowerShell script in Notepad:

```text
.codex/skills/website-ftp-upload/scripts/save-website-ftp-passphrase.cmd
.codex/skills/website-ftp-upload/scripts/upload-website-ftp-dry-run.cmd
.codex/skills/website-ftp-upload/scripts/upload-website-ftp.cmd
```

## Rules

- Prefer upload-only behavior. Do not delete remote files unless the user explicitly asks and a separate deletion-safe workflow exists.
- Require TLS for every FTP request. The script sets and asserts `EnableSsl = $true`; there is no plain-FTP fallback or parameter to disable TLS.
- For this BOF host, treat `-AllowInvalidCertificate` as the normal project upload mode because the user has given a standing preference to bypass the known invalid certificate warning, matching their FileZilla workflow. This keeps FTPS/TLS enabled but disables remote certificate trust validation for that upload process only.
- Do not use certificate bypass for other hosts unless the user explicitly asks.
- The encrypted credential file may live at `.codex/secrets/website-ftps-credential.json`. It must contain only encrypted payload fields, never plaintext username or password.
- Do not store the credential-file passphrase in skills, checklists, logs, public project files, or tracked files. The BOF unattended exception is `.codex/secrets/website-ftps-passphrase.txt`, which is gitignored and intentionally portable through the user's synced project folder.
- Exclude `.htaccess` from the upload even when it lives inside `Website`; other deployable dotfiles may be included only when they are under `Website`.
- Treat failures as incomplete deploys. Report the failed file and error; do not pretend the upload completed.
- If the script refuses a path because it is outside `Website`, stop and report the guardrail instead of bypassing it.
- If credentials fail, ask the user to verify the FTP password or account state. Do not retry with guessed credentials.
- If a full mirrored deploy with remote deletion is requested, stop and ask for explicit confirmation before building that separate process.

## Script

Use:

```text
.codex/skills/website-ftp-upload/scripts/upload-website-ftp.ps1
.codex/skills/website-ftp-upload/scripts/upload-website-ftp-dry-run.cmd
.codex/skills/website-ftp-upload/scripts/upload-website-ftp.cmd
```

Credential helpers:

```text
.codex/skills/website-ftp-upload/scripts/save-website-ftp-credential.ps1
.codex/skills/website-ftp-upload/scripts/save-website-ftp-passphrase.ps1
.codex/skills/website-ftp-upload/scripts/save-website-ftp-passphrase.cmd
.codex/skills/website-ftp-upload/scripts/remove-website-ftp-credential.ps1
```

Important parameters:

- `-DryRun`: list what would upload. With credentials available, this performs a remote comparison; without credentials, it stays offline and lists the local inventory.
- `-AllowInvalidCertificate`: explicit opt-in for the known hosting certificate issue. Keeps TLS enabled, bypasses certificate validation, and reports `CertificateValidationBypassed = True`.
- `-RemoteRoot`: optional remote directory, default `/`.
- `-ManifestName`: optional remote deploy manifest filename, default `.bof-deploy-manifest.json`.
- `-ForceFullUpload`: bypass remote comparison and upload all Website files except excluded files.
- `-CredentialPath`: optional encrypted credential file path, default `.codex/secrets/website-ftps-credential.json`.
- `-CredentialPassphrase`: runtime-only passphrase alternative to the interactive prompt.
- `-CredentialPassphrasePath`: optional plaintext passphrase file path for unattended BOF uploads, default `.codex/secrets/website-ftps-passphrase.txt`.
- `-Username` and `-Password`: runtime-only fallback values. Do not save real values in project files or command history.

Incremental behavior:

- The script computes a SHA-256 hash for every local `Website` file except excluded files.
- It excludes `Website\.htaccess` from the upload and from the remote manifest.
- It checks each remote file's size and timestamp over explicit FTPS.
- It reads a remote `.bof-deploy-manifest.json` when present and compares stored SHA-256 hashes.
- It uploads only files that are missing, size-changed, hash-changed, or newer than the remote timestamp when no manifest hash exists.
- After a successful upload run, it uploads a fresh remote manifest when needed. This manifest is deployment metadata only; it does not enable remote deletion or live sync.
