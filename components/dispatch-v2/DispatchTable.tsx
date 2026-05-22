"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, FileText } from "lucide-react";
import type { LoadV2 } from "@/lib/dispatch-v2-demo-data";
import { DispatchButton } from "./DispatchButton";
import type { PreTripChecklistState } from "./types";

interface DispatchTableProps {
  loads: LoadV2[];
  onOpenDetail: (load: LoadV2) => void;
  onOpenPreTrip: (load: LoadV2) => void;
  onDispatch: (load: LoadV2) => void;
  checklistState: PreTripChecklistState;
  dispatchInProgress: boolean;
}

type SortField = 'id' | 'driver' | 'customer' | 'origin' | 'commodity' | 'weight' | 'miles' | 'revenue' | 'status';

export function DispatchTable({ loads, onOpenDetail, onOpenPreTrip, onDispatch, checklistState, dispatchInProgress }: DispatchTableProps) {
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedLoads = [...loads].sort((a, b) => {
    let aVal: string | number = a[sortField];
    let bVal: string | number = b[sortField];

    // Handle numeric fields
    if (sortField === 'revenue' || sortField === 'miles') {
      aVal = Number(aVal);
      bVal = Number(bVal);
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });

  const getStatusBadge = (status: LoadV2['status']) => {
    const baseClasses = "inline-flex px-2 py-1 text-xs font-semibold rounded-full";
    switch (status) {
      case 'DELIVERED':
        return `${baseClasses} bg-emerald-500/20 text-emerald-400 border border-emerald-500/30`;
      case 'IN_TRANSIT':
        return `${baseClasses} bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse`;
      case 'PENDING':
        return `${baseClasses} bg-amber-500/20 text-amber-400 border border-amber-500/30`;
      default:
        return `${baseClasses} bg-slate-500/20 text-slate-400 border border-slate-500/30`;
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
  };

  return (
    <div className="mx-6 mb-6 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-700">
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('id')}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors"
                >
                  Load # <SortIcon field="id" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('driver')}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors"
                >
                  Driver <SortIcon field="driver" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('customer')}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors"
                >
                  Customer <SortIcon field="customer" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('origin')}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors"
                >
                  Origin → Dest <SortIcon field="origin" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('commodity')}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors"
                >
                  Commodity <SortIcon field="commodity" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('weight')}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors"
                >
                  Weight <SortIcon field="weight" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('miles')}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors"
                >
                  Miles <SortIcon field="miles" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('revenue')}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors"
                >
                  Revenue <SortIcon field="revenue" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors"
                >
                  Status <SortIcon field="status" />
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Pre-Trip
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Dispatch
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedLoads.map((load) => (
              <tr
                key={load.id}
                className="border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer transition-colors"
                onClick={() => onOpenDetail(load)}
              >
                <td className="px-4 py-3 font-mono text-sm text-blue-400 font-semibold">
                  {load.id}
                </td>
                <td className="px-4 py-3 text-sm text-slate-200">
                  {load.driver}
                </td>
                <td className="px-4 py-3 text-sm text-slate-200">
                  {load.customer}
                </td>
                <td className="px-4 py-3 text-sm text-slate-200">
                  <div>{load.origin}</div>
                  <div className="text-slate-400">→ {load.destination}</div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-200">
                  {load.commodity}
                </td>
                <td className="px-4 py-3 text-sm text-slate-200">
                  {load.weight}
                </td>
                <td className="px-4 py-3 text-sm text-slate-200">
                  {load.miles.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-slate-200 font-medium">
                  ${load.revenue.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span className={getStatusBadge(load.status)}>
                    {load.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPreTrip(load);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full text-xs font-semibold hover:bg-blue-500/20 transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    Pre-Trip
                  </button>
                </td>
                <td className="px-4 py-3">
                  <DispatchButton
                    load={load}
                    checklistState={checklistState}
                    onDispatch={onDispatch}
                    dispatchInProgress={dispatchInProgress}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
