"use client";

import { useEffect, useState } from "react";

/** Sticky stage navigator for /recruiting-onboarding: jumps to a stage and highlights the one in view. */
export function RecruitingStageNav({ stages }: { stages: Array<{ id: string; number: string; title: string; steps: string }> }) {
  const [active, setActive] = useState(stages[0]?.id ?? "");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const stage of stages) {
      const el = document.getElementById(stage.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [stages]);

  return (
    <nav aria-label="Recruiting stages" className="bof-ro-stagenav">
      <ol>
        {stages.map((stage) => (
          <li key={stage.id}>
            <a href={`#${stage.id}`} aria-current={active === stage.id ? "step" : undefined} data-active={active === stage.id || undefined}>
              <span className="bof-ro-stagenav__num">{stage.number}</span>
              <span className="bof-ro-stagenav__title">{stage.title}</span>
              <span className="bof-ro-stagenav__steps">{stage.steps}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
