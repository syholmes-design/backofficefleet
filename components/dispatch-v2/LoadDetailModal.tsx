"use client";

import { X, AlertTriangle, CheckCircle, Clock, DollarSign, Truck, User, FileText, Calendar } from "lucide-react";
import type { LoadV2 } from "@/lib/dispatch-v2-demo-data";

interface LoadDetailModalProps {
  load: LoadV2;
  onClose: () => void;
}

export function LoadDetailModal({ load, onClose }: LoadDetailModalProps) {
  const getSealStatusBadge = (status: LoadV2['sealStatus']) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold">
            <CheckCircle className="w-3 h-3" />
            VERIFIED
          </span>
        );
      case 'MISMATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-semibold">
            <AlertTriangle className="w-3 h-3" />
            MISMATCH
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold">
            <Clock className="w-3 h-3" />
            PENDING
          </span>
        );
      default:
        return null;
    }
  };

  const getProofStatusBadge = (status: LoadV2['proofStatus']) => {
    switch (status) {
      case 'COMPLETE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold">
            <CheckCircle className="w-3 h-3" />
            COMPLETE
          </span>
        );
      case 'INCOMPLETE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold">
            <AlertTriangle className="w-3 h-3" />
            INCOMPLETE
          </span>
        );
      default:
        return null;
    }
  };

  const getPodStatusBadge = (status: LoadV2['podStatus']) => {
    switch (status) {
      case 'RECEIVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold">
            <CheckCircle className="w-3 h-3" />
            RECEIVED
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold">
            <Clock className="w-3 h-3" />
            PENDING
          </span>
        );
      default:
        return null;
    }
  };

  const getSettlementHoldBadge = (hold: LoadV2['settlementHold']) => {
    if (hold === 'YES') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-semibold">
          <AlertTriangle className="w-3 h-3" />
          HOLD
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold">
          <CheckCircle className="w-3 h-3" />
          CLEAR
        </span>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-slate-900 border-l border-blue-500/30 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-blue-500/20 p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
            LOAD DETAIL
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {load.id}
          </div>
          <div className="text-sm text-slate-400">
            {load.driver} · {load.truck} · {load.trailer}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Load Summary */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Load Summary
            </h3>
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Customer</span>
                <span className="text-white font-medium">{load.customer}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Consignee</span>
                <span className="text-white font-medium">{load.consignee}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Origin</span>
                <span className="text-white font-medium">{load.originFull}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Destination</span>
                <span className="text-white font-medium">{load.destFull}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Commodity</span>
                <span className="text-white font-medium">{load.commodity}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Weight</span>
                <span className="text-white font-medium">{load.weight}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Pallets / Pieces</span>
                <span className="text-white font-medium">{load.pallets} / {load.pieces}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-700">
                <div className="text-center">
                  <div className="text-xs text-slate-400">BOL</div>
                  <div className="text-sm font-mono text-blue-400">{load.bol}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-400">RC</div>
                  <div className="text-sm font-mono text-blue-400">{load.rc}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-slate-400">PO</div>
                  <div className="text-sm font-mono text-blue-400">{load.po}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Schedule
            </h3>
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Pickup Date</span>
                <span className="text-white font-medium">{load.pickupDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Pickup Window</span>
                <span className="text-white font-medium">{load.pickupWindow}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Delivery Date</span>
                <span className="text-white font-medium">{load.deliveryDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Delivery Window</span>
                <span className="text-white font-medium">{load.deliveryWindow}</span>
              </div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              Revenue Breakdown
            </h3>
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Linehaul</span>
                <span className="text-white font-medium">${load.linehaul.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Fuel Surcharge</span>
                <span className="text-white font-medium">${load.fuel.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Detention</span>
                <span className="text-white font-medium">${load.detention.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Accessorial</span>
                <span className="text-white font-medium">${load.accessorial.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Lumper</span>
                <span className="text-white font-medium">${load.lumper.toLocaleString()}</span>
              </div>
              <div className="pt-3 border-t border-slate-700 flex justify-between items-center">
                <span className="text-amber-400 font-semibold">Total Revenue</span>
                <span className="text-amber-400 font-bold text-lg">${load.revenue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Seal & Proof */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-purple-400" />
              Seal & Proof Status
            </h3>
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Pickup Seal</span>
                <span className="text-white font-medium font-mono">{load.sealPickup}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Delivery Seal</span>
                <span className="text-white font-medium font-mono">{load.sealDelivery}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Seal Status</span>
                {getSealStatusBadge(load.sealStatus)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Proof Status</span>
                {getProofStatusBadge(load.proofStatus)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">POD Status</span>
                {getPodStatusBadge(load.podStatus)}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Settlement Hold</span>
                {getSettlementHoldBadge(load.settlementHold)}
              </div>
            </div>
          </div>

          {/* Team */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              Team
            </h3>
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Truck</span>
                <span className="text-white font-medium">{load.truck}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Trailer</span>
                <span className="text-white font-medium">{load.trailer}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Driver</span>
                <span className="text-white font-medium">{load.driver}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Dispatcher</span>
                <span className="text-white font-medium">{load.dispatcher}</span>
              </div>
            </div>
          </div>

          {/* Broker Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-slate-400" />
              Broker Information
            </h3>
            <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Broker</span>
                <span className="text-white font-medium">{load.broker}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">MC Number</span>
                <span className="text-white font-medium">{load.brokerMC}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
