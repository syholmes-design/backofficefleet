import { DriverVaultWorkspaceClient } from "@/components/documents/DriverVaultWorkspaceClient";

export const metadata = {
  title: "Driver Vault Workspace | BOF",
  description:
    "BOF Vault native driver-document workspace for upload, autofill templates, review, and generated output preview.",
};

export default function DriverVaultWorkspacePage() {
  return <DriverVaultWorkspaceClient />;
}
