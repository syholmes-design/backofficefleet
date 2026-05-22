'use client';

import { useState, useEffect } from 'react';
import type { BofData } from '@/lib/load-bof-data';
import { buildFleetFinancials, DEFAULT_FINANCIAL_ASSUMPTIONS } from '@/lib/fleet-financials';
import { formatCurrency, formatPercent } from '@/lib/load-profitability';
import { FinancialAssumptions, LoadSpecificAssumptions } from '@/lib/financial-assumptions';
import { 
  buildFuelExciseSupportByLoad, 
  buildFuelExciseJurisdictionRollup, 
  DEFAULT_FUEL_EXCISE_ASSUMPTIONS,
  type LoadFuelExciseData,
  type JurisdictionFuelExciseData,
  type FuelExciseAssumptions,
  type StateAssessmentComparison
} from '@/lib/fuel-excise-tax-support';
import { 
  calculateDriverPayOrSettlement,
  DEFAULT_DRIVER_PAY_ASSUMPTIONS,
  getSettlementTermsLabel,
  getSettlementMethodBadge,
  getDriverPaySettlementMethod,
  type DriverPayAssumptions,
  type SettlementCalculation
} from '@/lib/driver-pay-settlement-methods';
import { getNegativeContributionExplanation } from '@/lib/load-profitability';
import LossExplanationTooltip from '@/components/ui/LossExplanationTooltip';
import Link from 'next/link';

interface FleetFinancialsPageClientProps {
  initialData: BofData;
}

