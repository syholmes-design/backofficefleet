"use client";

import Image from "next/image";

type Props = {
  variant?: "light" | "dark";
  size?: "default" | "demoLarge";
  className?: string;
  /** Set true for above-the-fold header logo (LCP). */
  priority?: boolean;
};

export function BofLogo({
  variant = "light",
  size = "default",
  className,
  priority = false,
}: Props) {
  const src =
    variant === "dark"
      ? "/logo/boflogo-dark.png"
      : "/logo/boflogo-light.png";

  const heightPx = size === "demoLarge" ? 60 : 40;
  const widthPx = Math.round(heightPx * 4.5);

  return (
    <div className={["bof-logo-wrap", className].filter(Boolean).join(" ")}>
      <Image
        src={src}
        alt="BackOfficeFleet"
        width={widthPx}
        height={heightPx}
        priority={priority}
        style={{ height: `${heightPx}px`, width: "auto" }}
      />
    </div>
  );
}
