/**
 * Intake to Template Mapping Layer
 * 
 * Provides explicit field mapping between intake data and downstream document generation.
 * Ensures intake data flows correctly to dispatch, driver, and manager documents.
 */

import type { IntakeRecord, ExtractedFields } from "./intake-engine-types";
import type { IntakeWizardState } from "./load-requirements-intake-types";
import type { BofTemplateDefinition } from "./bof-template-system";

export type TemplateFieldMapping = {
  templateId: string;
  templateName: string;
  sourceField: string;
  targetField: string;
  mappingType: "direct" | "formatted" | "conditional" | "computed";
  transform?: (value: string | number | boolean | undefined) => string;
  condition?: (value: string | number | boolean | undefined) => boolean;
};

export type IntakeToTemplateContext = {
  intakeId: string;
  extractedFields: ExtractedFields;
  wizardState?: IntakeWizardState;
  mappingReport: MappingReport;
};

export type MappingReport = {
  totalFields: number;
  mappedFields: number;
  unmappedFields: string[];
  mappingErrors: string[];
  downstreamDocuments: string[];
};

/**
 * Critical intake fields that must map to downstream documents
 */
export const CRITICAL_INTAKE_FIELDS = [
  "customer_or_broker",
  "pickup_facility",
  "pickup_address",
  "pickup_city",
  "pickup_state",
  "delivery_facility",
  "delivery_address",
  "delivery_city",
  "delivery_state",
  "pickup_date",
  "delivery_date",
  "rate_linehaul",
  "equipment",
  "commodity",
  "weight",
  "special_handling",
  "insurance_requirements",
  "bol_requirements",
  "pod_requirements",
] as const;

/**
 * Template field mappings for different document types
 */
export const TEMPLATE_FIELD_MAPPINGS: TemplateFieldMapping[] = [
  // Rate Confirmation Template
  {
    templateId: "rate-confirmation",
    templateName: "Rate Confirmation",
    sourceField: "customer_or_broker",
    targetField: "customer_name",
    mappingType: "direct",
  },
  {
    templateId: "rate-confirmation",
    templateName: "Rate Confirmation",
    sourceField: "pickup_facility",
    targetField: "origin_facility",
    mappingType: "direct",
  },
  {
    templateId: "rate-confirmation",
    templateName: "Rate Confirmation",
    sourceField: "delivery_facility",
    targetField: "destination_facility",
    mappingType: "direct",
  },
  {
    templateId: "rate-confirmation",
    templateName: "Rate Confirmation",
    sourceField: "rate_linehaul",
    targetField: "linehaul_rate",
    mappingType: "direct",
  },
  {
    templateId: "rate-confirmation",
    templateName: "Rate Confirmation",
    sourceField: "pickup_date",
    targetField: "pickup_datetime",
    mappingType: "formatted",
    transform: (value: string | number | boolean | undefined) => value ? new Date(String(value)).toISOString() : "",
  },
  {
    templateId: "rate-confirmation",
    templateName: "Rate Confirmation",
    sourceField: "delivery_date",
    targetField: "delivery_datetime",
    mappingType: "formatted",
    transform: (value: string | number | boolean | undefined) => value ? new Date(String(value)).toISOString() : "",
  },

  // Bill of Lading Template
  {
    templateId: "bill-of-lading",
    templateName: "Bill of Lading",
    sourceField: "customer_or_broker",
    targetField: "shipper_name",
    mappingType: "direct",
  },
  {
    templateId: "bill-of-lading",
    templateName: "Bill of Lading",
    sourceField: "pickup_facility",
    targetField: "pickup_location",
    mappingType: "direct",
  },
  {
    templateId: "bill-of-lading",
    templateName: "Bill of Lading",
    sourceField: "delivery_facility",
    targetField: "delivery_location",
    mappingType: "direct",
  },
  {
    templateId: "bill-of-lading",
    templateName: "Bill of Lading",
    sourceField: "doc_type_label",
    targetField: "commodity_description",
    mappingType: "direct",
  },
  {
    templateId: "bill-of-lading",
    templateName: "Bill of Lading",
    sourceField: "weight",
    targetField: "total_weight",
    mappingType: "direct",
  },
  {
    templateId: "bill-of-lading",
    templateName: "Bill of Lading",
    sourceField: "notes",
    targetField: "special_instructions",
    mappingType: "direct",
  },

  // Driver Instructions Template
  {
    templateId: "driver-instructions",
    templateName: "Driver Instructions",
    sourceField: "pickup_facility",
    targetField: "pickup_facility_name",
    mappingType: "direct",
  },
  {
    templateId: "driver-instructions",
    templateName: "Driver Instructions",
    sourceField: "pickup_address",
    targetField: "pickup_address_full",
    mappingType: "direct",
  },
  {
    templateId: "driver-instructions",
    templateName: "Driver Instructions",
    sourceField: "delivery_facility",
    targetField: "delivery_facility_name",
    mappingType: "direct",
  },
  {
    templateId: "driver-instructions",
    templateName: "Driver Instructions",
    sourceField: "delivery_address",
    targetField: "delivery_address_full",
    mappingType: "direct",
  },
  {
    templateId: "driver-instructions",
    templateName: "Driver Instructions",
    sourceField: "appointment_required",
    targetField: "appointment_needed",
    mappingType: "conditional",
    condition: (value) => value === true,
    transform: (value) => value ? "Yes" : "No",
  },

  // Dispatch Packet Template
  {
    templateId: "dispatch-packet",
    templateName: "Dispatch Packet",
    sourceField: "customer_or_broker",
    targetField: "customer_name",
    mappingType: "direct",
  },
  {
    templateId: "dispatch-packet",
    templateName: "Dispatch Packet",
    sourceField: "equipment",
    targetField: "equipment_type",
    mappingType: "direct",
  },
  {
    templateId: "dispatch-packet",
    templateName: "Dispatch Packet",
    sourceField: "insurance_requirements",
    targetField: "insurance_requirements",
    mappingType: "direct",
  },
  {
    templateId: "dispatch-packet",
    templateName: "Dispatch Packet",
    sourceField: "bol_requirements",
    targetField: "bol_instructions",
    mappingType: "direct",
  },
  {
    templateId: "dispatch-packet",
    templateName: "Dispatch Packet",
    sourceField: "pod_requirements",
    targetField: "pod_instructions",
    mappingType: "direct",
  },

  // Manager Summary Template
  {
    templateId: "manager-summary",
    templateName: "Manager Summary",
    sourceField: "customer_or_broker",
    targetField: "customer_name",
    mappingType: "direct",
  },
  {
    templateId: "manager-summary",
    templateName: "Manager Summary",
    sourceField: "rate_linehaul",
    targetField: "revenue_amount",
    mappingType: "formatted",
    transform: (value: string | number | boolean | undefined) => typeof value === 'number' ? `$${value.toFixed(2)}` : `$${Number(value || 0).toFixed(2)}`,
  },
  {
    templateId: "manager-summary",
    templateName: "Manager Summary",
    sourceField: "notes",
    targetField: "risk_factors",
    mappingType: "conditional",
    condition: (value) => Boolean(value && typeof value === 'string' && value.length > 0),
  },
];

