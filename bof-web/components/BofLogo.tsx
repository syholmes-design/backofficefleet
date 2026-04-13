"use client";

import Image from "next/image";

type Props = {
  variant?: "light" | "dark";
  className?: string;
  /** Set true for above-the-fold header logo (LCP). */
  priority?: boolean;
};

export function BofLogo({
  variant = "light",
  className,
  priority = false,
}: Props) {
  const src =
    variant === "dark"
      ? "/logo/boflogo-dark.png"
      : "/logo/boflogo-light.png";

  return (
    <div className={["bof-logo-wrap", className].filter(Boolean).join(" ")}>
      <Image
        src={src}
        alt="BackOfficeFleet"
        width={180}
        height={40}
        priority={priority}
        style={{ height: "40px", width: "auto" }}
      />
    </div>
  );
}
