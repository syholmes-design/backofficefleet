"use client";

import { useState } from "react";

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function CollapsibleAdvancedPanel({ title, subtitle, children, defaultOpen = false }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="bof-card" style={{ marginTop: 20 }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          border: "none",
          background: "none",
          textAlign: "left",
          cursor: "pointer",
          padding: 0,
        }}
        aria-expanded={isOpen}
        aria-controls={`advanced-content-${title.replace(/\s+/g, "-")}`}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 className="bof-h2" style={{ margin: 0 }}>{title}</h2>
            {subtitle && (
              <p className="bof-muted bof-small" style={{ margin: "4px 0 0 0" }}>
                {subtitle}
              </p>
            )}
          </div>
          <span
            style={{
              fontSize: "1.2rem",
              color: "#64748b",
              transition: "transform 0.2s ease",
              transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
            }}
          >
            ▶
          </span>
        </div>
      </button>
      
      {isOpen && (
        <div
          id={`advanced-content-${title.replace(/\s+/g, "-")}`}
          style={{ marginTop: 16 }}
        >
          {children}
        </div>
      )}
    </section>
  );
}