/**
 * Build intake-to-template context from intake record
 */
export function buildIntakeToTemplateContext(
  intakeId: string,
  intake: IntakeRecord,
  wizardState?: IntakeWizardState
): IntakeToTemplateContext {
  const report = generateMappingReport(intake.extracted);
  
  return {
    intakeId,
    extractedFields: intake.extracted,
    wizardState,
    mappingReport: report,
  };
}

/**
 * Build intake-to-template context from wizard state
 */
export function buildIntakeToTemplateContextFromWizard(
  intakeId: string,
  wizardState: IntakeWizardState
): IntakeToTemplateContext {
  const extractedFields = mapWizardStateToExtractedFields(wizardState);
  const report = generateMappingReport(extractedFields);
  
  return {
    intakeId,
    extractedFields,
    wizardState,
    mappingReport: report,
  };
}

/**
 * Map wizard state to extracted fields format
 */
export function mapWizardStateToExtractedFields(wizardState: IntakeWizardState): ExtractedFields {
  return {
    customer_or_broker: wizardState.shipper.shipper_name,
    pickup_facility: wizardState.facility.facility_name,
    pickup_address: wizardState.facility.address,
    pickup_city: wizardState.facility.city,
    pickup_state: wizardState.facility.state,
    delivery_facility: wizardState.loadRequirement.destination_facility_name,
    delivery_address: wizardState.loadRequirement.destination_address,
    delivery_city: wizardState.loadRequirement.destination_city,
    delivery_state: wizardState.loadRequirement.destination_state,
    equipment: wizardState.loadRequirement.equipment_type,
    rate_linehaul: 0, // Would be calculated from pricing data
    notes: wizardState.loadRequirement.special_handling,
    // Add other fields as needed
  };
}

