export function extractUnitNumber(question: string): string | null {
  const truck = question.match(/\b(?:truck|tractor|unit)\s*#?\s*([A-Za-z0-9-]+)/i);
  if (truck?.[1]) return truck[1];
  const unit = question.match(/\bTR-(\d+)\b/i);
  if (unit) return `TR-${unit[1]}`;
  return null;
}

export function extractNearCity(question: string): string | null {
  const near = question.match(/\bnear\s+([A-Za-z .'-]+?)(?:\?|$|,)/i);
  return near?.[1]?.trim() ?? null;
}
