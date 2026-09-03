"use client";

import Image from "next/image";
import type { ReactNode } from "react";

export type OpsModuleMastheadChip = {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  onClick?: () => void;
};

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  imagePosition?: string;
  contentAlign?: "left" | "right";
  chips?: OpsModuleMastheadChip[];
  actions?: ReactNode;
  caption?: ReactNode;
  children?: ReactNode;
};

export function OpsModuleMasthead({
  eyebrow,
  title,
  description,
  imageSrc,
  imageAlt,
  imagePosition = "center",
  contentAlign = "left",
  chips,
  actions,
  caption,
  children,
}: Props) {
  return (
    <section className={`bof-ops-masthead bof-ops-masthead--content-${contentAlign}`} aria-labelledby="bof-ops-masthead-title">
      <div className="bof-ops-masthead__media" aria-hidden>
        <Image
          src={imageSrc}
          alt=""
          fill
          priority
          className="bof-ops-masthead__image"
          style={{ objectPosition: imagePosition }}
          sizes="(max-width: 768px) 100vw, 1366px"
        />
        <div className="bof-ops-masthead__veil" />
      </div>
      {caption ? <div className="bof-ops-masthead__caption">{caption}</div> : null}
      <div className="bof-ops-masthead__body">
        <p className="bof-ops-masthead__eyebrow">{eyebrow}</p>
        <h1 id="bof-ops-masthead-title" className="bof-ops-masthead__title">
          {title}
        </h1>
        <p className="bof-ops-masthead__lede">{description}</p>
        {chips && chips.length > 0 ? (
          <div className="bof-ops-masthead__chips">
            {chips.map((chip) => {
              const content = (
                <>
                  <span className="bof-ops-masthead__chip-label">{chip.label}</span>
                  <span className="bof-ops-masthead__chip-value">{chip.value}</span>
                  {chip.hint ? <span className="bof-ops-masthead__chip-hint">{chip.hint}</span> : null}
                </>
              );
              if (chip.href) {
                return (
                  <a key={chip.label} href={chip.href} className="bof-ops-masthead__chip bof-ops-masthead__chip--link">
                    {content}
                  </a>
                );
              }
              if (chip.onClick) {
                return (
                  <button key={chip.label} type="button" className="bof-ops-masthead__chip bof-ops-masthead__chip--link" onClick={chip.onClick}>
                    {content}
                  </button>
                );
              }
              return (
                <div key={chip.label} className="bof-ops-masthead__chip">
                  {content}
                </div>
              );
            })}
          </div>
        ) : null}
        {actions ? <div className="bof-ops-masthead__actions">{actions}</div> : null}
        {children ? <div className="bof-ops-masthead__extra">{children}</div> : null}
        <span className="sr-only">{imageAlt}</span>
      </div>
    </section>
  );
}
