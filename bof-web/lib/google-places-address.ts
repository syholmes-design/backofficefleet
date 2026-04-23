/** Parse Google Place Details `result` into BOF intake address fields (demo / server use). */

export type ParsedPlaceAddress = {
  facilityName?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  formattedAddress?: string;
};

type AddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

export function parseGooglePlaceDetailsResult(result: {
  name?: string;
  formatted_address?: string;
  address_components?: AddressComponent[];
}): ParsedPlaceAddress {
  const comps = result.address_components ?? [];
  const get = (type: string) => comps.find((c) => c.types.includes(type));
  const streetNumber = get("street_number")?.long_name ?? "";
  const route = get("route")?.long_name ?? "";
  const address = [streetNumber, route].filter(Boolean).join(" ").trim();
  const city =
    get("locality")?.long_name ??
    get("sublocality_level_1")?.long_name ??
    get("sublocality")?.long_name ??
    get("neighborhood")?.long_name ??
    "";
  const state = get("administrative_area_level_1")?.short_name ?? "";
  const zip = get("postal_code")?.long_name ?? "";
  const isEstablishment = comps.some(
    (c) =>
      c.types.includes("establishment") ||
      c.types.includes("point_of_interest") ||
      c.types.includes("premise")
  );
  const facilityName =
    isEstablishment && result.name && !/^\d/.test(result.name.trim())
      ? result.name.trim()
      : undefined;
  const fallbackLine = result.formatted_address?.split(",")[0]?.trim() ?? "";
  return {
    facilityName,
    address: address || fallbackLine,
    city,
    state,
    zip,
    formattedAddress: result.formatted_address,
  };
}
