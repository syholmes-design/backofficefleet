/**
 * Canonical demo load signature fields for approved load-doc templates.
 * Tied to loadId / driverId and load status — not name-only joins.
 *
 * Must stay in sync with `lib/load-signatures.ts` (types + docs).
 */

function xmlEscape(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escAttr(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function facilityHead(address) {
  const raw = String(address ?? "").trim();
  if (!raw) return "Origin facility";
  const cut = raw.split(/[-–—]/)[0]?.trim();
  return cut || raw;
}

function buildSvgDataUriForName(displayName) {
  const safe = xmlEscape(displayName);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="56" viewBox="0 0 300 56"><text x="6" y="38" font-family="Brush Script MT,Segoe Script,Lucida Handwriting,cursive" font-size="26" fill="#111827">${safe}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * @param {object} opts
 * @param {boolean} opts.signed
 * @param {string} opts.displayName printed / script name
 * @param {string} opts.title
 * @param {string} opts.signedAt
 * @param {string} rolePrefix alphanumeric + underscore only (template {{keys}})
 */
function rolePlaceholders(rolePrefix, { signed, displayName, title, signedAt }) {
  const css = signed ? "signature-signed" : "signature-pending";
  const status = signed ? "Signed" : "Pending signature";
  const scriptText = signed ? displayName : "Pending signature";
  const at = signed ? signedAt : "—";
  const svgUri = signed ? buildSvgDataUriForName(displayName) : "";
  const svgHtml = signed
    ? `<img class="signature-img" src="${escAttr(svgUri)}" alt="" width="220" height="44" />`
    : "";
  return {
    [`${rolePrefix}SignatureName`]: displayName,
    [`${rolePrefix}SignatureTitle`]: title,
    [`${rolePrefix}SignatureText`]: scriptText,
    [`${rolePrefix}SignedAt`]: at,
    [`${rolePrefix}SignatureStatus`]: status,
    [`${rolePrefix}SignatureCssClass`]: css,
    [`${rolePrefix}SignatureSvgDataUri`]: svgUri,
    [`${rolePrefix}SignatureSvgHtml`]: svgHtml,
  };
}

function utcStamp(now, hourOffset = 0) {
  const d = new Date(now.getTime() + hourOffset * 3600000);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

/**
 * @param {object} load from demo-data.json loads[]
 * @param {object | null} driver from demo-data.json drivers[] matched by id === load.driverId
 * @param {Date} now
 */
export function buildLoadSignaturePlaceholders(load, driver, now = new Date()) {
  const loadId = String(load.id ?? "").trim();
  const driverId = String(load.driverId ?? "").trim();
  const driverName = driver?.name?.trim() || driverId || "Assigned driver TBD";
  const status = String(load.status ?? "").trim();
  const isDelivered = status === "Delivered";
  /** Pickup-side signatures allowed once load has left planned-only states. */
  const pickupComplete =
    status === "Delivered" ||
    status === "En Route" ||
    status === "In Transit" ||
    status === "Assigned" ||
    status === "Dispatched" ||
    status === "Exception";
  const sealMismatch = String(load.sealStatus ?? "").toLowerCase() === "mismatch";
  const hasClaim = Boolean(load.dispatchExceptionFlag || sealMismatch);

  const signatureStatusSummary = isDelivered
    ? "complete"
    : pickupComplete
      ? "in_transit"
      : "pre_pickup";

  const pickupAt = utcStamp(now, -36);
  const dispatchAt = utcStamp(now, -30);
  const deliveryAt = utcStamp(now, -4);
  const claimAt = utcStamp(now, -2);

  const originHead = facilityHead(load.origin);
  const destHead = facilityHead(load.destination);
  const shipperSigner = `${originHead} — authorized representative`;
  const receiverSigner = `${destHead} — receiving clerk`;
  const dispatcherName = "Avery Kim";
  const dispatcherTitle = "BOF Dispatcher · Operations";
  const claimsName = "R. Patel";
  const claimsTitle = "BOF Claims Coordinator";
  const billingName = "S. Nguyen";
  const billingTitle = "BOF Billing Coordinator";
  const carrierRepName = "M. Torres";
  const carrierRepTitle = "Authorized carrier representative · BOF carrier group";
  const bofOpsReviewName = "L. Okonkwo";
  const bofOpsReviewTitle = "BOF Operations — seal / custody review";
  const lumperVendorName = "Dock Services LLC";
  const lumperVendorTitle = "Lumper / unloading vendor";

  const baseDriverTitle = `Driver · ${driverId || "—"}`;

  const out = {
    ...rolePlaceholders("shipper", {
      signed: pickupComplete,
      displayName: shipperSigner,
      title: "Shipper / origin facility",
      signedAt: pickupAt,
    }),
    ...rolePlaceholders("receiver", {
      signed: isDelivered,
      displayName: receiverSigner,
      title: "Consignee / receiver",
      signedAt: deliveryAt,
    }),
    ...rolePlaceholders("driver", {
      signed: isDelivered,
      displayName: driverName,
      title: baseDriverTitle,
      signedAt: deliveryAt,
    }),
    ...rolePlaceholders("driverBolPickup", {
      signed: pickupComplete,
      displayName: driverName,
      title: `${baseDriverTitle} — pickup`,
      signedAt: pickupAt,
    }),
    ...rolePlaceholders("carrier", {
      signed: isDelivered,
      displayName: carrierRepName,
      title: carrierRepTitle,
      signedAt: deliveryAt,
    }),
    ...rolePlaceholders("dispatcher", {
      signed: pickupComplete,
      displayName: dispatcherName,
      title: dispatcherTitle,
      signedAt: dispatchAt,
    }),
    ...rolePlaceholders("claims", {
      signed: hasClaim,
      displayName: claimsName,
      title: claimsTitle,
      signedAt: claimAt,
    }),
    ...rolePlaceholders("driverClaimStatement", {
      signed: hasClaim && Boolean(driverId),
      displayName: driverName,
      title: `${baseDriverTitle} — driver statement`,
      signedAt: claimAt,
    }),
    ...rolePlaceholders("receiverClaimAck", {
      signed: hasClaim && isDelivered,
      displayName: receiverSigner,
      title: "Receiver / customer acknowledgement",
      signedAt: deliveryAt,
    }),
    ...rolePlaceholders("settlements", {
      signed: true,
      displayName: "Taylor Reed",
      title: "BOF Settlements Coordinator",
      signedAt: utcStamp(now, -3),
    }),
    ...rolePlaceholders("billing", {
      signed: true,
      displayName: billingName,
      title: billingTitle,
      signedAt: utcStamp(now, -1),
    }),
    ...rolePlaceholders("bofOpsReview", {
      signed: sealMismatch && (isDelivered || pickupComplete),
      displayName: bofOpsReviewName,
      title: bofOpsReviewTitle,
      signedAt: isDelivered ? deliveryAt : dispatchAt,
    }),
    ...rolePlaceholders("lumperVendor", {
      signed: pickupComplete,
      displayName: lumperVendorName,
      title: lumperVendorTitle,
      signedAt: pickupAt,
    }),
    ...rolePlaceholders("lumperDriver", {
      signed: pickupComplete,
      displayName: driverName,
      title: `${baseDriverTitle} — lumper acknowledgment`,
      signedAt: pickupAt,
    }),
    /** Rate con: broker line uses shipper-side customer acceptance (demo). */
    ...rolePlaceholders("broker", {
      signed: pickupComplete,
      displayName: shipperSigner,
      title: "Customer / broker tender acceptance",
      signedAt: pickupAt,
    }),
    /** Rate con: carrier acceptance */
    ...rolePlaceholders("carrierRateCon", {
      signed: pickupComplete,
      displayName: carrierRepName,
      title: "Carrier rate confirmation acceptance",
      signedAt: pickupAt,
    }),
    /** Optional driver acknowledgement on rate con — after assignment. */
    ...rolePlaceholders("driverRateAck", {
      signed: Boolean(driverId) && pickupComplete,
      displayName: driverName,
      title: `${baseDriverTitle} — acknowledgement`,
      signedAt: dispatchAt,
    }),
    deliveryTimestampDisplay: isDelivered ? deliveryAt : "— Pending delivery",
    loadId,
    signatureStatusSummary,
    signaturePodComment: `<!-- bof-sig-pod:${signatureStatusSummary} -->`,
    signatureBolComment: `<!-- bof-sig-bol:${signatureStatusSummary} -->`,
    signatureRateConComment: `<!-- bof-sig-ratecon:${signatureStatusSummary} -->`,
  };

  return out;
}
