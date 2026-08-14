import { normalizeRegulatoryFeedItem } from "@/lib/regulatory-feed/normalize";
import type { BofRegulatoryFeedItem } from "@/lib/regulatory-feed-demo";

const FEDERAL_REGISTER_URL =
  "https://www.federalregister.gov/api/v1/documents.json?conditions%5Bagencies%5D%5B%5D=federal-motor-carrier-safety-administration&per_page=5&order=newest";
const REVALIDATE_SECONDS = 21600;

type FederalRegisterDocument = {
  abstract?: string;
  document_number?: string;
  html_url?: string;
  publication_date?: string;
  title?: string;
  type?: string;
};

type FederalRegisterResponse = {
  results?: FederalRegisterDocument[];
};

export async function fetchFederalRegisterFeedItems() {
  const response = await fetch(FEDERAL_REGISTER_URL, {
    headers: {
      Accept: "application/json",
      "User-Agent": "BackOfficeFleet/1.0 (+https://backofficefleet.com)",
    },
    next: { revalidate: REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`Federal Register API returned ${response.status}`);
  }

  const payload = (await response.json()) as FederalRegisterResponse;
  const results = payload.results ?? [];

  return results
    .map((document) =>
      normalizeRegulatoryFeedItem({
        title: document.title ?? "Federal Register Transportation Document",
        source: "Federal Register",
        sourceUrl: document.html_url ?? "",
        publishedAt: document.publication_date,
        summary: [document.type, document.abstract].filter(Boolean).join(": "),
      }),
    )
    .filter((item): item is BofRegulatoryFeedItem => Boolean(item));
}
