function clean(value) {
  return String(value ?? "").trim();
}

export function buildEvidenceImagePrompt(load, evidenceType) {
  const commodity = clean(load.commodity) || "general palletized freight";
  const pickup = clean(load.origin) || "shipper facility";
  const delivery = clean(load.destination) || "receiver dock";
  const pickupSeal = clean(load.pickupSeal) || "not visible";
  const deliverySeal = clean(load.deliverySeal) || "not visible";
  const laneNote = `Load ${load.id}, ${pickup} to ${delivery}, cargo: ${commodity}.`;
  const base = [
    "Realistic smartphone proof photo for a trucking dispatch demo.",
    laneNote,
    "Dry van trailer operations context.",
    "No real company logos, no brand names, no real license plates.",
    "Avoid identifiable faces unless strictly necessary.",
    "No personal information and no injury or gore.",
    "Operational documentation style, subtle BOF demo watermark, timestamp overlay, 16:9.",
  ].join(" ");

  const promptByType = {
    cargoPhoto:
      "Loaded trailer interior at pickup with wrapped pallets secured by straps, clear cargo condition.",
    cargoDamagePhoto:
      "Damaged boxes and shifted pallets in trailer corner, claim-review context, no people.",
    emptyTrailerProof:
      "Empty dry van trailer after delivery, viewed from rear doors, clean floor and walls.",
    sealPickupPhoto: `Close-up of trailer door seal at pickup with readable but generic seal id, reference ${pickupSeal}.`,
    sealDeliveryPhoto: `Close-up of trailer door seal at delivery checkpoint, reference ${deliverySeal}.`,
    equipmentPhoto:
      "Truck and trailer side angle at dock with tires, lights, and trailer condition visible.",
    pickupPhoto:
      "Trailer at shipper dock during loading window, warehouse lighting, operational checkpoint framing.",
    deliveryPhoto:
      "Trailer backed into receiver dock at delivery, unloading-ready context, proof-of-arrival style.",
    lumperReceipt:
      "Paper lumper receipt on clipboard at warehouse dock, amounts blurred/generic, expense-proof composition.",
    claimEvidence:
      "Evidence board style photo composition: damaged cartons, seal notes, dock context for claim packet.",
    rfidDockProof:
      "Dock checkpoint proof image with RFID scanner terminal and trailer door in frame.",
  };

  return `${base} ${promptByType[evidenceType] || "Trucking proof photo context."}`;
}
