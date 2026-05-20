"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  MapPin, 
  Navigation, 
  Fuel, 
  Truck, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  DollarSign,
  Shield,
  Activity,
  Coffee,
  Utensils,
  Droplet,
  Map,
  TrendingUp,
  AlertCircle,
  Info,
  Star
} from "lucide-react";
import { getV3OperationalData, isV3DataAvailable } from "@/lib/v3-operational-loader";
import { formatDisplayDate } from "@/lib/date-utils";
import type { RouteIntelligence, DieselPricing, RestStopLocation } from "@/lib/v3-operational-types";

interface RouteIntelligenceV4Props {
  loadId?: string;
  driverId?: string;
  showAllData?: boolean;
}

export function RouteIntelligenceV4({ 
  loadId, 
  driverId, 
  showAllData = false 
}: RouteIntelligenceV4Props) {
  const [routeData, setRouteData] = useState<RouteIntelligence[]>([]);
  const [dieselData, setDieselData] = useState<DieselPricing[]>([]);
  const [restStopData, setRestStopData] = useState<RestStopLocation[]>([]);
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
        console.log('📊 Loading V4 route intelligence data...');
        const v3Data = await getV3OperationalData();
        
        setRouteData(v3Data.routeIntelligence);
        setDieselData(v3Data.dieselPricing);
        setRestStopData(v3Data.restStopLocations);
        
        console.log(`✅ Loaded ${v3Data.routeIntelligence.length} Routes, ${v3Data.dieselPricing.length} Diesel Prices, ${v3Data.restStopLocations.length} Rest Stops from V4 workbook`);
      } else {
        console.warn('⚠️ V4 workbook not available, using fallback data');
        await loadFallbackData();
      }
    } catch (err) {
      console.error('❌ Failed to load V4 route intelligence data:', err);
      setError(err instanceof Error ? err.message : "Failed to load route intelligence data");
      await loadFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackData = async () => {
    console.warn('🔄 Using fallback route intelligence data - V4 workbook not available');
    setUsingFallback(true);
    setRouteData([]);
    setDieselData([]);
    setRestStopData([]);
  };

  // Filter data based on props
  const filteredRouteData = useMemo(() => {
    let filtered = routeData;
    
    if (loadId) {
      filtered = filtered.filter(r => r.loadId === loadId);
    }
    
    if (driverId) {
      filtered = filtered.filter(r => r.driverId === driverId);
    }
    
    return filtered;
  }, [routeData, loadId, driverId]);

  const filteredDieselData = useMemo(() => {
    if (!showAllData && filteredRouteData.length > 0) {
      const routeIds = new Set(filteredRouteData.map((r) => r.routeId));
      const loadIds = new Set(filteredRouteData.map((r) => r.loadId));
      const routeFuelStops = filteredRouteData.flatMap(r => r.fuelStops);
      return dieselData.filter((d) => {
        if (d.routeId && routeIds.has(d.routeId)) return true;
        if (d.loadId && loadIds.has(d.loadId)) return true;
        return routeFuelStops.includes(d.location);
      });
    }
    if (!showAllData && loadId) {
      return dieselData.filter((d) => d.loadId === loadId);
    }
    return dieselData;
  }, [dieselData, filteredRouteData, loadId, showAllData]);

  const filteredRestStopData = useMemo(() => {
    if (!showAllData && filteredRouteData.length > 0) {
      const routeIds = new Set(filteredRouteData.map((r) => r.routeId));
      const loadIds = new Set(filteredRouteData.map((r) => r.loadId));
      const routeRestStops = filteredRouteData.flatMap(r => r.recommendedRestStops);
      return restStopData.filter((r) => {
        if (r.routeId && routeIds.has(r.routeId)) return true;
        if (r.loadId && loadIds.has(r.loadId)) return true;
        return routeRestStops.includes(r.location);
      });
    }
    if (!showAllData && loadId) {
      return restStopData.filter((r) => r.loadId === loadId);
    }
    return restStopData;
  }, [restStopData, filteredRouteData, loadId, showAllData]);

  // Get risk badge color
  const getRiskBadgeClass = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // Get safety rating stars
  const getSafetyRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-slate-600'
        }`}
      />
    ));
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format drive time
  const formatDriveTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading route intelligence data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 font-medium mb-2">Failed to load route intelligence</p>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Demo Mode Banner */}
      <div className="bg-blue-500/10 border border-blue-500/30 backdrop-blur-sm rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-blue-400" />
          <div>
            <p className="text-blue-400 font-medium">Workbook Demo Mode</p>
            <p className="text-blue-300 text-sm">
              Using V4 workbook data - Live TomTom/Mapbox API not required for demo rendering
            </p>
          </div>
        </div>
      </div>

      {/* Route Summary Card */}
      {filteredRouteData.length > 0 && (
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-blue-400" />
              Route Summary
            </h3>
            {usingFallback && (
              <div className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
                Fallback Data
              </div>
            )}
          </div>

          <div className="space-y-4">
            {filteredRouteData.map((route) => (
              <div key={route.routeId} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-slate-400 text-xs mb-1">Route</div>
                    <div className="text-white font-medium">{route.origin} to {route.destination}</div>
                    <div className="text-slate-400 text-sm">{route.loadId} - {route.driverId}</div>
                  </div>
                  
                  <div>
                    <div className="text-slate-400 text-xs mb-1">Distance & Time</div>
                    <div className="text-white font-medium">{route.mileage.toLocaleString()} miles</div>
                    <div className="text-slate-400 text-sm">{formatDriveTime(route.estimatedDriveTime)}</div>
                  </div>
                  
                  <div>
                    <div className="text-slate-400 text-xs mb-1">Risk Assessment</div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskBadgeClass(route.routeRisk)}`}>
                        {route.routeRisk} Risk
                      </span>
                    </div>
                    <div className="text-slate-400 text-sm">
                      {route.weatherRisk && <div>Weather: {route.weatherRisk}</div>}
                      {route.trafficRisk && <div>Traffic: {route.trafficRisk}</div>}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-slate-400 text-xs mb-1">HOS Planning</div>
                    <div className="text-white text-sm">{route.hosPlanningNotes}</div>
                    {route.managerActionRequired && (
                      <div className="mt-1">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                          Manager Action Required
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-700 rounded p-3">
                  <div className="text-slate-400 text-xs mb-1">Route Summary</div>
                  <div className="text-slate-300 text-sm">{route.routeSummary}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fuel Planning Card */}
      {filteredDieselData.length > 0 && (
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Fuel className="w-5 h-5 text-green-400" />
              Fuel Planning
            </h3>
            <div className="text-green-400 font-medium">
              {filteredDieselData.length} fuel stops
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDieselData.map((diesel) => (
              <div key={diesel.pricingId} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-white font-medium">{diesel.location}</div>
                    <div className="text-slate-400 text-sm">Stop {diesel.routePosition}</div>
                  </div>
                  {diesel.preferredStop && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                      Preferred
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">Price:</span>
                    <span className="text-white font-medium">{formatCurrency(diesel.dieselPrice)}/gal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">Est. Gallons:</span>
                    <span className="text-white">{diesel.estimatedGallons}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">Est. Cost:</span>
                    <span className="text-white font-medium">{formatCurrency(diesel.estimatedFuelCost)}</span>
                  </div>
                  {diesel.savingsOpportunity > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">Savings:</span>
                      <span className="text-green-400 font-medium">{formatCurrency(diesel.savingsOpportunity)}</span>
                    </div>
                  )}
                </div>

                {/* Amenities */}
                {diesel.amenities.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="text-slate-400 text-xs mb-2">Amenities</div>
                    <div className="flex flex-wrap gap-1">
                      {diesel.amenities.map((amenity, index) => (
                        <span key={index} className="px-2 py-1 rounded-full text-xs bg-slate-700/50 text-slate-300">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-3 text-xs text-slate-500">
                  Updated: {formatDisplayDate(diesel.priceTimestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rest/HOS Planning Card */}
      {filteredRestStopData.length > 0 && (
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Coffee className="w-5 h-5 text-orange-400" />
              Rest & HOS Planning
            </h3>
            <div className="text-orange-400 font-medium">
              {filteredRestStopData.length} rest stops
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRestStopData.map((restStop) => (
              <div key={restStop.stopId} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-white font-medium">{restStop.location}</div>
                    <div className="text-slate-400 text-sm">{restStop.distanceFromRoute} miles from origin</div>
                  </div>
                  {restStop.recommendedForHos && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      HOS Recommended
                    </span>
                  )}
                </div>

                {/* Safety Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-slate-400 text-xs">Safety Rating:</div>
                  <div className="flex items-center gap-1">
                    {getSafetyRatingStars(restStop.safetyRating)}
                    <span className="text-slate-400 text-xs">({restStop.safetyRating}/5)</span>
                  </div>
                </div>

                {/* Parking Availability */}
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">Parking:</span>
                    <span className={`text-sm font-medium ${
                      restStop.parkingAvailable ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {restStop.parkingAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  {restStop.parkingAvailable && (
                    <div className="text-slate-400 text-sm">
                      {restStop.parkingSpaces} spaces
                    </div>
                  )}
                </div>

                {/* Amenities */}
                <div className="space-y-2">
                  <div className="text-slate-400 text-xs mb-2">Amenities</div>
                  <div className="flex flex-wrap gap-2">
                    {restStop.showerAvailable && (
                      <div className="flex items-center gap-1 text-blue-400 text-sm">
                        <Droplet className="w-3 h-3" />
                        Shower
                      </div>
                    )}
                    {restStop.foodAvailable && (
                      <div className="flex items-center gap-1 text-green-400 text-sm">
                        <Utensils className="w-3 h-3" />
                        Food
                      </div>
                    )}
                    {restStop.amenities.map((amenity, index) => (
                      <span key={index} className="px-2 py-1 rounded-full text-xs bg-slate-700/50 text-slate-300">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* HOS Recommendation */}
                {restStop.hosBreakRecommendation && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="text-slate-400 text-xs mb-1">HOS Recommendation</div>
                    <div className="text-slate-300 text-sm">{restStop.hosBreakRecommendation}</div>
                  </div>
                )}

                {restStop.managerActionRequired && (
                  <div className="mt-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      Manager Action Required
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Map Marker Data */}
      {(filteredRouteData.length > 0 || filteredDieselData.length > 0 || filteredRestStopData.length > 0) && (
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Map className="w-5 h-5 text-purple-400" />
              Map Marker Data
            </h3>
            <div className="text-purple-400 font-medium">
              {filteredRouteData.length + filteredDieselData.length + filteredRestStopData.length} locations
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
            <div className="text-slate-400 text-sm mb-2">
              Coordinate data available for mapping integration:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-white font-medium">Route Points</div>
                <div className="text-slate-400">
                  {filteredRouteData.length} routes with origin/destination coordinates
                </div>
              </div>
              <div>
                <div className="text-white font-medium">Fuel Stops</div>
                <div className="text-slate-400">
                  {filteredDieselData.length} fuel stops with GPS coordinates
                </div>
              </div>
              <div>
                <div className="text-white font-medium">Rest Stops</div>
                <div className="text-slate-400">
                  {filteredRestStopData.length} rest stops with location data
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">
              Map integration ready - coordinates available for TomTom/Mapbox API calls
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
