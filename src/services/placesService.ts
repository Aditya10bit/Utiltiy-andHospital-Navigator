// Google Places API service with rate limiting and caching
class PlacesService {
  private static instance: PlacesService;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between requests
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): PlacesService {
    if (!PlacesService.instance) {
      PlacesService.instance = new PlacesService();
    }
    return PlacesService.instance;
  }

  private async rateLimitedFetch(url: string): Promise<Response> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => 
        setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
    return fetch(url);
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async searchNearbyPlaces(
    latitude: number,
    longitude: number,
    type: string,
    radius: string = '5000'
  ): Promise<any> {
    const cacheKey = `nearby_${latitude}_${longitude}_${type}_${radius}`;
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${apiKey}`;
    
    const response = await this.rateLimitedFetch(url);
    const data = await response.json();
    
    if (data.status === 'OK') {
      this.setCachedData(cacheKey, data);
    }
    
    return data;
  }

  async getPlaceDetails(placeId: string): Promise<any> {
    const cacheKey = `details_${placeId}`;
    const cached = this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,opening_hours,photos,reviews,types,geometry&key=${apiKey}`;
    
    const response = await this.rateLimitedFetch(url);
    const data = await response.json();
    
    if (data.status === 'OK') {
      this.setCachedData(cacheKey, data);
    }
    
    return data;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default PlacesService;