export default function FleetFinancialsPageClient({ initialData }: FleetFinancialsPageClientProps) {
  const [data] = useState<BofData>(initialData);
  const [assumptions, setAssumptions] = useState<FinancialAssumptions>(DEFAULT_FINANCIAL_ASSUMPTIONS);
  const [loadSpecificAssumptions, setLoadSpecificAssumptions] = useState<Record<string, LoadSpecificAssumptions>>({});
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  
  // Fuel excise tax support state
  const [fuelExciseAssumptions, setFuelExciseAssumptions] = useState<FuelExciseAssumptions>(DEFAULT_FUEL_EXCISE_ASSUMPTIONS);
  const [loadFuelData, setLoadFuelData] = useState<LoadFuelExciseData[]>([]);
  const [jurisdictionData, setJurisdictionData] = useState<JurisdictionFuelExciseData[]>([]);
  const [stateAssessment, setStateAssessment] = useState<StateAssessmentComparison | null>(null);
  
  // Driver pay/settlement state
  const [driverPayAssumptions, setDriverPayAssumptions] = useState<DriverPayAssumptions>(DEFAULT_DRIVER_PAY_ASSUMPTIONS);
  const [selectedLoadSettlement, setSelectedLoadSettlement] = useState<SettlementCalculation | null>(null);
  const [actualsMode, setActualsMode] = useState<'assumptions' | 'actuals' | 'compare'>('assumptions');

  const [fleetFinancials, setFleetFinancials] = useState(() => 
    buildFleetFinancials(data, assumptions)
  );

  // Get driver settlement method for tooltip generation
  const getDriverSettlementMethod = (driverId: string) => {
    return getDriverPaySettlementMethod(driverId, data);
  };

  // Recalculate financials when assumptions change
  useEffect(() => {
    setFleetFinancials(buildFleetFinancials(data, assumptions));
  }, [data, assumptions]);

  // Calculate fuel excise tax support data
  useEffect(() => {
    const newLoadFuelData = buildFuelExciseSupportByLoad(data, fuelExciseAssumptions);
    const newJurisdictionData = buildFuelExciseJurisdictionRollup(newLoadFuelData, fuelExciseAssumptions);
    
    setLoadFuelData(newLoadFuelData);
    setJurisdictionData(newJurisdictionData);
    
    // Generate a sample state assessment comparison
    const totalExposure = newJurisdictionData.reduce((sum, jur) => sum + jur.estimatedExposure, 0);
    const sampleStateAssessment = totalExposure * 1.15; // Sample 15% higher assessment
    setStateAssessment({
      bofRunningEstimate: totalExposure,
      stateProposedAssessment: sampleStateAssessment,
      variance: sampleStateAssessment - totalExposure,
      variancePercentage: ((sampleStateAssessment - totalExposure) / totalExposure) * 100,
      likelyVarianceReason: 'State assessment 15% higher - review jurisdiction allocation',
      supportingRecordsAvailable: true,
      recommendedAction: 'Review fuel receipts and mileage records for missing documentation'
    });
  }, [data, fuelExciseAssumptions]);

  // Calculate settlement calculation when load is selected
  useEffect(() => {
    if (selectedLoadId) {
      const load = data.loads.find(l => l.id === selectedLoadId);
      if (load) {
        const revenue = {
          linehaulRevenue: load.revenue,
          fuelSurcharge: 0, // Demo assumption
          accessorialRevenue: 0, // Demo assumption
          detention: 0, // Demo assumption
          layover: 0, // Demo assumption
          tonu: 0, // Demo assumption
          lumperReimbursement: 0, // Demo assumption
          otherRevenue: 0, // Demo assumption
        };
        
        const loadMiles = {
          loadedMiles: 450, // Demo assumption
          emptyMiles: 50, // Demo assumption
          totalMiles: 500, // Demo assumption
        };
        
        const settlement = calculateDriverPayOrSettlement(
          selectedLoadId,
          revenue,
          loadMiles,
          data,
          driverPayAssumptions
        );
        
        setSelectedLoadSettlement(settlement);
      }
    } else {
      setSelectedLoadSettlement(null);
    }
  }, [selectedLoadId, data, driverPayAssumptions]);

  const selectedLoad = fleetFinancials.loadFinancials.find(load => load.loadId === selectedLoadId);
  const currentLoadAssumptions = selectedLoadId ? loadSpecificAssumptions[selectedLoadId] || {} : {};

  const updateAssumption = (key: keyof FinancialAssumptions, value: number) => {
    setAssumptions(prev => ({ ...prev, [key]: value }));
  };

  const updateLoadAssumption = (loadId: string, key: string, value: number | string | undefined) => {
    setLoadSpecificAssumptions(prev => ({
      ...prev,
      [loadId]: { ...prev[loadId], [key]: value }
    }));
  };

  const { overview, pnlPreview, cashFlowForecast, assetDebtSchedule, cashFlowMaximization, auditReadinessMetrics } = fleetFinancials;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Fleet Financials</h1>
              <p className="mt-2 text-lg text-gray-600">
                BOF converts loads, settlements, fuel, factoring, assets, insurance, maintenance, and debt into management-ready financial intelligence for the fleet owner.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Every completed load creates revenue, cost, cash-flow, receivables, payroll, factoring, and asset implications. BOF brings those events into one financial operating view.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-sm">
              <p className="text-sm font-medium text-yellow-800">
                Management financial preview only. Not a tax filing, audited statement, or accounting system of record.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Fleet Financial Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Fleet Financial Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Total Load Revenue</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(overview.totalLoadRevenue)}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Total Driver Settlements</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(overview.totalDriverSettlements)}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Net Operating Contribution</div>
              <div className={`text-2xl font-bold ${overview.netOperatingContribution >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(overview.netOperatingContribution)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Contribution Margin</div>
              <div className={`text-2xl font-bold ${overview.contributionMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(overview.contributionMargin)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Total Fuel Cost</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(overview.totalFuelCost)}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Total Factoring Fees</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(overview.totalFactoringFees)}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Cash Collected</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(overview.cashCollected)}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Cash Outstanding</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(overview.cashOutstanding)}</div>
            </div>
          </div>
        </div>

        {/* Actuals vs Assumptions Toggle */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Data Mode</h2>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex space-x-4">
              {(['assumptions', 'actuals', 'compare'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setActualsMode(mode)}
                  className={`px-4 py-2 rounded-lg font-medium capitalize ${
                    actualsMode === mode
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {mode === 'assumptions' ? 'Use Assumptions' : mode === 'actuals' ? 'Use Actuals' : 'Compare'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Load Profitability Table */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Load Profitability Table</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Load ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Margin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fleetFinancials.loadFinancials.map((load) => (
                    <tr key={load.loadId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {load.loadId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {load.driverName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          load.status === 'Delivered' ? 'bg-green-100 text-green-800' : 
                          load.status === 'En Route' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {load.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(load.revenue.totalRevenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(load.costs.totalCosts)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          <span className={`font-medium ${load.netContribution >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(load.netContribution)}
                          </span>
                          {load.netContribution < 0 && (
                            <LossExplanationTooltip 
                              explanation={getNegativeContributionExplanation(load, getDriverSettlementMethod(load.driverId))}
                            >
                              <svg className="w-4 h-4 text-teal-600 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4a1 1 0 01-1-1H7a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1v-4zM13 16h-1v-4a1 1 0 01-1-1H7a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1v-4z"/>
                              </svg>
                            </LossExplanationTooltip>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-medium ${load.contributionMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercent(load.contributionMargin)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(load.cashCollected)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedLoadId(load.loadId)}
                          className="text-teal-600 hover:text-teal-900 font-medium"
                        >
                          View Financials
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Load-Level Financial Statement */}
        {selectedLoad && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Load-Level Financial Statement - {selectedLoad.loadId}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Financial Statement */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Linehaul Revenue</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedLoad.revenue.linehaulRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Fuel Surcharge</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedLoad.revenue.fuelSurcharge)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Accessorial Revenue</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedLoad.revenue.accessorialRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Detention</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedLoad.revenue.detention)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Layover</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedLoad.revenue.layover)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">TONU</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedLoad.revenue.tonu)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Lumper Reimbursement</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedLoad.revenue.lumperReimbursement)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span className="text-sm text-gray-900">Total Revenue</span>
                    <span className="text-sm">{formatCurrency(selectedLoad.revenue.totalRevenue)}</span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">Direct Costs</h3>
                <div className="space-y-2">
                  {selectedLoadSettlement && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Driver / Contractor</span>
                        <span className="text-sm font-medium">{selectedLoad.driverName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Worker Type</span>
                        <span className="text-sm font-medium">{selectedLoad.workerType}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Pay / Settlement Method</span>
                        <span className={`text-sm font-medium px-2 py-1 rounded-full text-xs ${
                          getSettlementMethodBadge(selectedLoad.driverId, data).color === 'purple' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {getSettlementTermsLabel(selectedLoad.driverId, data)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Base Pay / Settlement</span>
                        <span className="text-sm font-medium">{formatCurrency(selectedLoadSettlement.basePayOrSettlement)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Pass-Through Items</span>
                        <span className="text-sm font-medium">{formatCurrency(
                          selectedLoadSettlement.passThroughItems.fuelSurcharge + 
                          selectedLoadSettlement.passThroughItems.accessorial + 
                          selectedLoadSettlement.passThroughItems.reimbursements
                        )}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Deductions / Chargebacks</span>
                        <span className="text-sm font-medium">{formatCurrency(
                          (selectedLoadSettlement.deductions.payrollDeductions || 0) +
                          (selectedLoadSettlement.deductions.settlementDeductions || 0) +
                          (selectedLoadSettlement.deductions.chargebacks || 0) +
                          (selectedLoadSettlement.deductions.familySupport || 0)
                        )}</span>
                      </div>
                      <div className="flex justify-between font-semibold pt-2 border-t">
                        <span className="text-sm text-gray-900">Final Driver Cost</span>
                        <span className="text-sm">{formatCurrency(selectedLoadSettlement.finalDriverCost)}</span>
                      </div>
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                        {selectedLoadSettlement.settlementTerms}
                      </div>
                    </>
                  )}
                  {!selectedLoadSettlement && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Driver Settlement</span>
                      <span className="text-sm font-medium">{formatCurrency(selectedLoad.costs.driverSettlement)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Fuel Cost</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedLoad.costs.fuelCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tolls</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedLoad.costs.tolls)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Lumper Paid</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedLoad.costs.lumperPaid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Repairs</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedLoad.costs.repairs)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Factoring Fee</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedLoad.costs.factoringFee)}</span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">Allocated Costs</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Maintenance Allocation</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedLoad.costs.maintenanceAllocation)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Insurance Allocation</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedLoad.costs.insuranceAllocation)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tractor Debt Allocation</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedLoad.costs.tractorDebtAllocation)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Trailer Debt Allocation</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedLoad.costs.trailerDebtAllocation)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Depreciation Allocation</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedLoad.costs.depreciationAllocation)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Admin Overhead Allocation</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedLoad.costs.adminOverheadAllocation)}</span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-6">Results</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Net Load Contribution</span>
                    <span className={`text-sm font-medium ${selectedLoad.netContribution >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(selectedLoad.netContribution)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Contribution Margin</span>
                    <span className={`text-sm font-medium ${selectedLoad.contributionMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercent(selectedLoad.contributionMargin)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cash Collected</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedLoad.cashCollected)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cash Outstanding</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedLoad.cashOutstanding)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Invoice Readiness</span>
                    <span className="text-sm font-medium">{selectedLoad.invoiceReadiness}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Factoring Status</span>
                    <span className="text-sm font-medium">{selectedLoad.factoringStatus}</span>
                  </div>
                </div>
              </div>

              {/* Loss Explanation Panel */}
              {selectedLoad.netContribution < 0 && (
                <div className="mt-6 bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Loss Explanation</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Why This Load Shows a Loss</div>
                      <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
                        {getNegativeContributionExplanation(selectedLoad, getDriverSettlementMethod(selectedLoad.driverId)).shortTooltip}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Primary Loss Drivers</div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {getNegativeContributionExplanation(selectedLoad, getDriverSettlementMethod(selectedLoad.driverId)).primaryLossDrivers.map((driver, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-teal-600 mr-1">•</span>
                            {driver}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">Recommended Review Actions</div>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {getNegativeContributionExplanation(selectedLoad, getDriverSettlementMethod(selectedLoad.driverId)).recommendedReviewActions.map((action, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-teal-600 mr-1">•</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Editable Assumption Panel */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Editable Assumptions</h3>
                <div className="space-y-4">
                  {/* Driver Pay / Settlement Assumptions */}
                  <div className="border-b border-gray-200 pb-4">
                    <h4 className="text-md font-medium text-gray-900 mb-3">
                      {selectedLoad && selectedLoad.workerType === 'Independent Contractor / Owner-Operator' 
                        ? 'Owner-Operator Settlement Assumptions' 
                        : 'Driver Pay Assumptions'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedLoad && selectedLoad.workerType === 'Independent Contractor / Owner-Operator' ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Loaded Mile Rate</label>
                            <input
                              type="number"
                              step="0.01"
                              value={driverPayAssumptions.ownerOperatorLoadedMileRate}
                              onChange={(e) => setDriverPayAssumptions(prev => ({ ...prev, ownerOperatorLoadedMileRate: parseFloat(e.target.value) }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Linehaul Percent</label>
                            <input
                              type="number"
                              step="0.1"
                              value={driverPayAssumptions.ownerOperatorLinehaulPercent}
                              onChange={(e) => setDriverPayAssumptions(prev => ({ ...prev, ownerOperatorLinehaulPercent: parseFloat(e.target.value) }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Flat Trip Rate</label>
                            <input
                              type="number"
                              step="0.01"
                              value={driverPayAssumptions.ownerOperatorFlatTripRate}
                              onChange={(e) => setDriverPayAssumptions(prev => ({ ...prev, ownerOperatorFlatTripRate: parseFloat(e.target.value) }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Flat Minimum Per Trip</label>
                            <input
                              type="number"
                              step="0.01"
                              value={driverPayAssumptions.ownerOperatorFlatMinimumPerTrip}
                              onChange={(e) => setDriverPayAssumptions(prev => ({ ...prev, ownerOperatorFlatMinimumPerTrip: parseFloat(e.target.value) }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Surcharge Pass-Through</label>
                            <select
                              value={driverPayAssumptions.ownerOperatorFuelSurchargePassThrough ? 'true' : 'false'}
                              onChange={(e) => setDriverPayAssumptions(prev => ({ ...prev, ownerOperatorFuelSurchargePassThrough: e.target.value === 'true' }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                              <option value="true">Yes</option>
                              <option value="false">No</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Accessorial Pass-Through</label>
                            <select
                              value={driverPayAssumptions.ownerOperatorAccessorialPassThrough ? 'true' : 'false'}
                              onChange={(e) => setDriverPayAssumptions(prev => ({ ...prev, ownerOperatorAccessorialPassThrough: e.target.value === 'true' }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                              <option value="true">Yes</option>
                              <option value="false">No</option>
                            </select>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employee Cents per Mile Rate</label>
                            <input
                              type="number"
                              step="0.01"
                              value={driverPayAssumptions.employeeCentsPerMileRate}
                              onChange={(e) => setDriverPayAssumptions(prev => ({ ...prev, employeeCentsPerMileRate: parseFloat(e.target.value) }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employee Hourly Rate</label>
                            <input
                              type="number"
                              step="0.01"
                              value={driverPayAssumptions.employeeHourlyRate}
                              onChange={(e) => setDriverPayAssumptions(prev => ({ ...prev, employeeHourlyRate: parseFloat(e.target.value) }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employee Reimbursements</label>
                            <input
                              type="number"
                              step="0.01"
                              value={driverPayAssumptions.employeeReimbursements}
                              onChange={(e) => setDriverPayAssumptions(prev => ({ ...prev, employeeReimbursements: parseFloat(e.target.value) }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Employee Deductions</label>
                            <input
                              type="number"
                              step="0.01"
                              value={driverPayAssumptions.employeeDeductions}
                              onChange={(e) => setDriverPayAssumptions(prev => ({ ...prev, employeeDeductions: parseFloat(e.target.value) }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Price per Gallon</label>
                    <input
                      type="number"
                      step="0.01"
                      value={assumptions.fuelPricePerGallon}
                      onChange={(e) => updateAssumption('fuelPricePerGallon', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">MPG</label>
                    <input
                      type="number"
                      step="0.1"
                      value={assumptions.mpg}
                      onChange={(e) => updateAssumption('mpg', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Factoring Fee %</label>
                    <input
                      type="number"
                      step="0.001"
                      value={assumptions.factoringFeePercent}
                      onChange={(e) => updateAssumption('factoringFeePercent', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver Pay Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={currentLoadAssumptions.driverPayAmount ?? ''}
                      onChange={(e) => updateLoadAssumption(selectedLoad.loadId, 'driverPayAmount', parseFloat(e.target.value) || undefined)}
                      placeholder="Override driver pay"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loaded Miles</label>
                    <input
                      type="number"
                      step="1"
                      value={currentLoadAssumptions.loadedMiles ?? ''}
                      onChange={(e) => updateLoadAssumption(selectedLoad.loadId, 'loadedMiles', parseInt(e.target.value) || undefined)}
                      placeholder="Enter loaded miles"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Empty Miles</label>
                    <input
                      type="number"
                      step="1"
                      value={currentLoadAssumptions.emptyMiles ?? ''}
                      onChange={(e) => updateLoadAssumption(selectedLoad.loadId, 'emptyMiles', parseInt(e.target.value) || undefined)}
                      placeholder="Enter empty miles"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      Demo assumptions only. Changes are local and will reset on page refresh.
                    </p>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Fleet Rollup / Management P&L Preview */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Fleet Rollup / Management P&L Preview</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Freight Revenue</span>
                    <span className="text-sm font-medium">{formatCurrency(pnlPreview.revenue.freightRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Accessorial Revenue</span>
                    <span className="text-sm font-medium">{formatCurrency(pnlPreview.revenue.accessorialRevenue)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span className="text-sm text-gray-900">Total Revenue</span>
                    <span className="text-sm">{formatCurrency(pnlPreview.revenue.totalRevenue)}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Operating Costs</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Driver Settlements</span>
                    <span className="text-sm font-medium">{formatCurrency(pnlPreview.operatingCosts.driverSettlements)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Fuel</span>
                    <span className="text-sm font-medium">{formatCurrency(pnlPreview.operatingCosts.fuel)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Factoring Fees</span>
                    <span className="text-sm font-medium">{formatCurrency(pnlPreview.operatingCosts.factoringFees)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tolls & Lumper</span>
                    <span className="text-sm font-medium">{formatCurrency(pnlPreview.operatingCosts.tollsAndLumper)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Maintenance Allocation</span>
                    <span className="text-sm font-medium">{formatCurrency(pnlPreview.operatingCosts.maintenanceAllocation)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Insurance Allocation</span>
                    <span className="text-sm font-medium">{formatCurrency(pnlPreview.operatingCosts.insuranceAllocation)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Debt Service Allocation</span>
                    <span className="text-sm font-medium">{formatCurrency(pnlPreview.operatingCosts.debtServiceAllocation)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Overhead Allocation</span>
                    <span className="text-sm font-medium">{formatCurrency(pnlPreview.operatingCosts.overheadAllocation)}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Result</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Net Operating Contribution</span>
                    <span className={`text-sm font-medium ${pnlPreview.result.netOperatingContribution >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(pnlPreview.result.netOperatingContribution)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Contribution Margin</span>
                    <span className={`text-sm font-medium ${pnlPreview.result.contributionMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercent(pnlPreview.result.contributionMargin)}
                    </span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Management P&L preview based on BOF operational data and assumptions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cash Flow Forecast */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Cash Flow Forecast</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Cash In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Cash Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Cash Position</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cashFlowForecast.map((forecast) => (
                    <tr key={forecast.period}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {forecast.period}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(forecast.expectedCashIn)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(forecast.expectedCashOut)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-medium ${forecast.netCashPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(forecast.netCashPosition)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Asset & Debt Schedule Preview */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Asset & Debt Schedule Preview</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset/Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Load Count</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue Generated</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contribution After Allocation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assetDebtSchedule.map((asset) => (
                    <tr key={asset.assetUnit}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {asset.assetUnit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {asset.assignedDriver}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {asset.loadCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(asset.monthlyPayment)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(asset.revenueGenerated)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-medium ${asset.contributionAfterAllocation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(asset.contributionAfterAllocation)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          asset.reviewStatus === 'Good' ? 'bg-green-100 text-green-800' : 
                          asset.reviewStatus === 'Review' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {asset.reviewStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Cash Flow Maximization */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Cash Flow Maximization</h2>
          <p className="text-gray-600 mb-6">
            BOF identifies where cash is delayed, what loads are ready to invoice, what invoices can be factored, what reserves are expected, and what upcoming settlement, fuel, insurance, maintenance, and debt obligations may affect the fleet&apos;s cash position.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Related Policy:</strong> 
              <Link href="/documents/company-operations-vault" className="text-teal-600 hover:text-teal-700 underline ml-1">
                Cash Flow Management and Receivables Acceleration Policy
              </Link>
            </p>
          </div>
          
          {/* Cash Flow Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Invoice-Ready Loads</div>
              <div className="text-2xl font-bold text-green-600">{cashFlowMaximization.invoiceReadyLoads}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Loads Blocked from Billing</div>
              <div className="text-2xl font-bold text-red-600">{cashFlowMaximization.loadsBlockedFromBilling}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Estimated Cash Delayed by Proof</div>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(cashFlowMaximization.estimatedCashDelayedByProof)}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Factoring Advance Available</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(cashFlowMaximization.factoringAdvanceAvailable)}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Expected Reserve Release</div>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(cashFlowMaximization.expectedReserveRelease)}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Upcoming Settlement Obligations</div>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(cashFlowMaximization.upcomingSettlementObligations)}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Upcoming Fuel/Insurance/Debt</div>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(cashFlowMaximization.upcomingFuelInsuranceDebtPayments)}</div>
            </div>
          </div>

          {/* Net Cash Position */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Net Cash Position</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">7 Days</div>
                <div className={`text-2xl font-bold ${cashFlowMaximization.netCashPosition.days7 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(cashFlowMaximization.netCashPosition.days7)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">14 Days</div>
                <div className={`text-2xl font-bold ${cashFlowMaximization.netCashPosition.days14 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(cashFlowMaximization.netCashPosition.days14)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">30 Days</div>
                <div className={`text-2xl font-bold ${cashFlowMaximization.netCashPosition.days30 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(cashFlowMaximization.netCashPosition.days30)}
                </div>
              </div>
            </div>
          </div>

          {/* Cash Flow Levers Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Cash Flow Levers</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lever</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Impact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Related Load</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommended Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cashFlowMaximization.cashFlowLevers.map((lever) => (
                    <tr key={lever.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {lever.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          lever.status === 'Complete' ? 'bg-green-100 text-green-800' :
                          lever.status === 'Blocked' ? 'bg-red-100 text-red-800' :
                          lever.status === 'Needs Review' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {lever.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-medium ${lever.estimatedCashImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(lever.estimatedCashImpact)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lever.relatedLoadId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lever.recommendedAction}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Tax & Regulatory Audit Readiness */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tax & Regulatory Audit Readiness</h2>
          <p className="text-gray-600 mb-6">
            BOF organizes the operational records that support audit readiness — load records, trip miles, fuel costs, tolls, receipts, asset schedules, invoices, settlements, proof bundles, and document retention controls.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Related Policies:</strong> 
              <Link href="/documents/company-operations-vault" className="text-teal-600 hover:text-teal-700 underline ml-1">
                Tax and Regulatory Audit Readiness Policy
              </Link>
              {" | "}
              <Link href="/documents/company-operations-vault" className="text-teal-600 hover:text-teal-700 underline">
                Fuel, Mileage, and Excise Tax Support Checklist
              </Link>
            </p>
          </div>
          
          {/* Audit Readiness Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Loads with Complete Proof Bundle</div>
              <div className="text-2xl font-bold text-green-600">{auditReadinessMetrics.loadsWithCompleteProofBundle}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Loads with Fuel/Mileage Support</div>
              <div className="text-2xl font-bold text-blue-600">{auditReadinessMetrics.loadsWithFuelMileageSupport}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Loads with Invoice/POD Support</div>
              <div className="text-2xl font-bold text-green-600">{auditReadinessMetrics.loadsWithInvoicePodSupport}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Assets with Debt/Insurance Schedule</div>
              <div className="text-2xl font-bold text-blue-600">{auditReadinessMetrics.assetsWithDebtInsuranceSchedule}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Records Needing Review</div>
              <div className="text-2xl font-bold text-orange-600">{auditReadinessMetrics.recordsNeedingReview}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Audit Readiness Score</div>
              <div className={`text-2xl font-bold ${auditReadinessMetrics.auditReadinessScore >= 80 ? 'text-green-600' : auditReadinessMetrics.auditReadinessScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {auditReadinessMetrics.auditReadinessScore.toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Audit Support Checklist */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Audit Support Checklist</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Missing</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Needs Review</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Related Module</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditReadinessMetrics.auditSupportChecklist.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          item.available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.available ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          item.missing ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.missing ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          item.needsReview ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.needsReview ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.relatedModule}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.action}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Fuel Tax & Excise Audit Support Calculator */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Fuel Tax & Excise Audit Support Calculator</h2>
          <p className="text-gray-600 mb-6">
            BOF tracks load mileage, fuel, route jurisdictions, asset usage, receipts, and proof records to create a running audit-support estimate. Fleet owners can compare BOF&apos;s records against later state, IFTA, or regulatory assessments and identify variances before they become disputes.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> This is a management estimate for audit support only. BOF does not prepare final excise tax returns or calculate final tax liability.
            </p>
          </div>

          {/* Editable Fuel Excise Assumptions */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fuel Tax Assumptions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MPG</label>
                <input
                  type="number"
                  step="0.1"
                  value={fuelExciseAssumptions.mpg}
                  onChange={(e) => setFuelExciseAssumptions(prev => ({ ...prev, mpg: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taxable Mileage %</label>
                <input
                  type="number"
                  step="0.01"
                  value={fuelExciseAssumptions.taxableMileagePercentage * 100}
                  onChange={(e) => setFuelExciseAssumptions(prev => ({ ...prev, taxableMileagePercentage: parseFloat(e.target.value) / 100 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Price per Gallon</label>
                <input
                  type="number"
                  step="0.01"
                  value={fuelExciseAssumptions.fuelPricePerGallon}
                  onChange={(e) => setFuelExciseAssumptions(prev => ({ ...prev, fuelPricePerGallon: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Support Available</label>
                <select
                  value={fuelExciseAssumptions.receiptSupportAvailable ? 'true' : 'false'}
                  onChange={(e) => setFuelExciseAssumptions(prev => ({ ...prev, receiptSupportAvailable: e.target.value === 'true' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exclude Non-Taxable Miles</label>
                <select
                  value={fuelExciseAssumptions.excludeNonTaxableMiles ? 'true' : 'false'}
                  onChange={(e) => setFuelExciseAssumptions(prev => ({ ...prev, excludeNonTaxableMiles: e.target.value === 'true' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
          </div>

          {/* Load-Level Calculator */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Load-Level Fuel Tax Calculator</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Load ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tractor/Asset</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Miles</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Gallons</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuel Purchased</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadFuelData.slice(0, 10).map((load) => (
                    <tr key={load.loadId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {load.loadId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {load.tractorAsset}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {load.driver}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {load.pickupState} → {load.deliveryState}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {load.totalMiles.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {load.estimatedGallonsConsumed.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {load.fuelGallonsPurchased} gal
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          load.auditSupportStatus === 'Complete' ? 'bg-green-100 text-green-800' :
                          load.auditSupportStatus === 'Missing Receipt' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {load.auditSupportStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fleet-Level Jurisdiction Rollup */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Fleet-Level Jurisdiction Rollup</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jurisdiction</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Miles</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxable Miles</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Gallons</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuel Purchased</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Exposure</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jurisdictionData.map((jurisdiction) => (
                    <tr key={jurisdiction.jurisdiction}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {jurisdiction.jurisdiction}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {jurisdiction.totalMiles.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {jurisdiction.taxableMiles.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {jurisdiction.estimatedGallonsConsumed.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {jurisdiction.fuelGallonsPurchased.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="font-medium text-red-600">
                          {formatCurrency(jurisdiction.estimatedExposure)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          jurisdiction.recordsComplete ? 'bg-green-100 text-green-800' :
                          jurisdiction.recordsNeedingReview > 0 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {jurisdiction.recordsComplete ? 'Complete' : 
                           jurisdiction.recordsNeedingReview > 0 ? `${jurisdiction.recordsNeedingReview} Need Review` : 'Incomplete'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* BOF Estimate vs State Assessment */}
          {stateAssessment && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">BOF Estimate vs. State Assessment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Comparison Results</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">BOF Running Estimate:</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(stateAssessment.bofRunningEstimate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">State Proposed Assessment:</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(stateAssessment.stateProposedAssessment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Variance:</span>
                      <span className={`text-sm font-medium ${stateAssessment.variance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(stateAssessment.variance)} ({stateAssessment.variancePercentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Analysis & Actions</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Likely Reason:</span>
                      <p className="text-sm text-gray-900 mt-1">{stateAssessment.likelyVarianceReason}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Recommended Action:</span>
                      <p className="text-sm text-gray-900 mt-1">{stateAssessment.recommendedAction}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audit Support Packet */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Support Packet</h3>
            <p className="text-sm text-gray-600 mb-4">Documents and data BOF can collect for audit support:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-900">Load Record</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-900">BOL/POD</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-900">Route/Mileage Support</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-900">Fuel Receipts</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-900">Fuel Card Records</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-900">Asset/Unit Assignment</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-900">Settlement/Load Report</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-900">Invoice Record</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-900">Audit Readiness Checklist</span>
              </div>
            </div>
          </div>
        </div>

        {/* Accounting-Ready Export Card */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Accounting-Ready Export</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Load Profitability Statement</h3>
                <p className="text-sm text-gray-600 mb-3">Detailed financial breakdown for each load</p>
                <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium" disabled>
                  Export preview coming next
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Monthly Fleet P&L Preview</h3>
                <p className="text-sm text-gray-600 mb-3">Aggregated fleet performance metrics</p>
                <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium" disabled>
                  Export preview coming next
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Asset & Debt Schedule</h3>
                <p className="text-sm text-gray-600 mb-3">Equipment financial performance tracking</p>
                <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium" disabled>
                  Export preview coming next
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Cash-Flow Forecast</h3>
                <p className="text-sm text-gray-600 mb-3">Projected cash movement analysis</p>
                <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium" disabled>
                  Export preview coming next
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Audit Support Package</h3>
                <p className="text-sm text-gray-600 mb-3">Complete audit-ready documentation bundle</p>
                <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium" disabled>
                  Export preview coming next
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Accounting-Ready Export</h3>
                <p className="text-sm text-gray-600 mb-3">Complete financial data package</p>
                <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium" disabled>
                  Export preview coming next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
