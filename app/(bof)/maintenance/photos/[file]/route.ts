export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  const label = decodeURIComponent(file).replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
  const escapedLabel = label.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return map[char] ?? char;
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-label="Maintenance evidence ${escapedLabel}">
  <rect width="960" height="540" fill="#0f172a"/>
  <rect x="48" y="48" width="864" height="444" rx="24" fill="#111827" stroke="#38bdf8" stroke-width="3"/>
  <text x="80" y="130" fill="#e2e8f0" font-family="Segoe UI, Arial, sans-serif" font-size="44" font-weight="700">Maintenance Evidence</text>
  <text x="80" y="202" fill="#93c5fd" font-family="Segoe UI, Arial, sans-serif" font-size="30">${escapedLabel}</text>
  <text x="80" y="286" fill="#cbd5e1" font-family="Segoe UI, Arial, sans-serif" font-size="24">Demo fallback image for work-order photo review.</text>
  <text x="80" y="340" fill="#cbd5e1" font-family="Segoe UI, Arial, sans-serif" font-size="24">Use with maintenance, dispatch, and settlement readiness checks.</text>
  <text x="80" y="432" fill="#67e8f9" font-family="Segoe UI, Arial, sans-serif" font-size="22">BackOfficeFleet proof packet</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
