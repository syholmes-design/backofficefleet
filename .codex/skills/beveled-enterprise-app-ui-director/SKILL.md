---
name: beveled-enterprise-app-ui-director
description: "Use for BOF /interactive-demo visual styling that must match the generated beveled enterprise app mockup: light-mode control-center software, raised rounded buttons, toolbar chrome, SVG UI icons, dense tables, document viewer panes, right-side inspectors/actions, bottom release/audit panels, and fixing app UI that feels flat, webby, sparse, card-heavy, or too close to the public website."
---

# Beveled Enterprise App UI Director

Use this project-local skill when BOF's `/interactive-demo/` must visually match the saved beveled enterprise operations-console reference instead of merely looking like a generic light app shell.

## Purpose

Protect the exact product-UI style target for the hands-on BOF demo: light-mode desktop software with bevels, rounded controls, toolbar chrome, SVG UI icons, dense tables, selected rows, document viewer panes, right-side inspection/actions, and bottom release/audit packet panels.

## When To Use

- The user says the demo should look like the generated image or mockup
- The app UI is described as too flat, webby, sparse, card-heavy, or website-like
- `/interactive-demo/` needs beveled rounded corners, buttons, chips, tabs, or controls
- UI work needs simple SVG icons for sidebars, toolbars, status/actions, document controls, bell/help/avatar/settings, approve/reject/reset, filters, refresh, or search
- Visual QA needs to compare the app shell to the saved reference

## Context To Load

- `AGENTS.md`
- `.codex/frontend-demo-architecture.md`
- `.codex/agents/beveled_enterprise_app_ui_director.md`
- `.codex/references/interactive-demo-beveled-console-reference.jpg`
- `Website/interactive-demo/index.html`
- `Website/assets/css/styles.css`
- `Website/assets/js/site.js`

## Procedure

1. Confirm `Website` is the active target and `bof-web-Original` is reference-only.
2. Inspect the saved reference image before judging or changing `/interactive-demo/`.
3. Coordinate with `product-shell-simulation-architect` for app state/shell structure, `interactive-demo-czar` for scenario quality, and `client-demo-proof-advocate` for click completeness.
4. Apply the reference style: light gray workspace, white panes, thin borders, subtle shadows, bevels, rounded raised controls, compact topbar/side rail, toolbar rows, selected table rows, document viewer chrome, right inspector/actions, and bottom release/audit packet areas.
5. Use SVG only for simple UI icons and app controls. Do not use SVG for complex people, trucks, trailers, vehicles, or realistic objects.
6. Reject public-website rhythm: hero sections, CTA bands, large marketing cards, sparse panels, decorative backgrounds, and oversized marketing typography.
7. Keep the shell static, dependency-free, accessible, and self-contained. Do not add packages, frameworks, real login, persistence, uploads, or server behavior.
8. After implementation, run visual snapshots and compare the app viewport against the saved reference.

## Checks

- Does `/interactive-demo/` look like a real desktop enterprise operations console?
- Does the first app viewport resemble the saved reference image?
- Are buttons, tabs, chips, and panes beveled or tactile rather than flat?
- Are sidebar, toolbar, status/action, and document controls supported by simple SVG icons where appropriate?
- Is the load queue dense and readable with selected rows, counters, filters, and status chips?
- Does the document viewer have app chrome and inspectable document structure?
- Are the right inspector/actions and bottom release/audit panels visible?
- Is the public website template absent from the product shell?
- Does the implementation remain light-mode, static, small, and shared-hosting friendly?

## Output Format

```markdown
## Beveled Enterprise App UI Review

Screen:
Reference match:
Flat/webby elements to replace:
Beveled controls required:
SVG icon opportunities:
Pane/table/document chrome:
Right rail and bottom packet requirements:
Mobile behavior:
Performance/static notes:
Priority fixes:
```

## Failure Modes

- Treating the reference as a loose mood board instead of the visual target
- Making the shell app-like but still flat
- Using website cards instead of application panes
- Adding icons as decoration without app function
- Increasing density until the UI becomes unreadable
- Solving polish with dependencies instead of CSS/SVG/HTML

## Safety Boundaries

- Do not edit `bof-web-Original`.
- Do not add Next.js, React, TypeScript, npm, package files, `node_modules`, `.next`, heavy libraries, or server runtime assumptions.
- Do not implement real authentication, credentials, uploads, saved state, databases, or production workflow logic.
- Do not expose visible buyer-facing language such as `mockup`, `static demo`, `implementation`, `prototype`, or `demo-builder`.
- Do not use SVG for complex people, trucks, trailers, vehicles, or realistic objects.
