import type { ReactNode } from "react";
import Link from "next/link";
import { getBookDemoHref, isExternalHref } from "@/lib/site-links";

type BookDemoLinkProps = {
  className?: string;
  children?: ReactNode;
  /** Visually hidden / screen reader label when link text is generic */
  ariaLabel?: string;
};

export function BookDemoLink({
  className,
  children = "Book a Demo",
  ariaLabel = "Book a BOF demo appointment",
}: BookDemoLinkProps) {
  const href = getBookDemoHref();
  if (isExternalHref(href)) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} prefetch={false} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
