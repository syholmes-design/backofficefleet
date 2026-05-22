export type SafetyTrainingResource = {
  label: string;
  href: string;
  source: string;
  type: "Official guidance" | "Training resource" | "Third-party video" | "Internal demo action";
  external: boolean;
};

export const SAFETY_TRAINING_RESOURCES = {
  vehicleInspection: [
    {
      label: "CVSA vehicle inspection training resources",
      href: "https://learning.cvsa.org/vehicleinspections",
      source: "CVSA",
      type: "Training resource" as const,
      external: true
    },
    {
      label: "CVSA inspections resources",
      href: "https://cvsa.org/inspections/resources/",
      source: "CVSA",
      type: "Official guidance" as const,
      external: true
    }
  ],
  cargoSecurement: [
    {
      label: "FMCSA cargo securement rules",
      href: "https://www.fmcsa.dot.gov/regulations/cargo-securement/cargo-securement-rules",
      source: "FMCSA",
      type: "Official guidance" as const,
      external: true
    }
  ],
  hosLogbook: [
    {
      label: "FMCSA hours-of-service resources",
      href: "https://www.fmcsa.dot.gov/regulations/hours-service",
      source: "FMCSA",
      type: "Official guidance" as const,
      external: true
    }
  ]
} as const;

export type SafetyTrainingCategory = keyof typeof SAFETY_TRAINING_RESOURCES;

/**
 * Maps incident titles/labels to training categories
 */
export function mapIncidentToTrainingCategory(incidentLabel: string): SafetyTrainingCategory | null {
  const label = incidentLabel.toLowerCase();
  
  // Vehicle inspection related
  if (label.includes('tire') || label.includes('tread') || label.includes('brake') || 
      label.includes('inspection') || label.includes('equipment') || label.includes('fire') ||
      label.includes('extinguisher') || label.includes('safety equipment')) {
    return 'vehicleInspection';
  }
  
  // Cargo securement related
  if (label.includes('cargo') || label.includes('pallet') || label.includes('box') || 
      label.includes('securement') || label.includes('damage') || label.includes('punctured') ||
      label.includes('wrapped')) {
    return 'cargoSecurement';
  }
  
  // HOS/logbook related
  if (label.includes('hos') || label.includes('logbook') || label.includes('eld') || 
      label.includes('hours') || label.includes('on-duty') || label.includes('service')) {
    return 'hosLogbook';
  }
  
  return null;
}

/**
 * Gets training resources for an incident based on its label
 */
export function getTrainingResourcesForIncident(incidentLabel: string): SafetyTrainingResource[] {
  const category = mapIncidentToTrainingCategory(incidentLabel);
  if (!category) {
    return [];
  }
  return [...SAFETY_TRAINING_RESOURCES[category]];
}

/**
 * Gets a coaching action link for incidents without specific training
 */
export function getCoachingActionLink(): SafetyTrainingResource {
  return {
    label: "Prepare coaching note",
    href: "/safety#at-risk-drivers",
    source: "BOF",
    type: "Internal demo action",
    external: false
  };
}
