'use client';

import { useState, useEffect } from 'react';
import type { BofData } from '@/lib/load-bof-data';
import { buildFleetFinancials, DEFAULT_FINANCIAL_ASSUMPTIONS } from '@/lib/fleet-financials';
import { formatCurrency, formatPercent } from '@/lib/load-profitability';
import { FinancialAssumptions, LoadSpecificAssumptions } from '@/lib/financial-assumptions';

interface FleetFinancialsPageClientProps {
  initialData: BofData;
}

export default function FleetFinancialsPageClient({ initialData }: FleetFinancialsPageClientProps) {
  const [data] = useState<BofData>(initialData);
  const [assumptions, setAssumptions] = useState<FinancialAssumptions>(DEFAULT_FINANCIAL_ASSUMPTIONS);
  const [loadSpecificAssumptions, setLoadSpecificAssumptions] = useState<Record<string, LoadSpecificAssumptions>>({});
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const [actualsMode, setActualsMode] = useState<'assumptions' | 'actuals' | 'compare'>('assumptions');

  const [fleetFinancials, setFleetFinancials] = useState(() => 
    buildFleetFinancials(data, assumptions)
  );

  // Recalculate financials when assumptions change
  useEffect(() => {
    setFleetFinancials(buildFleetFinancials(data, assumptions));
  }, [data, assumptions]);

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

  const { overview, pnlPreview, cashFlowForecast, assetDebtSchedule } = fleetFinancials;

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
                        <span className={`font-medium ${load.netContribution >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(load.netContribution)}
                        </span>
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
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Driver Settlement</span>
                    <span className="text-sm font-medium">{formatCurrency(selectedLoad.costs.driverSettlement)}</span>
                  </div>
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

              {/* Editable Assumption Panel */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Editable Assumptions</h3>
                <div className="space-y-4">
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
