"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Package, 
  MapPin, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Truck,
  User,
  Thermometer,
  Clock,
  Activity,
  Filter,
  Eye,
  AlertOctagon,
  Radio,
  Link2
} from "lucide-react";
import { getV3OperationalData, isV3DataAvailable } from "@/lib/v3-operational-loader";
import { formatDisplayDate } from "@/lib/date-utils";
import type { RfidEvent } from "@/lib/v3-operational-types";

interface RfidProofChainV4Props {
  loadId?: string;
  driverId?: string;
  assetId?: string;
  showAllEvents?: boolean;
  maxEvents?: number;
}

export function RfidProofChainV4({ 
  loadId, 
  driverId, 
  assetId, 
  showAllEvents = false, 
  maxEvents = 10 
}: RfidProofChainV4Props) {
  const [rfidEvents, setRfidEvents] = useState<RfidEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  // Load V4 workbook data
  useEffect(() => {
    loadWorkbookData();
  }, []);

  const loadWorkbookData = async () => {
    try {
      setLoading(true);
      setUsingFallback(false);
      
      const v3Available = await isV3DataAvailable();
      
      if (v3Available) {
        console.log('📊 Loading V4 RFID events data...');
        const v3Data = await getV3OperationalData();
        
        setRfidEvents(v3Data.rfidEvents);
        
        console.log(`✅ Loaded ${v3Data.rfidEvents.length} RFID Events from V4 workbook`);
      } else {
        console.warn('⚠️ V4 workbook not available, using fallback data');
        await loadFallbackData();
      }
    } catch (err) {
      console.error('❌ Failed to load V4 RFID events data:', err);
      setError(err instanceof Error ? err.message : "Failed to load RFID events data");
      await loadFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackData = async () => {
    console.warn('🔄 Using fallback RFID events data - V4 workbook not available');
    setUsingFallback(true);
    setRfidEvents([]);
  };

  // Filter events based on props
  const filteredEvents = useMemo(() => {
    let filtered = rfidEvents;
    
    if (loadId) {
      filtered = filtered.filter(e => e.loadId === loadId);
    }
    
    if (driverId) {
      filtered = filtered.filter(e => e.driverId === driverId);
    }
    
    if (assetId) {
      filtered = filtered.filter(e => e.assetId === assetId);
    }
    
    // Sort by timestamp (most recent first)
    filtered.sort((a, b) => new Date(b.scanTimestamp).getTime() - new Date(a.scanTimestamp).getTime());
    
    if (!showAllEvents) {
      filtered = filtered.slice(0, maxEvents);
    }
    
    return filtered;
  }, [rfidEvents, loadId, driverId, assetId, showAllEvents, maxEvents]);

  // Group events by load for proof chain visualization
  const eventsByLoad = useMemo(() => {
    const grouped = filteredEvents.reduce((acc, event) => {
      if (!acc[event.loadId]) {
        acc[event.loadId] = [];
      }
      acc[event.loadId].push(event);
      return acc;
    }, {} as Record<string, RfidEvent[]>);
    
    // Sort events within each load by timestamp
    Object.keys(grouped).forEach(loadId => {
      grouped[loadId].sort((a, b) => new Date(a.scanTimestamp).getTime() - new Date(b.scanTimestamp).getTime());
    });
    
    return grouped;
  }, [filteredEvents]);

  // Get event type icon
  const getEventTypeIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'pickup':
        return <Package className="w-4 h-4 text-green-400" />;
      case 'delivery':
        return <CheckCircle className="w-4 h-4 text-blue-400" />;
      case 'in-transit':
        return <Truck className="w-4 h-4 text-yellow-400" />;
      case 'geofence':
        return <MapPin className="w-4 h-4 text-purple-400" />;
      case 'yard':
        return <Activity className="w-4 h-4 text-orange-400" />;
      default:
        return <Radio className="w-4 h-4 text-slate-400" />;
    }
  };

  // Get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'valid':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'warning':
      case 'mismatch':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'error':
      case 'exception':
      case 'invalid':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // Get impact badge color
  const getImpactBadgeClass = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'blocked':
      case 'hold':
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'delayed':
      case 'at risk':
      case 'warning':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'review required':
      case 'attention':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'none':
      case 'minimal':
      case 'valid':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading RFID proof-chain data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 font-medium mb-2">Failed to load RFID events</p>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (filteredEvents.length === 0) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
        <div className="text-center">
          <Radio className="w-8 h-8 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400">No RFID events found</p>
          {usingFallback && (
            <p className="text-slate-500 text-sm mt-2">V4 workbook data not available</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-400" />
            RFID Proof Chain
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Real-time scan events, seal verification, and proof of custody
          </p>
        </div>
        {usingFallback && (
          <div className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
            Fallback Data
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-green-400" />
            <span className="text-slate-400 text-xs">Total Scans</span>
          </div>
          <div className="text-xl font-bold text-white">{filteredEvents.length}</div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-slate-400 text-xs">Exceptions</span>
          </div>
          <div className="text-xl font-bold text-white">
            {filteredEvents.filter(e => e.exceptionType && e.exceptionType !== 'None').length}
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-slate-400 text-xs">Seal Mismatches</span>
          </div>
          <div className="text-xl font-bold text-white">
            {filteredEvents.filter(e => e.sealMatchStatus === 'Mismatch').length}
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertOctagon className="w-4 h-4 text-red-400" />
            <span className="text-slate-400 text-xs">Manager Action</span>
          </div>
          <div className="text-xl font-bold text-white">
            {filteredEvents.filter(e => e.managerActionRequired).length}
          </div>
        </div>
      </div>

      {/* Proof Chain Events */}
      <div className="space-y-4">
        {Object.entries(eventsByLoad).map(([loadId, events]) => (
          <div key={loadId} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Link2 className="w-4 h-4 text-blue-400" />
                <span className="text-white font-medium">Load: {loadId}</span>
                <span className="text-slate-400 text-sm">{events.length} events</span>
              </div>
              {events.some(e => e.managerActionRequired) && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                  Manager Action Required
                </span>
              )}
            </div>

            {/* Event Timeline */}
            <div className="space-y-3">
              {events.map((event, index) => (
                <div key={event.rfidEventId} className="relative">
                  {/* Timeline Line */}
                  {index < events.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-full bg-slate-700"></div>
                  )}

                  <div className="flex gap-4">
                    {/* Event Icon */}
                    <div className="flex-shrink-0 w-12 h-12 bg-slate-900 border border-slate-600 rounded-full flex items-center justify-center">
                      {getEventTypeIcon(event.eventType)}
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-white font-medium">{event.eventType}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(event.scanStatus)}`}>
                            {event.scanStatus}
                          </span>
                          {event.exceptionType && event.exceptionType !== 'None' && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                              {event.exceptionType}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-sm">
                          {formatDisplayDate(event.scanTimestamp)}
                        </div>
                      </div>

                      {/* Event Information Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                        <div>
                          <div className="text-slate-400 text-xs mb-1">Location</div>
                          <div className="text-white text-sm">{event.scanLocation}</div>
                          {event.expectedLocation && event.expectedLocation !== event.scanLocation && (
                            <div className="text-slate-400 text-xs">Expected: {event.expectedLocation}</div>
                          )}
                        </div>
                        
                        <div>
                          <div className="text-slate-400 text-xs mb-1">Assets</div>
                          <div className="text-white text-sm">
                            <div>Asset: {event.assetId}</div>
                            <div>Trailer: {event.trailerId}</div>
                            {event.cargoTagId && <div>Cargo: {event.cargoTagId}</div>}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-slate-400 text-xs mb-1">Driver</div>
                          <div className="text-white text-sm">{event.driverId}</div>
                          <div className="text-slate-400 text-xs">Reader: {event.readerSource}</div>
                        </div>
                      </div>

                      {/* Status Indicators */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(event.sealMatchStatus)}`}>
                          Seal: {event.sealMatchStatus}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeClass(event.geoFenceStatus)}`}>
                          GeoFence: {event.geoFenceStatus}
                        </span>
                        {event.temperatureReading && event.temperatureReading > 0 && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            <Thermometer className="w-3 h-3" />
                            {event.temperatureReading}°F
                          </div>
                        )}
                      </div>

                      {/* Impact Analysis */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <div className="text-slate-400 text-xs mb-1">Proof Impact</div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getImpactBadgeClass(event.proofImpact)}`}>
                            {event.proofImpact}
                          </span>
                        </div>
                        
                        <div>
                          <div className="text-slate-400 text-xs mb-1">Dispatch Impact</div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getImpactBadgeClass(event.dispatchImpact)}`}>
                            {event.dispatchImpact}
                          </span>
                        </div>
                        
                        <div>
                          <div className="text-slate-400 text-xs mb-1">Settlement Impact</div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getImpactBadgeClass(event.settlementImpact)}`}>
                            {event.settlementImpact}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
