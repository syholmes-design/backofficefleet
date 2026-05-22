"use client";

import { useState, useEffect } from "react";
import { MapPin, DollarSign, Fuel, AlertTriangle, Info } from "lucide-react";
import { LoadRouteMap } from "@/components/LoadRouteMap";
import type { LoadRouteMapModel } from "@/lib/load-route-map";
import type { LoadV2 } from "@/lib/dispatch-v2-demo-data";
import type { TomTomFuelFeedResponse } from "@/lib/tomtom-fuel-types";

interface RouteFuelIntelligenceProps {
  load: LoadV2 | null;
}

interface FuelData {
  data: TomTomFuelFeedResponse | null;
  loading: boolean;
  error: string | null;
}

export function RouteFuelIntelligence({ load }: RouteFuelIntelligenceProps) {
  const [routeMapModel, setRouteMapModel] = useState<LoadRouteMapModel | null>(null);
  const [fuelData, setFuelData] = useState<FuelData>({ data: null, loading: false, error: null });

  // Build route map model for selected load
  useEffect(() => {
    if (!load) return;

    const buildRouteModel = async () => {
      try {
        // Import dynamically to avoid SSR issues with mapbox
        const { buildLoadRouteMapModel } = await import("@/lib/load-route-map");
        const { getBofData } = await import("@/lib/load-bof-data");
        
        const data = getBofData();
        // Convert LoadV2 to expected format for map model
        const mockLoad = {
          id: load.id,
          number: load.id,
          origin: load.origin,
          destination: load.destination,
          originFull: load.pickupAddr || load.origin,
          destFull: load.deliveryAddr || load.destination,
          status: load.status,
          revenue: load.revenue,
          dispatchExceptionFlag: false,
          sealStatus: load.sealStatus || "OK",
          podStatus: load.podStatus || "PENDING",
          pickupSeal: load.sealPickup,
          deliverySeal: load.sealDelivery,
          customer: load.customer,
          driver: load.driver,
          driverId: load.driverId,
          truck: load.truck,
          trailer: load.trailer,
          miles: load.miles,
          commodity: load.commodity,
          weight: load.weight,
          pickupDate: load.pickupDate,
          deliveryDate: load.deliveryDate,
          pickupWindow: load.pickupWindow,
          deliveryWindow: load.deliveryWindow,
        };

        const model = buildLoadRouteMapModel(data, mockLoad.id);
        setRouteMapModel(model);
      } catch (error) {
        console.warn('Failed to build route map model:', error);
      }
    };

    buildRouteModel();
  }, [load]);

  // Fetch fuel data for selected load
  useEffect(() => {
    if (!load) return;

    const fetchFuelData = async () => {
      setFuelData({ data: null, loading: true, error: null });
      
      try {
        const response = await fetch(`/api/fuel/tomtom/route?loadId=${encodeURIComponent(load.id)}`);
        if (!response.ok) {
          throw new Error(`Fuel API error: ${response.status}`);
        }
        
        const data = await response.json();
        setFuelData({ data, loading: false, error: null });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch fuel data';
        setFuelData({ data: null, loading: false, error: errorMessage });
      }
    };

    fetchFuelData();
  }, [load]);

  if (!load) {
    return (
      <div className="mx-6 mb-6 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">
            Route + Fuel Intelligence
          </h3>
        </div>
        <div className="text-center py-8">
          <Info className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400">Select a load to view route and fuel information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-6 mb-6 space-y-6">
      {/* Route Map Section */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">
            Route Map
          </h3>
        </div>
        
        {routeMapModel ? (
          <LoadRouteMap model={routeMapModel} />
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p className="text-slate-400">Loading route map...</p>
          </div>
        )}
      </div>

      {/* Fuel Intelligence Section */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Fuel className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">
            Fuel Intelligence
          </h3>
        </div>

        {fuelData.loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-3"></div>
            <p className="text-slate-400">Loading fuel prices...</p>
          </div>
        )}

        {fuelData.error && (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <p className="text-amber-400 font-medium mb-2">Fuel Price Unavailable</p>
            <p className="text-slate-400 text-sm">{fuelData.error}</p>
            <p className="text-slate-500 text-xs mt-2">TomTom API key may not be configured</p>
          </div>
        )}

        {fuelData.data && (
          <div className="space-y-4">
            {/* Fuel Status */}
            <div className={`px-4 py-3 rounded-lg border ${
              fuelData.data.live 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-amber-500/10 border-amber-500/30'
            }`}>
              <div className="flex items-center gap-3">
                {fuelData.data.live ? (
                  <Fuel className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                )}
                <div>
                  <p className={`font-medium ${
                    fuelData.data.live ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {fuelData.data.live ? 'Live Fuel Prices' : 'Demo Fuel Prices'}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {fuelData.data.reason || 'Using baseline fuel prices'}
                  </p>
                </div>
              </div>
            </div>

            {/* Route Context */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-sm mb-1">Origin</p>
                <p className="text-white font-medium">{fuelData.data.routeContext.origin}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Destination</p>
                <p className="text-white font-medium">{fuelData.data.routeContext.destination}</p>
              </div>
            </div>

            {/* Fuel Summary */}
            {fuelData.data.summary && (
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Fuel Cost Summary
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Estimated Gallons</p>
                    <p className="text-white font-medium">
                      {fuelData.data.summary.estimatedTripGallons?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Trip Savings</p>
                    <p className="text-emerald-400 font-medium">
                      ${fuelData.data.summary.estimatedTripSavingsUsd?.toLocaleString() || '0'}
                    </p>
                  </div>
                  {fuelData.data.summary.baselineAveragePerGal && (
                    <div>
                      <p className="text-slate-400">Avg Diesel Price</p>
                      <p className="text-white font-medium">
                        ${fuelData.data.summary.baselineAveragePerGal.toFixed(3)}/gal
                      </p>
                    </div>
                  )}
                  {fuelData.data.summary.savingsPerGalVsBaseline !== undefined && (
                    <div>
                      <p className="text-slate-400">Savings Per Gallon</p>
                      <p className="text-emerald-400 font-medium">
                        ${fuelData.data.summary.savingsPerGalVsBaseline.toFixed(3)}/gal
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stations */}
            {fuelData.data.stations.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-3">Nearby Fuel Stations</h4>
                <div className="space-y-2">
                  {fuelData.data.stations.slice(0, 3).map((station) => (
                    <div key={station.stationId} className="bg-slate-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{station.name}</p>
                          <p className="text-slate-400 text-sm">{station.address}</p>
                          <p className="text-slate-500 text-xs">
                            {station.distanceMiles} miles · {station.etaMinutes} min
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-400 font-medium">
                            ${station.dieselPricePerGal.toFixed(3)}
                          </p>
                          <p className="text-slate-500 text-xs">per gallon</p>
                          {station.isBofNetwork && (
                            <p className="text-blue-400 text-xs">BOF Network</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Note */}
            {fuelData.data.note && (
              <div className="text-xs text-slate-500 italic">
                {fuelData.data.note}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
