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
  const src = variant === "dark" ? "/approved/bof-logo-approved2.png" : "/approved/bof-logo-approved.png";

  const heightPx = size === "demoLarge" ? 60 : 40;
  const widthPx = Math.round(heightPx * 3.7);
  const cropScale = variant === "dark" ? 1.2 : 1;

  return (
    <div
      className={["bof-logo-wrap", className].filter(Boolean).join(" ")}
      style={{ width: `${widthPx}px`, height: `${heightPx}px`, overflow: "hidden", position: "relative" }}
    >
      <Image
        src={src}
        alt="BackOfficeFleet"
        width={widthPx}
        height={heightPx}
        priority={priority}
        style={
          variant === "dark"
            ? {
                position: "absolute",
                flexShrink: 0,
                width: `${Math.round(widthPx * cropScale)}px`,
                maxWidth: "none",
                height: `${Math.round(widthPx * cropScale * (1024 / 1536))}px`,
                left: `${-Math.round(widthPx * 0.05)}px`,
                top: `${-Math.round(heightPx * 0.68)}px`,
              }
            : { height: `${heightPx}px`, width: "auto" }
        }
      />
    </div>
  );
}
