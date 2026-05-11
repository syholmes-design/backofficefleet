/**
 * Mapbox Directions API integration for proper road routing
 * Uses Mapbox Directions API to get realistic route geometries instead of straight lines
 */

export interface MapboxRouteGeometry {
  type: 'LineString';
  coordinates: [number, number][];
}

export interface MapboxDirectionsResponse {
  routes: Array<{
    geometry: MapboxRouteGeometry;
    distance: number;
    duration: number;
  }>;
  code: string;
}

/**
 * Fetch route geometry from Mapbox Directions API
 * @param origin - [longitude, latitude] for origin point
 * @param destination - [longitude, latitude] for destination point  
 * @param accessToken - Mapbox access token
 * @returns Promise resolving to route geometry coordinates
 */
export async function fetchMapboxDirections(
  origin: [number, number],
  destination: [number, number],
  accessToken: string
): Promise<[number, number][]> {
  try {
    const url = new URL('https://api.mapbox.com/directions/v5/mapbox/driving');
    url.searchParams.set('access_token', accessToken);
    url.searchParams.set('coordinates', `${origin[0]},${origin[1]};${destination[0]},${destination[1]}`);
    url.searchParams.set('geometries', 'geojson');
    url.searchParams.set('overview', 'full');
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Mapbox Directions API error: ${response.status} ${response.statusText}`);
    }
    
    const data: MapboxDirectionsResponse = await response.json();
    
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error(`Mapbox Directions API returned no routes: ${data.code}`);
    }
    
    // Return the first route's geometry coordinates
    return data.routes[0].geometry.coordinates;
  } catch (error) {
    console.warn('Mapbox Directions API failed, falling back to straight line:', error);
    // Fallback to straight line
    return [origin, destination];
  }
}

/**
 * Create a road-like fallback polyline using intermediate waypoints
 * This creates a more realistic path than a simple straight line
 * @param origin - [longitude, latitude] for origin point
 * @param destination - [longitude, latitude] for destination point
 * @returns Array of coordinates forming a road-like path
 */
export function createRoadLikeFallback(
  origin: [number, number],
  destination: [number, number]
): [number, number][] {
  const [originLng, originLat] = origin;
  const [destLng, destLat] = destination;
  
  // Calculate distance to determine complexity of fallback path
  const distance = Math.sqrt(
    Math.pow(destLng - originLng, 2) + Math.pow(destLat - originLat, 2)
  );
  
  // For short distances, use simple straight line
  if (distance < 0.5) {
    return [origin, destination];
  }
  
  // Create intermediate waypoints for a more realistic road-like path
  const waypoints: [number, number][] = [origin];
  
  // Add 1-3 intermediate points depending on distance
  const numIntermediate = Math.min(Math.floor(distance * 2), 3);
  
  for (let i = 1; i <= numIntermediate; i++) {
    const t = i / (numIntermediate + 1);
    
    // Add some curvature to make it look more like a road
    const baseLng = originLng + (destLng - originLng) * t;
    const baseLat = originLat + (destLat - originLat) * t;
    
    // Add slight perpendicular offset for curvature
    const perpLng = -(destLat - originLat) * 0.1;
    const perpLat = (destLng - originLng) * 0.1;
    
    const curve = Math.sin(t * Math.PI) * 0.3; // Sine wave for natural curve
    
    const waypoint: [number, number] = [
      baseLng + perpLng * curve,
      baseLat + perpLat * curve
    ];
    
    waypoints.push(waypoint);
  }
  
  waypoints.push(destination);
  return waypoints;
}

/**
 * Get route geometry with Mapbox Directions API or fallback
 * @param origin - [longitude, latitude] for origin point
 * @param destination - [longitude, latitude] for destination point
 * @param accessToken - Mapbox access token (optional)
 * @returns Promise resolving to route geometry coordinates
 */
export async function getRouteGeometry(
  origin: [number, number],
  destination: [number, number],
  accessToken?: string
): Promise<[number, number][]> {
  // If Mapbox token is available, try Directions API first
  if (accessToken) {
    try {
      return await fetchMapboxDirections(origin, destination, accessToken);
    } catch (error) {
      console.warn('Mapbox Directions API failed, using road-like fallback:', error);
    }
  }
  
  // Use road-like fallback if no token or API fails
  return createRoadLikeFallback(origin, destination);
}