/**
 * Generate mapping report for validation/debug
 */
export function generateMappingReport(extractedFields: ExtractedFields): MappingReport {
  const totalFields = CRITICAL_INTAKE_FIELDS.length;
  const mappedFields = CRITICAL_INTAKE_FIELDS.filter(field => 
    extractedFields[field as keyof ExtractedFields] !== undefined && 
    extractedFields[field as keyof ExtractedFields] !== null &&
    extractedFields[field as keyof ExtractedFields] !== ""
  ).length;
  
  const unmappedFields = CRITICAL_INTAKE_FIELDS.filter(field => 
    !extractedFields[field as keyof ExtractedFields] || 
    extractedFields[field as keyof ExtractedFields] === "" ||
    extractedFields[field as keyof ExtractedFields] === null
  );
  
  const mappingErrors: string[] = [];
  const downstreamDocuments = [
    "rate-confirmation",
    "bill-of-lading", 
    "driver-instructions",
    "dispatch-packet",
    "manager-summary"
  ];
  
  // Check for critical missing fields
  if (!extractedFields.customer_or_broker) {
    mappingErrors.push("Missing customer/shipper name - required for all documents");
  }
  if (!extractedFields.pickup_facility) {
    mappingErrors.push("Missing pickup facility - required for dispatch and driver docs");
  }
  if (!extractedFields.delivery_facility) {
    mappingErrors.push("Missing delivery facility - required for dispatch and driver docs");
  }
  
  return {
    totalFields,
    mappedFields,
    unmappedFields,
    mappingErrors,
    downstreamDocuments,
  };
}

/**
 * Get template field values from intake context
 */
export function getTemplateFieldValues(
  templateId: string,
  context: IntakeToTemplateContext
): Record<string, string> {
  const mappings = TEMPLATE_FIELD_MAPPINGS.filter(m => m.templateId === templateId);
  const fieldValues: Record<string, string> = {};
  
  mappings.forEach(mapping => {
    const sourceValue = context.extractedFields[mapping.sourceField as keyof ExtractedFields];
    
    if (sourceValue !== undefined && sourceValue !== null && sourceValue !== "") {
      // Apply condition if present
      if (mapping.condition && !mapping.condition(sourceValue)) {
        return;
      }
      
      // Apply transformation if present
      let finalValue = sourceValue;
      if (mapping.transform) {
        try {
          finalValue = mapping.transform(sourceValue);
        } catch (error) {
          console.error(`Error transforming field ${mapping.sourceField}:`, error);
          return;
        }
      }
      
      fieldValues[mapping.targetField] = String(finalValue);
    }
  });
  
  return fieldValues;
}

/**
 * Validate intake data completeness for template generation
 */
export function validateIntakeForTemplateGeneration(
  templateId: string,
  context: IntakeToTemplateContext
): { isValid: boolean; missingFields: string[]; warnings: string[] } {
  const mappings = TEMPLATE_FIELD_MAPPINGS.filter(m => m.templateId === templateId);
  const missingFields: string[] = [];
  const warnings: string[] = [];
  
  mappings.forEach(mapping => {
    const sourceValue = context.extractedFields[mapping.sourceField as keyof ExtractedFields];
    
    if (!sourceValue || sourceValue === "") {
      missingFields.push(mapping.sourceField);
    }
  });
  
  // Add warnings for important but not critical fields
  if (!context.extractedFields.notes) {
    warnings.push("No special handling instructions - may affect driver instructions");
  }
  
  if (!context.extractedFields.rate_linehaul || context.extractedFields.rate_linehaul === 0) {
    warnings.push("No rate information - may affect dispatch decisions");
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
    warnings,
  };
}

/**
 * Generate debug report for intake-to-template mapping
 */
export function generateDebugReport(context: IntakeToTemplateContext): string {
  const { mappingReport } = context;
  
  return `
=== Intake to Template Mapping Debug Report ===
Intake ID: ${context.intakeId}
Mapping Coverage: ${mappingReport.mappedFields}/${mappingReport.totalFields} fields
Unmapped Fields: ${mappingReport.unmappedFields.join(", ")}
Mapping Errors: ${mappingReport.mappingErrors.join(", ")}
Downstream Documents: ${mappingReport.downstreamDocuments.join(", ")}

Extracted Fields:
${Object.entries(context.extractedFields)
  .filter(([_, value]) => value !== undefined && value !== null && value !== "")
  .map(([key, value]) => `  ${key}: ${value}`)
  .join("\n")}
========================================
  `.trim();
}
