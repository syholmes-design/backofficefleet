"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";

/**
 * GAP-009-016: App Router client navigation can swallow same-origin clicks
 * without changing location. This keeps the existing href and uses the
 * browser document navigation already available. It is not a new router.
 */
export function ExistingDocumentNavAnchor({
  href,
  onClick,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!href) return;
    event.preventDefault();
    window.location.assign(href);
  }

  return (
    <a {...rest} href={href} onClick={handleClick}>
      {children}
    </a>
  );
}
