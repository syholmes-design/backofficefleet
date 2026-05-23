import { getBofData } from '@/lib/load-bof-data';
import { getDriverPortalProfile } from '@/lib/demo-portals';
import { 
  getDriverPaySettlementMethod,
  getSettlementTermsLabel,
  getSettlementMethodBadge
} from '@/lib/driver-pay-settlement-methods';
import { getDriverDocumentStatus, DriverDocumentStatus } from '@/lib/driver-document-status';
import { getAcknowledgmentSummary } from '@/lib/driver-acknowledgment-status';
import { getDriverLoadContext, getLoadProofItems } from '@/lib/driver-load-context';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{
    driverId: string;
  }>;
}

const DRIVER_ROUTE_ALERTS: Record<string, {
  loadId: string;
  title: string;
  status: string;
  reason: string;
  exitInstruction: string;
  rejoinInstruction: string;
  etaImpact: string;
  hosNote: string;
  dispatcher: string;
  updatedAt: string;
}> = {
  "DRV-010": {
    loadId: "L010",
    title: "I-40 weather and traffic reroute",
    status: "Driver action requested",
    reason: "Storm cell and stopped traffic reported west of Jackson, TN. Control Tower is moving Noah around the backup before the HOS window tightens.",
    exitInstruction: "Exit I-40 W at Exit 82A for US-45 Bypass / Jackson.",
    rejoinInstruction: "Follow the BOF-approved US-45 Bypass to US-412 W corridor, then re-enter I-40 W at Exit 56 near Brownsville.",
    etaImpact: "+18 minutes vs. staying in traffic; protects the Memphis delivery window by an estimated 52 minutes.",
    hosNote: "HOS check remains green with 1 hr 42 min projected drive buffer after the reroute.",
    dispatcher: "Nina Harris",
    updatedAt: "May 20, 2026, 2:18 PM CT",
  },
};

export async function generateStaticParams(): Promise<{ driverId: string }[]> {
  const data = getBofData();
  return data.drivers.map(driver => ({
    driverId: driver.id
  }));
}

