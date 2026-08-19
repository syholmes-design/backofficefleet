"use client";

import { useEffect, useState } from "react";
import { BofLogo } from "@/components/BofLogo";

export function MarketingBrandMark() {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      return;
    }
    setIsPlaying(true);
    const timer = window.setTimeout(() => setIsPlaying(false), 4200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <span className="bof-mkt-brand" aria-hidden="true">
      <span className={`bof-mkt-logo-motion${isPlaying ? " is-playing" : ""}`}>
        <BofLogo variant="light" size="demoLarge" className="bof-mkt-logo-motion__base" />
        <svg
          className="bof-mkt-logo-motion__overlay"
          viewBox="0 0 500 70"
          aria-hidden="true"
          focusable="false"
        >
          <g className="bof-mkt-logo-motion__roads">
            <path d="M72 56 L156 50 L151 56 L68 62 Z" />
            <path d="M88 62 L170 56 L165 62 L84 68 Z" />
          </g>
          <g className="bof-mkt-logo-motion__truck bof-mkt-logo-motion__truck--navy" transform="translate(120 46)">
            <rect x="0" y="0" width="30" height="11" rx="2" />
            <rect x="24" y="3" width="10" height="8" rx="2" />
            <circle cx="7" cy="12" r="2.4" />
            <circle cx="24" cy="12" r="2.4" />
          </g>
          <g className="bof-mkt-logo-motion__truck bof-mkt-logo-motion__truck--teal" transform="translate(176 42)">
            <rect x="0" y="0" width="34" height="12" rx="2" />
            <rect x="27" y="3" width="10" height="9" rx="2" />
            <circle cx="8" cy="13" r="2.4" />
            <circle cx="27" cy="13" r="2.4" />
          </g>
          <g className="bof-mkt-logo-motion__truck bof-mkt-logo-motion__truck--gold" transform="translate(238 38)">
            <rect x="0" y="0" width="38" height="13" rx="2" />
            <rect x="30" y="3" width="10" height="10" rx="2" />
            <circle cx="10" cy="14" r="2.4" />
            <circle cx="30" cy="14" r="2.4" />
          </g>
        </svg>
      </span>
      <span className="bof-mkt-brand__tag">CONTROL • COMPLY • CLEAR</span>
    </span>
  );
}
