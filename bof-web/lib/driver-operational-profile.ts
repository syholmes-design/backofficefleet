import type { BofData } from "@/lib/load-bof-data";
import { emergencyContactDrivers } from "@/lib/emergency-contacts/drivers";
import { bankInfoByDriverId } from "@/lib/bank-info/bankInfoData";

export type DriverOperationalProfile = {
  driverId: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  dob: string;
  licenseNumber: string;
  licenseClass: string;
  licenseState: string;
  primaryEmergencyName: string;
  primaryEmergencyRelationship: string;
  primaryEmergencyPhone: string;
  primaryEmergencyEmail: string;
  primaryEmergencyAddress: string;
  secondaryEmergencyName: string;
  secondaryEmergencyRelationship: string;
  secondaryEmergencyPhone: string;
  secondaryEmergencyEmail: string;
  secondaryEmergencyAddress: string;
  bankName: string;
  bankAccountType: string;
  bankRoutingNumber: string;
  bankAccountLast4: string;
  paymentPreference: string;
  bankSubmissionDate: string;
  bankStatus: string;
  taxClassification: string;
  tinType: string;
  hasMissingEmergencyPrimary: boolean;
  hasMissingEmergencySecondary: boolean;
  hasMissingBank: boolean;
};

function fallbackEmergencyById(driverId: string) {
  return emergencyContactDrivers.find((d) => d.id === driverId) ?? null;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

type MutableDriver = BofData["drivers"][number] & Record<string, unknown>;

export function getDriverOperationalProfile(
  data: BofData,
  driverId: string
): DriverOperationalProfile | null {
  const driver = data.drivers.find((d) => d.id === driverId) as MutableDriver | undefined;
  if (!driver) return null;
  const emergency = fallbackEmergencyById(driverId);
  const bank = bankInfoByDriverId.get(driverId);

  const primaryName = str(driver.emergencyContactName, emergency?.primaryContact.name ?? "");
  const primaryRelationship = str(
    driver.emergencyContactRelationship,
    emergency?.primaryContact.relationship ?? ""
  );
  const primaryPhone = str(driver.emergencyContactPhone, emergency?.primaryContact.phone ?? "");
  const primaryEmail = str(
    driver.emergencyContactEmail,
    emergency?.primaryContact.email ?? ""
  );
  const primaryAddress = str(
    driver.emergencyContactAddress,
    emergency?.primaryContact.address ?? str(driver.address)
  );

  const secondaryName = str(driver.secondaryContactName, emergency?.secondaryContact.name ?? "");
  const secondaryRelationship = str(
    driver.secondaryContactRelationship,
    emergency?.secondaryContact.relationship ?? ""
  );
  const secondaryPhone = str(
    driver.secondaryContactPhone,
    emergency?.secondaryContact.phone ?? ""
  );
  const secondaryEmail = str(
    driver.secondaryContactEmail,
    emergency?.secondaryContact.email ?? ""
  );
  const secondaryAddress = str(
    driver.secondaryContactAddress,
    emergency?.secondaryContact.address ?? str(driver.address)
  );

  const bankRouting = str(driver.bankRoutingNumber, bank?.routingNumber ?? "");
  const bankLast4 = str(
    driver.bankAccountLast4,
    bank?.accountNumber?.replace(/\D/g, "").slice(-4) ?? ""
  );

  return {
    driverId,
    fullName: str(driver.name),
    phone: str(driver.phone),
    email: str(driver.email),
    address: str(driver.address),
    dob: str(driver.dateOfBirth, emergency?.dob ?? ""),
    licenseNumber: str(
      driver.referenceCdlNumber,
      emergency?.licenseNumber ?? ""
    ),
    licenseClass: str(driver.licenseClass, emergency?.licenseClass ?? "Class A"),
    licenseState: str(driver.licenseState, emergency?.licenseState ?? ""),
    primaryEmergencyName: primaryName,
    primaryEmergencyRelationship: primaryRelationship,
    primaryEmergencyPhone: primaryPhone,
    primaryEmergencyEmail: primaryEmail,
    primaryEmergencyAddress: primaryAddress,
    secondaryEmergencyName: secondaryName,
    secondaryEmergencyRelationship: secondaryRelationship,
    secondaryEmergencyPhone: secondaryPhone,
    secondaryEmergencyEmail: secondaryEmail,
    secondaryEmergencyAddress: secondaryAddress,
    bankName: str(driver.bankName, bank?.bankName ?? ""),
    bankAccountType: str(driver.bankAccountType, bank?.accountType ?? ""),
    bankRoutingNumber: bankRouting,
    bankAccountLast4: bankLast4,
    paymentPreference: str(driver.paymentPreference, bank?.paymentPreference ?? "Direct Deposit"),
    bankSubmissionDate: str(driver.bankSubmissionDate, bank?.submissionDate ?? ""),
    bankStatus: str(driver.bankInfoStatus, bank?.bankInfoStatus ?? ""),
    taxClassification: str(driver.taxClassification, bank?.taxClassification ?? ""),
    tinType: str(driver.tinType, bank?.tinType ?? ""),
    hasMissingEmergencyPrimary: !primaryName || !primaryPhone,
    hasMissingEmergencySecondary: !secondaryName || !secondaryPhone,
    hasMissingBank: !str(driver.bankName, bank?.bankName ?? "") || !bankLast4,
  };
}

export function listDriverOperationalProfiles(data: BofData): DriverOperationalProfile[] {
  return data.drivers
    .map((d) => getDriverOperationalProfile(data, d.id))
    .filter((v): v is DriverOperationalProfile => Boolean(v));
}

export function auditDriverOperationalProfiles(data: BofData) {
  const profiles = listDriverOperationalProfiles(data);
  const missingPrimary = profiles.filter((p) => p.hasMissingEmergencyPrimary).map((p) => p.driverId);
  const missingSecondary = profiles.filter((p) => p.hasMissingEmergencySecondary).map((p) => p.driverId);
  const missingBank = profiles.filter((p) => p.hasMissingBank).map((p) => p.driverId);
  return {
    totalDrivers: data.drivers.length,
    profileCount: profiles.length,
    missingPrimary,
    missingSecondary,
    missingBank,
  };
}

export function applyOperationalSeedDefaults(data: BofData): BofData {
  const copy = structuredClone(data) as BofData;
  copy.drivers = copy.drivers.map((raw) => {
    const d = raw as MutableDriver;
    const profile = getDriverOperationalProfile(copy, d.id);
    if (!profile) return raw;
    return {
      ...d,
      emergencyContactName: d.emergencyContactName ?? profile.primaryEmergencyName,
      emergencyContactRelationship:
        d.emergencyContactRelationship ?? profile.primaryEmergencyRelationship,
      emergencyContactPhone: d.emergencyContactPhone ?? profile.primaryEmergencyPhone,
      emergencyContactEmail: d.emergencyContactEmail ?? profile.primaryEmergencyEmail,
      emergencyContactAddress: d.emergencyContactAddress ?? profile.primaryEmergencyAddress,
      secondaryContactName: d.secondaryContactName ?? profile.secondaryEmergencyName,
      secondaryContactRelationship:
        d.secondaryContactRelationship ?? profile.secondaryEmergencyRelationship,
      secondaryContactPhone: d.secondaryContactPhone ?? profile.secondaryEmergencyPhone,
      secondaryContactEmail: d.secondaryContactEmail ?? profile.secondaryEmergencyEmail,
      secondaryContactAddress: d.secondaryContactAddress ?? profile.secondaryEmergencyAddress,
      bankName: d.bankName ?? profile.bankName,
      bankAccountType: d.bankAccountType ?? profile.bankAccountType,
      bankRoutingNumber: d.bankRoutingNumber ?? profile.bankRoutingNumber,
      bankAccountLast4: d.bankAccountLast4 ?? profile.bankAccountLast4,
      paymentPreference: d.paymentPreference ?? profile.paymentPreference,
      bankSubmissionDate: d.bankSubmissionDate ?? profile.bankSubmissionDate,
      bankInfoStatus: d.bankInfoStatus ?? profile.bankStatus,
      taxClassification: d.taxClassification ?? profile.taxClassification,
      tinType: d.tinType ?? profile.tinType,
      dateOfBirth: d.dateOfBirth ?? profile.dob,
      licenseClass: d.licenseClass ?? profile.licenseClass,
      licenseState: d.licenseState ?? profile.licenseState,
    } as BofData["drivers"][number];
  });
  return copy;
}
