import type {
  AutoCheckResult,
  ComplianceRequirement,
  Facility,
  LoadRequirement,
  Shipper,
} from "@/lib/load-requirements-intake-types";

function isBlank(s: string | undefined | null) {
  return !s || !String(s).trim();
}

function emailOk(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * BOF auto-checks for load packet readiness. Blocking items disable packet generation.
 */
export function runAutoChecks(
  shipper: Shipper,
  facility: Facility,
  load: LoadRequirement,
  compliance: ComplianceRequirement
): AutoCheckResult[] {
  const lrId = load.load_requirement_id;
  const mk = (
    check_id: string,
    check_type: string,
    status: AutoCheckResult["status"],
    message: string
  ): AutoCheckResult => ({
    check_id,
    load_requirement_id: lrId,
    check_type,
    status,
    message,
  });

  const checks: AutoCheckResult[] = [];
  const insuranceNarrative =
    compliance.insurance_requirements?.trim() ||
    [
      compliance.insuranceRequirementType,
      `Coverage ${compliance.cargoCoverageLevel}`,
      compliance.certificateRequired ? "COI required" : "COI optional",
      compliance.additionalInsuredRequired ? "Additional insured required" : "",
      compliance.facilityEndorsementRequired ? "Facility endorsement required" : "",
    ]
      .filter(Boolean)
      .join(" · ");
  const bolNarrative =
    compliance.bol_instructions?.trim() ||
    [
      compliance.bolRequirementType,
      compliance.signedBolRequired ? "Signed BOL required" : "Unsigned BOL accepted",
      compliance.palletCountRequired ? "Pallet count required" : "",
      compliance.pieceCountRequired ? "Piece count required" : "",
      compliance.sealNotationRequired ? "Seal notation required" : "",
    ]
      .filter(Boolean)
      .join(" · ");
  const podNarrative =
    compliance.pod_requirements?.trim() ||
    [
      compliance.podRequirementType,
      compliance.signedPodRequired ? "Signed POD required" : "Unsigned POD accepted",
      compliance.receiverPrintedNameRequired ? "Receiver printed name required" : "",
      compliance.deliveryPhotoRequired ? "Delivery photos required" : "",
      compliance.emptyTrailerPhotoRequired ? "Empty trailer photos required" : "",
      compliance.sealVerificationRequired ? "Seal verification required" : "",
      compliance.gpsTimestampRequired ? "GPS timestamp required" : "",
    ]
      .filter(Boolean)
      .join(" · ");

  if (isBlank(shipper.shipper_name)) {
    checks.push(mk("chk-ship-name", "Shipper identity", "Blocking", "Shipper name is required."));
  } else {
    checks.push(mk("chk-ship-name", "Shipper identity", "Passed", "Shipper name on file."));
  }

  if (isBlank(shipper.primary_contact_name)) {
    checks.push(
      mk("chk-contact-name", "Primary contact", "Blocking", "Primary contact name is required.")
    );
  } else {
    checks.push(mk("chk-contact-name", "Primary contact", "Passed", "Primary contact name on file."));
  }

  if (isBlank(shipper.primary_contact_email) || !emailOk(shipper.primary_contact_email)) {
    checks.push(
      mk(
        "chk-contact-email",
        "Primary contact email",
        "Blocking",
        "Valid primary contact email is required."
      )
    );
  } else {
    checks.push(mk("chk-contact-email", "Primary contact email", "Passed", "Primary email format valid."));
  }

  if (isBlank(shipper.primary_contact_phone)) {
    checks.push(
      mk("chk-contact-phone", "Primary contact phone", "Blocking", "Primary contact phone is required.")
    );
  } else {
    checks.push(mk("chk-contact-phone", "Primary contact phone", "Passed", "Primary phone on file."));
  }

  if (isBlank(facility.facility_name)) {
    checks.push(mk("chk-fac-name", "Facility", "Blocking", "Facility name is required."));
  } else {
    checks.push(mk("chk-fac-name", "Facility", "Passed", "Facility name on file."));
  }

  if (isBlank(facility.address) || isBlank(facility.city) || isBlank(facility.state)) {
    checks.push(
      mk(
        "chk-fac-addr",
        "Facility address",
        "Blocking",
        "Complete facility street, city, and state are required."
      )
    );
  } else {
    checks.push(mk("chk-fac-addr", "Facility address", "Passed", "Facility address complete."));
  }

  if (isBlank(load.commodity)) {
    checks.push(mk("chk-commodity", "Commodity", "Blocking", "Commodity description is required."));
  } else {
    checks.push(mk("chk-commodity", "Commodity", "Passed", "Commodity captured."));
  }

  if (!Number.isFinite(load.weight) || load.weight <= 0) {
    checks.push(mk("chk-weight", "Weight", "Blocking", "Valid shipment weight is required."));
  } else {
    checks.push(mk("chk-weight", "Weight", "Passed", "Weight on file."));
  }

  if (isBlank(load.equipment_type)) {
    checks.push(mk("chk-equip", "Equipment", "Blocking", "Equipment type is required."));
  } else {
    checks.push(mk("chk-equip", "Equipment", "Passed", "Equipment type on file."));
  }

  if (load.temperature_required) {
    const minOk =
      load.temperature_min !== undefined &&
      load.temperature_max !== undefined &&
      Number.isFinite(load.temperature_min) &&
      Number.isFinite(load.temperature_max);
    if (!minOk || load.temperature_min! > load.temperature_max!) {
      checks.push(
        mk(
          "chk-temp",
          "Temperature control",
          "Blocking",
          "Temperature-controlled load requires valid min/max range (°F)."
        )
      );
    } else {
      checks.push(
        mk("chk-temp", "Temperature control", "Passed", "Temperature range defined for reefer load.")
      );
    }
  } else {
    checks.push(
      mk("chk-temp", "Temperature control", "Passed", "Dry / non-temperature-controlled — no range required.")
    );
  }

  if (compliance.seal_required) {
    if (isBlank(bolNarrative)) {
      checks.push(
        mk(
          "chk-seal-rule",
          "Seal rule",
          "Blocking",
          "Seals required — document seal handling in BOL instructions."
        )
      );
    } else {
      checks.push(mk("chk-seal-rule", "Seal rule", "Passed", "BOL instructions reference sealed shipment."));
    }
    if (!compliance.seal_number_required) {
      checks.push(
        mk(
          "chk-seal-number",
          "Seal number requirement",
          "Warning",
          "Seals in use — confirm whether seal number must be recorded before dispatch."
        )
      );
    } else {
      checks.push(
        mk(
          "chk-seal-number",
          "Seal number requirement",
          "Passed",
          "Seal number required before dispatch is set."
        )
      );
    }
  } else {
    checks.push(mk("chk-seal-rule", "Seal rule", "Passed", "No shipper seal requirement indicated."));
    checks.push(
      mk(
        "chk-seal-number",
        "Seal number requirement",
        "Passed",
        "Not applicable — seals not required."
      )
    );
  }

  if (isBlank(compliance.appointment_window_start) || isBlank(compliance.appointment_window_end)) {
    checks.push(
      mk(
        "chk-appt-window",
        "Appointment window",
        "Blocking",
        "Appointment window start and end are required for the load packet."
      )
    );
  } else {
    checks.push(mk("chk-appt-window", "Appointment window", "Passed", "Appointment window captured."));
  }

  if (facility.appointment_required) {
    checks.push(
      mk(
        "chk-fac-appt-flag",
        "Facility appointment flag",
        "Passed",
        "Facility flagged as appointment-controlled — window must be honored at gate."
      )
    );
  } else {
    checks.push(
      mk(
        "chk-fac-appt-flag",
        "Facility appointment flag",
        "Passed",
        "Facility does not mandate appointments; window still recorded for dispatch."
      )
    );
  }

  if (isBlank(insuranceNarrative)) {
    checks.push(
      mk("chk-insurance", "Insurance requirements", "Blocking", "Insurance requirements text is required.")
    );
  } else {
    checks.push(mk("chk-insurance", "Insurance requirements", "Passed", "Insurance requirements documented."));
  }

  if (isBlank(bolNarrative)) {
    checks.push(mk("chk-bol", "BOL instructions", "Blocking", "BOL instructions are required."));
  } else {
    checks.push(mk("chk-bol", "BOL instructions", "Passed", "BOL instructions on file."));
  }

  if (isBlank(podNarrative)) {
    checks.push(mk("chk-pod", "POD requirements", "Blocking", "POD requirements are required."));
  } else {
    checks.push(mk("chk-pod", "POD requirements", "Passed", "POD requirements on file."));
  }

  const photoDocMin = 12;
  const podLen = podNarrative.trim().length;

  if (compliance.pickup_photos_required) {
    if (podLen < photoDocMin) {
      checks.push(
        mk(
          "chk-photo-pickup",
          "Pickup photo requirements",
          "Blocking",
          "Pickup photos required — expand POD requirements to specify count, angles, and timing."
        )
      );
    } else {
      checks.push(
        mk(
          "chk-photo-pickup",
          "Pickup photo requirements",
          "Passed",
          "POD text supports pickup photo criteria."
        )
      );
    }
  } else {
    checks.push(
      mk(
        "chk-photo-pickup",
        "Pickup photo requirements",
        "Passed",
        "Pickup photos not mandated by shipper."
      )
    );
  }

  if (compliance.delivery_photos_required) {
    if (podLen < photoDocMin) {
      checks.push(
        mk(
          "chk-photo-delivery",
          "Delivery photo requirements",
          "Blocking",
          "Delivery photos required — expand POD requirements with delivery photo criteria."
        )
      );
    } else {
      checks.push(
        mk(
          "chk-photo-delivery",
          "Delivery photo requirements",
          "Passed",
          "POD text supports delivery photo criteria."
        )
      );
    }
  } else {
    checks.push(
      mk("chk-photo-delivery", "Delivery photo requirements", "Passed", "Delivery photos not mandated.")
    );
  }

  if (compliance.cargo_photos_required) {
    if (podLen < photoDocMin || isBlank(bolNarrative)) {
      checks.push(
        mk(
          "chk-photo-cargo",
          "Cargo photo requirements",
          "Blocking",
          "Cargo photos required (core documentation) — document cargo imaging in POD and BOL instructions."
        )
      );
    } else {
      checks.push(
        mk(
          "chk-photo-cargo",
          "Cargo photo requirements",
          "Passed",
          "Cargo photo expectations documented in POD / BOL context."
        )
      );
    }
  } else {
    checks.push(
      mk("chk-photo-cargo", "Cargo photo requirements", "Passed", "Cargo photos not mandated.")
    );
  }

  if (isBlank(compliance.accessorial_rules)) {
    checks.push(
      mk(
        "chk-accessorial",
        "Accessorial / lumper rules",
        "Blocking",
        "Accessorial rules text is required (lumpers, detention, seals, special equipment)."
      )
    );
  } else {
    checks.push(mk("chk-accessorial", "Accessorial / lumper rules", "Passed", "Accessorial rules on file."));
  }

  if (compliance.lumper_expected && compliance.accessorial_rules.trim().length < 20) {
    checks.push(
      mk(
        "chk-lumper",
        "Lumper expectations",
        "Warning",
        "Lumper expected — expand accessorial rules with reimbursement and authorization process."
      )
    );
  } else {
    checks.push(
      mk(
        "chk-lumper",
        "Lumper expectations",
        "Passed",
        compliance.lumper_expected
          ? "Lumper noted with sufficient accessorial detail."
          : "No lumper flag — baseline accessorial text acceptable."
      )
    );
  }

  return checks;
}

export function hasBlockingChecks(checks: AutoCheckResult[]) {
  return checks.some((c) => c.status === "Blocking");
}

export function countWarnings(checks: AutoCheckResult[]) {
  return checks.filter((c) => c.status === "Warning").length;
}