// Component for displaying individual document status
function DocumentRow({ document }: { document: DriverDocumentStatus }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'text-emerald-700 bg-emerald-50';
      case 'expiring_soon': return 'text-amber-700 bg-amber-50';
      case 'expired': return 'text-red-700 bg-red-50';
      case 'available': return 'text-blue-700 bg-blue-50';
      case 'pending_signature': return 'text-amber-700 bg-amber-50';
      case 'pending_review': return 'text-amber-700 bg-amber-50';
      case 'missing': return 'text-red-700 bg-red-50';
      case 'not_required': return 'text-slate-500 bg-slate-50';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'valid': return 'Valid';
      case 'expiring_soon': return 'Expiring Soon';
      case 'expired': return 'Expired';
      case 'available': return 'Available';
      case 'pending_signature': return 'Pending Signature';
      case 'pending_review': return 'Pending Review';
      case 'missing': return 'Missing';
      case 'not_required': return 'Not Required';
      default: return 'Unknown';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
      <div className="flex-1">
        <div className="font-medium text-slate-900">{document.type}</div>
        <div className="text-sm text-slate-600">
          Status: <span className={`font-medium ${getStatusColor(document.status)}`}>
            {getStatusText(document.status)}
          </span>
          {document.expirationDate && (
            <span className="ml-2 text-slate-500">
              (Expires: {document.expirationDate})
            </span>
          )}
        </div>
        {document.reason && (
          <div className="text-xs text-slate-500 mt-1">{document.reason}</div>
        )}
        {document.actionNeeded && (
          <div className="text-xs text-amber-600 mt-1">Action: {document.actionNeeded}</div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {document.canOpen && document.fileUrl ? (
          <Link
            href={document.fileUrl}
            target="_blank"
            className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open
          </Link>
        ) : (
          <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-slate-500 bg-slate-100 rounded">
            {document.canOpen ? 'Processing' : 'Not Available'}
          </span>
        )}
      </div>
    </div>
  );
}

// Component for load context section
function LoadContextSection({ driverId }: { driverId: string }) {
  const loadContext = getDriverLoadContext(driverId);

  if (!loadContext.hasActiveLoad && loadContext.recentLoads.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No current or recent assignments
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Active Load */}
      {loadContext.activeLoad && (
        <div className="bg-blue-50 rounded border border-blue-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-blue-900">
              Active Load: {loadContext.activeLoad.loadId}
            </div>
            <Link
              href={loadContext.activeLoad.dispatchLink}
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Load
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Route:</span>
              <div className="font-medium">{loadContext.activeLoad.route}</div>
            </div>
            <div>
              <span className="text-gray-600">Customer:</span>
              <div className="font-medium">{loadContext.activeLoad.customer}</div>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <div className="font-medium text-blue-600">{loadContext.activeLoad.status}</div>
            </div>
            <div>
              <span className="text-gray-600">Equipment:</span>
              <div className="font-medium">{loadContext.activeLoad.equipment}</div>
            </div>
            {loadContext.activeLoad.pickupDate && (
              <div>
                <span className="text-gray-600">Pickup:</span>
                <div className="font-medium">{loadContext.activeLoad.pickupDate}</div>
              </div>
            )}
            {loadContext.activeLoad.deliveryDate && (
              <div>
                <span className="text-gray-600">Delivery:</span>
                <div className="font-medium">{loadContext.activeLoad.deliveryDate}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Loads */}
      {loadContext.recentLoads.length > 0 && (
        <div>
          <h3 className="text-md font-semibold text-slate-800 mb-3">Recent Loads</h3>
          <div className="space-y-2">
            {loadContext.recentLoads.map((load) => (
              <div key={load.loadId} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{load.loadId}</div>
                  <div className="text-sm text-slate-600">{load.route}</div>
                  <div className="text-xs text-slate-500">
                    {load.pickupDate && `Pickup: ${load.pickupDate}`}
                    {load.deliveryDate && ` • Delivery: ${load.deliveryDate}`}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                    load.status === 'Delivered' ? 'bg-green-100 text-green-800' : 
                    load.status === 'Active' ? 'bg-blue-100 text-blue-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {load.status}
                  </span>
                  <Link
                    href={load.dispatchLink}
                    className="inline-flex items-center px-3 py-1 text-sm font-medium text-teal-700 bg-teal-50 rounded hover:bg-teal-100 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Component for load proof section
function LoadProofSection({ driverId }: { driverId: string }) {
  const loadContext = getDriverLoadContext(driverId);
  
  if (!loadContext.hasActiveLoad) {
    return (
      <div className="text-center text-slate-500 py-8">
        No active load proof packet is assigned to this driver.
      </div>
    );
  }

  const activeLoad = loadContext.activeLoad!;
  const proofItems = getLoadProofItems(activeLoad.loadId);

  return (
    <div className="space-y-2">
      {proofItems.map((item) => (
        <div key={item.type} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
          <div className="flex items-center">
            <input 
              type="checkbox" 
              className="mr-3" 
              readOnly 
              checked={item.status === 'available'} 
            />
            <div>
              <div className="font-medium text-slate-900">{item.type}</div>
              <div className="text-sm text-slate-600">
                {item.status === 'available' ? 'Available' : 
                 item.status === 'required_missing' ? 'Required - Missing' : 
                 item.status === 'not_required' ? 'Not Required' :
                 item.status === 'required_if_applicable' ? 'Required if Applicable' :
                 'Unknown'}
              </div>
              <div className="text-xs text-slate-500 mt-1">{item.reason}</div>
            </div>
          </div>
          {item.canOpen && item.fileUrl ? (
            <Link
              href={item.fileUrl}
              target="_blank"
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-teal-700 bg-teal-50 rounded hover:bg-teal-100 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View
            </Link>
          ) : (
            <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-slate-500 bg-slate-100 rounded">
              {item.status === 'required_missing' ? 'Missing' : 'Not Available'}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function RouteInstructionCard({ driverId }: { driverId: string }) {
  const alert = DRIVER_ROUTE_ALERTS[driverId];

  if (!alert) {
    return null;
  }

  return (
    <section className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-2 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
            {alert.status}
          </div>
          <h2 className="text-xl font-bold text-slate-950">{alert.title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">{alert.reason}</p>
        </div>
        <div className="rounded-md border border-amber-200 bg-white px-4 py-3 text-sm text-slate-700">
          <div className="font-semibold text-slate-950">Dispatch owner</div>
          <div>{alert.dispatcher}</div>
          <div className="mt-2 text-xs text-slate-500">Updated {alert.updatedAt}</div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-amber-200 bg-white p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-amber-700">Exit instruction</div>
          <p className="mt-2 text-base font-semibold text-slate-950">{alert.exitInstruction}</p>
        </div>
        <div className="rounded-md border border-emerald-200 bg-white p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">Pick I-40 back up</div>
          <p className="mt-2 text-base font-semibold text-slate-950">{alert.rejoinInstruction}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-md bg-slate-950 p-4 text-white">
          <div className="text-xs font-bold uppercase tracking-wide text-cyan-200">ETA impact</div>
          <p className="mt-2 text-sm leading-6">{alert.etaImpact}</p>
        </div>
        <div className="rounded-md bg-slate-950 p-4 text-white">
          <div className="text-xs font-bold uppercase tracking-wide text-emerald-200">HOS check</div>
          <p className="mt-2 text-sm leading-6">{alert.hosNote}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={`/loads/${alert.loadId}`}
          className="inline-flex items-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
        >
          Open load detail
        </Link>
        <Link
          href="/dispatch"
          className="inline-flex items-center rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
        >
          View dispatch route
        </Link>
        <Link
          href="/safety"
          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
        >
          Check HOS impact
        </Link>
      </div>
    </section>
  );
}

// Component for acknowledgment section
function AcknowledgmentSection({ driverId }: { driverId: string }) {
  const acknowledgmentSummary = getAcknowledgmentSummary(driverId);

  return (
    <div className="space-y-2">
      {acknowledgmentSummary.details.map((ack) => (
        <div key={ack.type} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
          <div className="flex items-center">
            <input 
              type="checkbox" 
              className="mr-3" 
              readOnly 
              checked={ack.status === 'acknowledged'} 
            />
            <div>
              <div className="font-medium text-slate-900">{ack.type}</div>
              <div className="text-sm text-slate-600">
                Status: <span className={`font-medium ${
                  ack.status === 'acknowledged' ? 'text-emerald-700' : 
                  ack.status === 'pending_signature' ? 'text-amber-700' : 
                  ack.status === 'pending_review' ? 'text-amber-700' :
                  ack.status === 'missing_file' ? 'text-red-700' :
                  ack.status === 'not_required' ? 'text-slate-500' : 'text-red-700'
                }`}>
                  {ack.status === 'acknowledged' ? 'Acknowledged' :
                   ack.status === 'pending_signature' ? 'Pending Signature' :
                   ack.status === 'pending_review' ? 'Pending Review' :
                   ack.status === 'missing_file' ? 'Missing File' :
                   ack.status === 'not_required' ? 'Not Required' : 'Missing'}
                </span>
              </div>
              {ack.reason && (
                <div className="text-xs text-slate-500 mt-1">{ack.reason}</div>
              )}
              {ack.actionNeeded && (
                <div className="text-xs text-amber-600 mt-1">Action: {ack.actionNeeded}</div>
              )}
              {ack.signedDate && (
                <div className="text-xs text-slate-500 mt-1">Signed: {ack.signedDate}</div>
              )}
            </div>
          </div>
          {ack.canOpen && ack.filePath ? (
            <Link
              href={ack.filePath}
              target="_blank"
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-teal-700 bg-teal-50 rounded hover:bg-teal-100 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View
            </Link>
          ) : (
            <span className="inline-flex items-center px-3 py-1 text-sm font-medium text-slate-500 bg-slate-100 rounded">
              {ack.canOpen ? 'Processing' : 'Not Available'}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default async function DriverPortalDetailPage({ params }: PageProps) {
  const { driverId } = await params;
  const data = getBofData();
  const driverProfile = getDriverPortalProfile(driverId);
  
  if (!driverProfile) {
    notFound();
  }

  const driverLoads = data.loads.filter(load => load.driverId === driverId);
  const driverSettlements = data.settlements.filter(settlement => settlement.driverId === driverId);
  const currentLoad = driverLoads.find(load => load.status !== 'Delivered');
  
  // Get driver pay/settlement method
  const driverPayMethod = getDriverPaySettlementMethod(driverId, data);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                    {driverProfile.name}
              </h1>
              <div className="text-sm text-gray-500">
                    {driverProfile.driverId} • {driverProfile.workerType}
              </div>
              {driverPayMethod.workerType === 'Independent Contractor / Owner-Operator' && (
                <div className="mt-2">
                  <div className="text-sm text-gray-600">Settlement Method:</div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                    getSettlementMethodBadge(driverId, data).color === 'purple' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {getSettlementTermsLabel(driverId, data)}
                  </div>
                </div>
              )}
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                driverProfile.readinessStatus === 'Ready' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                    {driverProfile.readinessStatus}
              </span>
            </div>
          </div>
          {currentLoad && (
            <div className="bg-blue-50 rounded border border-blue-200 p-4">
              <div className="text-sm font-medium text-blue-900 mb-1">
                    Current Assignment
              </div>
              <div className="text-sm text-blue-700">
                    Load {currentLoad.id} - {currentLoad.status}
              </div>
            </div>
          )}
        </div>

        <RouteInstructionCard driverId={driverId} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          {/* My Documents */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 00-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01-.707-.293H9z" />
              </svg>
              My Documents
            </h2>
            
            {getDriverDocumentStatus(driverId).map((group) => (
              <div key={group.title} className="mb-6">
                <h3 className="text-md font-semibold text-slate-800 mb-3 flex items-center">
                  {group.title === 'Driver Qualification' && (
                    <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {group.title === 'Contact / Profile' && (
                    <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                  {(group.title === 'Employment / Payroll' || group.title === 'Owner-Operator Documents') && (
                    <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.documents.map((doc) => (
                    <DocumentRow key={doc.type} document={doc} />
                  ))}
                </div>
              </div>
            ))}



          </div>

          {/* My Current Load / Assignments */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2v2a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2z" />
              </svg>
              Current & Recent Loads
            </h2>
            
            <LoadContextSection driverId={driverId} />
          </div>

          {/* Proof Upload Checklist */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Load Proof & Documents
            </h2>
            
            <LoadProofSection driverId={driverId} />
          </div>

          {/* My Settlements */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2zm-3 6h-6m0 0v6m0 0a3 3 0 00-3 3h6a3 3 0 003-3z" />
              </svg>
              My Settlements
            </h2>
            
            <div className="space-y-3">
              {driverSettlements.slice(0, 3).map((settlement) => (
                <div key={settlement.settlementId} className="p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                          <div>
                                <div className="font-medium text-gray-900">{settlement.settlementId}</div>
                                <div className="text-sm text-gray-600">Period: {settlement.settlementId}</div>
                          </div>
                          <div className="text-right">
                                <div className="text-lg font-bold text-gray-900">${settlement.grossPay?.toLocaleString()}</div>
                                <div className="text-sm text-gray-600">Gross</div>
                          </div>
                    </div>
                    
                    {driverId === 'DRV-002' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
                                <div className="text-sm font-medium text-yellow-800">
                                      Family Support Withholding Active
                                </div>
                      </div>
                    )}
                    
                    <div className="text-sm text-gray-600">
                          Deductions: ${settlement.totalDeductions?.toLocaleString()} | 
                          Reimbursements: ${settlement.fuelReimbursement?.toLocaleString()}
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                          <span className="text-sm text-gray-600">Net Amount:</span>
                          <span className="text-lg font-bold text-green-600">${settlement.netPay?.toLocaleString()}</span>
                    </div>
                </div>
              ))}
            </div>
          </div>

          {/* Policy Acknowledgments */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 00-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01-.707-.293H9z" />
              </svg>
              Policy Acknowledgments
            </h2>
            
            <AcknowledgmentSection driverId={driverId} />
          </div>

          {/* Owner-Operator Packet - Only for owner-operators */}
          {driverProfile.workerType === 'Independent Contractor / Owner-Operator' && (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0M12 14a7 7 0 00-7 7h4a7 7 0 007-7h-4z" />
                    </svg>
                    Owner-Operator Document Packet
              </h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                    <p className="text-sm text-blue-800 font-medium">
                          Employee-only forms are not required for this worker type. Safety and driver qualification controls still apply.
                    </p>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                    {[
                      { name: 'Independent Contractor Agreement', path: 'independent-contractor-agreement' },
                      { name: 'Owner-Operator Lease Agreement', path: 'owner-operator-lease-agreement' },
                      { name: 'Certificate of Insurance Verification', path: 'certificate-of-insurance-verification' },
                      { name: 'Occupational Accident Coverage Acknowledgment', path: 'occupational-accident-coverage-acknowledgment' },
                      { name: 'Equipment Schedule', path: 'equipment-schedule' },
                      { name: 'Maintenance Responsibility Acknowledgment', path: 'maintenance-responsibility-acknowledgment' },
                      { name: 'Fuel/Toll/Advance/Chargeback Policy Acknowledgment', path: 'fuel-toll-advance-chargeback-policy-acknowledgment' },
                      { name: 'Settlement/Payment Authorization', path: 'settlement-payment-authorization' },
                      { name: 'Safety and Compliance Acknowledgment', path: 'safety-and-compliance-acknowledgment' },
                      { name: 'Worker Classification Review Summary', path: 'worker-classification-review-summary' }
                    ].map((doc) => (
                      <Link
                        key={doc.name}
                        href={`/generated/drivers/${driverId}/owner-operator/${doc.path}.html`}
                        target="_blank"
                        className="flex items-center p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                            <svg className="w-4 h-4 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 00-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01-.707-.293H9z" />
                            </svg>
                            <div className="flex-1">
                                  <div className="font-medium text-slate-900">{doc.name}</div>
                                  <div className="text-sm text-slate-600">View document</div>
                            </div>
                      </Link>
                    ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="text-center">
          <Link
            href="/portals/driver"
            className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7 7" />
            </svg>
            Back to Driver Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
