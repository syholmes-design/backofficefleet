import { getBofData } from '@/lib/load-bof-data';
import { getDriverPortalProfile } from '@/lib/demo-portals';
import { 
  getDriverPaySettlementMethod,
  getSettlementTermsLabel,
  getSettlementMethodBadge
} from '@/lib/driver-pay-settlement-methods';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{
    driverId: string;
  }>;
}

export async function generateStaticParams(): Promise<{ driverId: string }[]> {
  const data = getBofData();
  return data.drivers.map(driver => ({
    driverId: driver.id
  }));
}

export default async function DriverPortalDetailPage({ params }: PageProps) {
  const { driverId } = await params;
  const data = getBofData();
  const driverProfile = getDriverPortalProfile(driverId);
  
  if (!driverProfile) {
    notFound();
  }

  const driverDocuments = data.documents.filter(doc => doc.driverId === driverId);
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
            
            <div className="space-y-3">
              {driverDocuments.slice(0, 6).map((doc) => (
                <div key={doc.driverId + doc.type} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                  <div>
                    <div className="font-medium text-gray-900">{doc.type}</div>
                    <div className="text-sm text-gray-600">
                          Status: <span className={`font-medium ${
                            doc.status === 'Valid' ? 'text-green-600' : 
                            doc.status === 'Expiring Soon' ? 'text-yellow-600' : 'text-red-600'
                          }`}>{doc.status}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                        {doc.expirationDate && `Expires: ${doc.expirationDate}`}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Current Load / Assignments */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2v2a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2z" />
              </svg>
              My Current Load / Assignments
            </h2>
            
            {currentLoad ? (
              <div className="bg-blue-50 rounded border border-blue-200 p-4">
                    <div className="text-sm font-medium text-blue-900 mb-2">
                          Load {currentLoad.id}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                                <span className="text-gray-600">Origin:</span>
                                <div className="font-medium">{currentLoad.origin}</div>
                          </div>
                          <div>
                                <span className="text-gray-600">Destination:</span>
                                <div className="font-medium">{currentLoad.destination}</div>
                          </div>
                          <div>
                                <span className="text-gray-600">Status:</span>
                                <div className="font-medium text-blue-600">{currentLoad.status}</div>
                          </div>
                          <div>
                                <span className="text-gray-600">Equipment:</span>
                                <div className="font-medium">{currentLoad.assetId}</div>
                          </div>
                    </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                    No current assignments
              </div>
            )}
          </div>

          {/* Proof Upload Checklist */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0M12 15V7m0 0a3 3 0 00-6h3a3 3 0 006 0v8a3 3 0 00-6zm0 0a9 9 0 11-18 0 9 9 0 0118 0" />
              </svg>
              Proof Upload Checklist
            </h2>
            
            {currentLoad ? (
              <div className="space-y-2">
                    <div className="flex items-center p-3 bg-gray-50 rounded border border-gray-200">
                          <input type="checkbox" className="mr-3" readOnly checked={currentLoad.podStatus === 'verified'} />
                          <div>
                                <div className="font-medium">Bill of Lading (BOL)</div>
                                <div className="text-sm text-gray-600">
                                      {currentLoad.podStatus === 'verified' ? 'Verified' : 'Required'}
                                </div>
                          </div>
                    </div>
                    
                    <div className="flex items-center p-3 bg-gray-50 rounded border border-gray-200">
                          <input type="checkbox" className="mr-3" readOnly checked={currentLoad.podStatus === 'verified'} />
                          <div>
                                <div className="font-medium">Signed BOL / POD</div>
                                <div className="text-sm text-gray-600">
                                      {currentLoad.podStatus === 'verified' ? 'Verified' : 'Required'}
                                </div>
                          </div>
                    </div>
                    
                    <div className="flex items-center p-3 bg-gray-50 rounded border border-gray-200">
                          <input type="checkbox" className="mr-3" readOnly />
                          <div>
                                <div className="font-medium">Delivery Photo</div>
                                <div className="text-sm text-gray-600">Required</div>
                          </div>
                    </div>
                    
                    <div className="flex items-center p-3 bg-gray-50 rounded border border-gray-200">
                          <input type="checkbox" className="mr-3" readOnly />
                          <div>
                                <div className="font-medium">Seal Photo</div>
                                <div className="text-sm text-gray-600">Required if applicable</div>
                          </div>
                    </div>
                    
                    <div className="flex items-center p-3 bg-gray-50 rounded border border-gray-200">
                          <input type="checkbox" className="mr-3" readOnly />
                          <div>
                                <div className="font-medium">Cargo Photo</div>
                                <div className="text-sm text-gray-600">Required if applicable</div>
                          </div>
                    </div>
                    
                    <div className="flex items-center p-3 bg-gray-50 rounded border border-gray-200">
                          <input type="checkbox" className="mr-3" readOnly />
                          <div>
                                <div className="font-medium">Lumper Receipt</div>
                                <div className="text-sm text-gray-600">Required if applicable</div>
                          </div>
                    </div>
                    
                    <div className="flex items-center p-3 bg-gray-50 rounded border border-gray-200">
                          <input type="checkbox" className="mr-3" readOnly />
                          <div>
                                <div className="font-medium">Damage/Claim Photos</div>
                                <div className="text-sm text-gray-600">Required if applicable</div>
                          </div>
                    </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                    No active load requiring proof
              </div>
            )}
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
            
            <div className="space-y-2">
              <div className="flex items-center p-3 bg-gray-50 rounded border border-gray-200">
                    <input type="checkbox" className="mr-3" readOnly checked />
                    <div>
                          <div className="font-medium">Employee Handbook / Code of Conduct</div>
                          <div className="text-sm text-gray-600">
                                {driverProfile.workerType === 'Employee Driver' ? 'Acknowledged' : 'Not applicable'}
                          </div>
                    </div>
              </div>
              
              <div className="flex items-center p-3 bg-gray-50 rounded border border-gray-200">
                    <input type="checkbox" className="mr-3" readOnly checked />
                    <div>
                          <div className="font-medium">Acceptable Use Policy</div>
                          <div className="text-sm text-green-600">Acknowledged</div>
                    </div>
              </div>
              
              <div className="flex items-center p-3 bg-gray-50 rounded border border-gray-200">
                    <input type="checkbox" className="mr-3" readOnly checked />
                    <div>
                          <div className="font-medium">Safety and Compliance Policy</div>
                          <div className="text-sm text-green-600">Acknowledged</div>
                    </div>
              </div>
              
              <div className="flex items-center p-3 bg-gray-50 rounded border border-gray-200">
                    <input type="checkbox" className="mr-3" readOnly checked />
                    <div>
                          <div className="font-medium">AI Use and Automation Governance Policy</div>
                          <div className="text-sm text-green-600">Acknowledged</div>
                    </div>
              </div>
            </div>
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
                      'Independent Contractor Agreement',
                      'Owner-Operator Lease Agreement',
                      'Certificate of Insurance Verification',
                      'Occupational Accident Coverage Acknowledgment',
                      'Equipment Schedule',
                      'Maintenance Responsibility Acknowledgment',
                      'Fuel/Toll/Advance/Chargeback Policy Acknowledgment',
                      'Settlement/Payment Authorization',
                      'Safety and Compliance Acknowledgment',
                      'Worker Classification Review Summary'
                    ].map((docName) => (
                      <Link
                        key={docName}
                        href={`/generated/drivers/${driverId}/owner-operator/${docName.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-').replace(/[^a-z0-9-]/g, '')}.html`}
                        className="flex items-center p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                            <svg className="w-4 h-4 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 00-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01-.707-.293H9z" />
                            </svg>
                            <div className="flex-1">
                                  <div className="font-medium text-gray-900">{docName}</div>
                                  <div className="text-sm text-gray-600">View document</div>
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
