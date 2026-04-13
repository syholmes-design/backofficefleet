"use client";

import { useState } from "react";

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export function DriverAvatar({
  name,
  photoUrl,
  size = 40,
}: {
  name: string;
  photoUrl?: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);

  if (photoUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        width={size}
        height={size}
        className="bof-avatar-img"
        title={name}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span
      className="bof-avatar-fallback"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
