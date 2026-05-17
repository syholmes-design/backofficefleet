import type { LoadV2 } from "@/lib/dispatch-v2-demo-data";

export type PreTripChecklistState = {
  hosVerified: boolean;
  equipmentConditionVerified: boolean;
  trailerNumberConfirmed: boolean;
  ppeConfirmed: boolean;
  loadInstructionsReviewed: boolean;
  sealRequirementsUnderstood: boolean;
  pickupAppointmentConfirmed: boolean;
  trackingActivated: boolean;
};

export type PreDispatchVerificationState = {
  driverConfirmedAvailable: boolean | null;
  driverProvidedCurrentHos: boolean | null;
  driverReportedNoEquipmentIssues: boolean | null;
  driverUnderstandsPickupDeliveryTimes: boolean | null;
  driverHasCorrectTrailer: boolean | null;
  driverAcceptedTrackingLink: boolean | null;
  driverHasRequiredPpe: boolean | null;
  driverConfirmedNoSafetyRestrictions: boolean | null;
};

export type DispatchEvent = {
  dispatcherId: string;
  timestamp: string;
  loadId: string;
  driverId: string;
  checklistState: PreTripChecklistState;
  modalVerification: PreDispatchVerificationState;
  trackingActivated: boolean;
  dispatchSuccess: boolean;
};

export interface DispatchButtonProps {
  load: LoadV2;
  checklistState: PreTripChecklistState;
  onDispatch: (load: LoadV2) => void;
  dispatchInProgress: boolean;
}

export interface PreTripChecklistProps {
  checklistState: PreTripChecklistState;
  onChecklistChange: (state: PreTripChecklistState) => void;
}

export interface PreDispatchModalProps {
  load: LoadV2;
  onClose: () => void;
  onDispatch: (verificationState: PreDispatchVerificationState) => void;
}
