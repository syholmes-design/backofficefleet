"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, DollarSign, Clock, CheckCircle, XCircle, User, FileText, Truck, Shield, Wrench, Calendar } from "lucide-react";
import { getSettlementHolds } from "@/lib/v3-operational-loader";
import type { SettlementHold } from "@/lib/v3-operational-types";

interface SettlementHoldsPanelProps {
  weekEnding?: string;
  driverId?: string;
  showAll?: boolean;
}

export function SettlementHoldsPanel({ weekEnding, driverId, showAll = false }: SettlementHoldsPanelProps) {
  const [holds, setHolds] = useState<SettlementHold[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHolds();
  }, [weekEnding, driverId]);

  const loadHolds = async () => {
    try {
      setLoading(true);
      const allHolds = await getSettlementHolds();
      
      let filteredHolds = allHolds;
      
      if (weekEnding) {
        filteredHolds = filteredHolds.filter(h => h.weekEnding === weekEnding);
      }
      
      if (driverId) {
        filteredHolds = filteredHolds.filter(h => h.driverId === driverId);
      }
      
      setHolds(filteredHolds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settlement holds");
    } finally {
      setLoading(false);
    }
  };

  const getModuleIcon = (module: string) => {
    switch (module.toLowerCase()) {
      case 'safety':
        return <Shield className="w-4 h-4" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4" />;
      case 'dispatch':
        return <Truck className="w-4 h-4" />;
      case 'compliance':
      case 'documents':
        return <FileText className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getModuleColor = (module: string) => {
    switch (module.toLowerCase()) {
      case 'safety':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'maintenance':
        return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'dispatch':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'compliance':
      case 'documents':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default:
        return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'resolved':
        return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'under review':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      default:
        return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return <AlertTriangle className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      case 'under review':
        return <Clock className="w-4 h-4" />;
      default:
        return <XCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
          <span className="text-slate-400">Loading settlement holds...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <AlertTriangle className="w-8 h-8 text-red-400 mr-3" />
          <div>
            <p className="text-red-400 font-medium">Failed to load settlement holds</p>
            <p className="text-slate-400 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (holds.length === 0) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <CheckCircle className="w-8 h-8 text-green-400 mr-3" />
          <div>
            <p className="text-green-400 font-medium">No settlement holds</p>
            <p className="text-slate-400 text-sm">All settlements are clear and ready for processing</p>
          </div>
        </div>
      </div>
    );
  }

  // Group holds by status
  const openHolds = holds.filter(h => h.status.toLowerCase() === 'open');
  const resolvedHolds = holds.filter(h => h.status.toLowerCase() === 'resolved');
  const underReviewHolds = holds.filter(h => h.status.toLowerCase() === 'under review');

  // Calculate totals
  const totalHoldAmount = holds.reduce((sum, h) => sum + h.holdAmount, 0);
  const openHoldAmount = openHolds.reduce((sum, h) => sum + h.holdAmount, 0);

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <h3 className="text-lg font-semibold text-white">Settlement Holds</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-red-400 font-medium">{formatCurrency(openHoldAmount)}</div>
            <div className="text-slate-400 text-xs">Open holds</div>
          </div>
          <div className="text-right">
            <div className="text-slate-300 font-medium">{formatCurrency(totalHoldAmount)}</div>
            <div className="text-slate-400 text-xs">Total holds</div>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 font-medium">Open</span>
          </div>
          <div className="text-2xl font-bold text-white">{openHolds.length}</div>
          <div className="text-slate-400 text-sm">{formatCurrency(openHoldAmount)} held</div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-medium">Under Review</span>
          </div>
          <div className="text-2xl font-bold text-white">{underReviewHolds.length}</div>
          <div className="text-slate-400 text-sm">Being processed</div>
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-medium">Resolved</span>
          </div>
          <div className="text-2xl font-bold text-white">{resolvedHolds.length}</div>
          <div className="text-slate-400 text-sm">Cleared</div>
        </div>
      </div>

      {/* Holds List */}
      <div className="space-y-3">
        {holds.map((hold) => (
          <div key={hold.holdId} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(hold.status)}`}>
                    {hold.status}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getModuleColor(hold.relatedModule)}`}>
                    <div className="flex items-center gap-1">
                      {getModuleIcon(hold.relatedModule)}
                      <span>{hold.relatedModule}</span>
                    </div>
                  </span>
                  <span className="text-slate-400 text-sm">
                    {hold.holdId}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-white font-medium mb-1">{hold.holdReason}</div>
                    <div className="text-slate-400 text-sm">
                      <User className="w-3 h-3 inline mr-1" />
                      Driver: {hold.driverId}
                    </div>
                    {hold.loadId && (
                      <div className="text-slate-400 text-sm">
                        <Truck className="w-3 h-3 inline mr-1" />
                        Load: {hold.loadId}
                      </div>
                    )}
                    <div className="text-slate-400 text-sm">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Week: {hold.weekEnding}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-red-400 font-medium mb-1">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      {formatCurrency(hold.holdAmount)}
                    </div>
                    <div className="text-slate-400 text-sm">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Opened: {hold.openedDate}
                    </div>
                    {hold.resolvedDate && (
                      <div className="text-slate-400 text-sm">
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        Resolved: {hold.resolvedDate}
                      </div>
                    )}
                    {hold.approvedBy && (
                      <div className="text-slate-400 text-sm">
                        <User className="w-3 h-3 inline mr-1" />
                        Approved by: {hold.approvedBy}
                      </div>
                    )}
                  </div>
                </div>

                {hold.relatedEventId && (
                  <div className="text-slate-400 text-sm mb-2">
                    <FileText className="w-3 h-3 inline mr-1" />
                    Related Event: {hold.relatedEventId}
                  </div>
                )}

                {hold.managerActionRequired && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 mt-3">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 font-medium text-sm">Manager Action Required</span>
                    </div>
                    <div className="text-slate-300 text-sm">
                      This hold requires manager review and approval before release.
                      {hold.releaseAuthorizedBy && ` Authorized by: ${hold.releaseAuthorizedBy}`}
                    </div>
                  </div>
                )}
              </div>

              <div className="ml-4">
                <div className="text-right">
                  <div className="text-white font-medium">{formatCurrency(hold.holdAmount)}</div>
                  <div className="text-slate-400 text-xs">{hold.holdType}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-slate-400">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Settlement Hold Summary</span>
              </div>
              <div className="text-sm">
                BOF ties settlement release to proof readiness, compliance status, safety events, RFID exceptions, and manager approval.
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-medium">{holds.length} Total Holds</div>
              <div className="text-slate-400 text-sm">{openHolds.length} require action</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
