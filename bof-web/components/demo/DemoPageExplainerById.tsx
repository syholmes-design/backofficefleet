"use client";

import { DemoPageExplainer } from "@/components/demo/DemoPageExplainer";
import { getDemoPageExplainer, type DemoPageExplainerId } from "@/lib/demo/demo-page-explainers";

export function DemoPageExplainerById({
  pageId,
  className,
}: {
  pageId: DemoPageExplainerId;
  className?: string;
}) {
  const copy = getDemoPageExplainer(pageId);
  return (
    <DemoPageExplainer
      what={copy.what}
      why={copy.why}
      attention={copy.attention}
      className={className}
    />
  );
}
