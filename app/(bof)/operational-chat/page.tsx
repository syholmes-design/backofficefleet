import { auth } from "@/auth";
import { OperationalChatClient } from "@/components/operational-chat/OperationalChatClient";
import { getAuthorizedOperatingRecord, type OperatingRecordType } from "@/lib/services/operatingRecordService";

export const metadata = {
  title: "Conversations | BOF",
  description: "Tenant-scoped operational conversations connected to the BOF operating record.",
};

export default async function OperationalChatPage({ searchParams }: { searchParams: Promise<{ fleetId?: string; recordType?: string; recordId?: string }> }) {
  const session = await auth();
  const initialFleetId = session?.user?.memberships?.[0]?.fleetId ?? "";
  const params = await searchParams;
  let recordContext: { fleetId: string; recordType: OperatingRecordType; recordId: string } | undefined;
  if (params.fleetId && params.recordType && params.recordId) {
    try {
      const record = await getAuthorizedOperatingRecord(session?.user, params.fleetId, params.recordType as OperatingRecordType, params.recordId);
      recordContext = { fleetId: record.tenantId, recordType: record.recordType, recordId: record.recordId };
    } catch {
      recordContext = undefined;
    }
  }
  return <OperationalChatClient initialFleetId={recordContext?.fleetId ?? initialFleetId} initialRecordType={recordContext?.recordType} initialRecordId={recordContext?.recordId} />;
}
