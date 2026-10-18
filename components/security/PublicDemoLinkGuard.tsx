"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { publicDemoTarget } from "@/lib/security/public-demo-links";
import { isPublicRoute } from "@/lib/security/route-access";

const ORIGINAL = "data-bof-signed-in-href";

/**
 * On public pages, for visitors without a session, points links into the signed-in platform at the
 * matching public demonstration (lib/security/public-demo-links.ts). Signed-in users are untouched.
 */
export function PublicDemoLinkGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname || !isPublicRoute(pathname)) return;
    let cancelled = false;
    let observer: MutationObserver | null = null;

    const rewrite = (root: ParentNode) => {
      // Every pass re-checks all links: components re-render hrefs on the same anchors.
      root.querySelectorAll<HTMLAnchorElement>(`a[href^="/"]`).forEach((a) => {
        const href = a.getAttribute("href") ?? "";
        const target = publicDemoTarget(href);
        if (target) {
          a.setAttribute(ORIGINAL, href);
          a.setAttribute("href", target);
        }
      });
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const a = (event.target as Element | null)?.closest?.(`a[${ORIGINAL}]`);
      if (!a) return;
      // Stop the component's own router link from navigating to the signed-in route.
      event.preventDefault();
      event.stopPropagation();
      router.push(a.getAttribute("href") ?? "/");
    };

    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((session) => {
        if (cancelled || session?.user) return;
        rewrite(document);
        let scheduled = false;
        observer = new MutationObserver(() => {
          if (scheduled) return;
          scheduled = true;
          requestAnimationFrame(() => {
            scheduled = false;
            if (!cancelled) rewrite(document);
          });
        });
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["href"] });
        window.addEventListener("click", onClick, true);
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
      window.removeEventListener("click", onClick, true);
    };
  }, [pathname, router]);

  return null;
}
