import { supabase } from '@/core/database/supabase';
import { WeatherService, WeatherData } from '@/domains/weather/services/weatherService';
import { LocationCoordinates, calculateDistance } from '@/domains/locations/hooks/useLocation';

export interface VenueFacility {
  id: string;
  name: string;
  type: 'court' | 'field' | 'pool' | 'track' | 'gym' | 'other';
  isAvailable: boolean;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface VenueRating {
  id: string;
  venue_id: string;
  user_id: string;
  rating: number; // 1-5 stars
  review?: string;
  facilities_rating: number;
  cleanliness_rating: number;
  accessibility_rating: number;
  parking_rating: number;
  created_at: string;
  user_name?: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  venue_type: 'indoor' | 'outdoor' | 'mixed';
  supported_sports: string[];
  facilities: VenueFacility[];
  average_rating: number;
  total_ratings: number;
  ratings: VenueRating[];
  amenities: string[];
  operating_hours: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
  contact_info?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  pricing?: {
    hourly_rate?: number;
    daily_rate?: number;
    membership_required?: boolean;
  };
  images?: string[];
  weather_dependent: boolean;
  created_at: string;
  updated_at: string;
}

export interface VenueRecommendation {
  venue: Venue;
  score: number;
  reasons: string[];
  distance_km: number;
  weather_suitability: 'excellent' | 'good' | 'fair' | 'poor';
  availability_score: number;
}

export interface VenueFilter {
  sport?: string;
  venue_type?: 'indoor' | 'outdoor' | 'mixed';
  max_distance_km?: number;
  min_rating?: number;
  amenities?: string[];
  price_range?: 'free' | 'low' | 'medium' | 'high';
  weather_dependent?: boolean;
}

export class VenueService {
  // Sport-specific venue requirements
  private static readonly SPORT_VENUE_REQUIREMENTS = {
    basketball: {
      preferred_types: ['indoor', 'mixed'],
      required_facilities: ['court'],
      weather_dependent: false,
      min_space_sqft: 4700
    },
    soccer: {
      preferred_types: ['outdoor', 'mixed'],
      required_facilities: ['field'],
      weather_dependent: true,
      min_space_sqft: 57600
    },
    tennis: {
      preferred_types: ['outdoor', 'indoor', 'mixed'],
      required_facilities: ['court'],
      weather_dependent: true,
      min_space_sqft: 2808
    },
    volleyball: {
      preferred_types: ['indoor', 'outdoor', 'mixed'],
      required_facilities: ['court'],
      weather_dependent: false,
      min_space_sqft: 1800
    },
    swimming: {
      preferred_types: ['indoor', 'outdoor', 'mixed'],
      required_facilities: ['pool'],
      weather_dependent: false,
      min_space_sqft: 1250
    },
    baseball: {
      preferred_types: ['outdoor'],
      required_facilities: ['field'],
      weather_dependent: true,
      min_space_sqft: 90000
    },
    football: {
      preferred_types: ['outdoor'],
      required_facilities: ['field'],
      weather_dependent: true,
      min_space_sqft: 57600
    },
    golf: {
      preferred_types: ['outdoor'],
      required_facilities: ['course'],
      weather_dependent: true,
      min_space_sqft: 4000000
    }
  };

  // Get sport-specific venue recommendations
  static async getVenueRecommendations(
    location: LocationCoordinates,
    sport: string,
    gameDateTime: Date,
    filters: VenueFilter = {}
  ): Promise<VenueRecommendation[]> {
    try {
      console.log(`🏟️ Getting venue recommendations for ${sport} near ${location.latitude}, ${location.longitude}`);
      
      // Get weather data for the game time
      const weather = await WeatherService.getGameWeather(
        location.latitude,
        location.longitude,
        gameDateTime
      );

      // Get venues from database
      const venues = await this.getVenuesNearLocation(location, filters.max_distance_km || 25);
      
      // Filter and score venues based on sport requirements and weather
      const recommendations = await Promise.all(
        venues.map(venue => this.scoreVenueForSport(venue, sport, location, weather, gameDateTime))
      );

      // Sort by score and return top recommendations
      return recommendations
        .filter(rec => rec.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
        
    } catch (error) {
      console.error('Error getting venue recommendations:', error);
      return [];
    }
  }

  // Get venues near a location
  static async getVenuesNearLocation(
    location: LocationCoordinates,
    radiusKm: number = 25
  ): Promise<Venue[]> {
    try {
      // Calculate bounding box for efficient querying
      const latOffset = radiusKm / 111; // Approximate: 1 degree lat = 111 km
      const lonOffset = radiusKm / (111 * Math.cos(location.latitude * Math.PI / 180));

      const { data, error } = await supabase
        .from('venues')
        .select(`
          *,
          venue_ratings(
            id, rating, review, facilities_rating, cleanliness_rating,
            accessibility_rating, parking_rating, created_at,
            user:users(full_name)
          )
        `)
        .gte('latitude', location.latitude - latOffset)
        .lte('latitude', location.latitude + latOffset)
        .gte('longitude', location.longitude - lonOffset)
        .lte('longitude', location.longitude + lonOffset)
        .order('average_rating', { ascending: false });

      if (error) throw error;

      return (data || []).map(venue => ({
        ...venue,
        ratings: venue.venue_ratings?.map((rating: any) => ({
          ...rating,
          user_name: rating.user?.full_name
        })) || []
      }));
    } catch (error) {
      console.error('Error fetching venues:', error);
      return [];
    }
  }

  // Score a venue for a specific sport
  private static async scoreVenueForSport(
    venue: Venue,
    sport: string,
    userLocation: LocationCoordinates,
    weather: WeatherData | null,
    gameDateTime: Date
  ): Promise<VenueRecommendation> {
    const sportReqs = this.SPORT_VENUE_REQUIREMENTS[sport.toLowerCase() as keyof typeof this.SPORT_VENUE_REQUIREMENTS];
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      venue.latitude,
      venue.longitude
    );

    let score = 100; // Base score
    const reasons: string[] = [];

    // Distance scoring (closer is better)
    if (distance <= 5) {
      score += 20;
      reasons.push('Very close location');
    } else if (distance <= 15) {
      score += 10;
      reasons.push('Convenient location');
    } else if (distance > 25) {
      score -= 20;
    }

    // Sport compatibility scoring
    if (venue.supported_sports.includes(sport.toLowerCase())) {
      score += 30;
      reasons.push(`Designed for ${sport}`);
    }

    // Venue type preference based on sport
    if (sportReqs) {
      const typePreference = sportReqs.preferred_types.indexOf(venue.venue_type);
      if (typePreference === 0) {
        score += 25; // Perfect match
        reasons.push('Ideal venue type');
      } else if (typePreference > 0) {
        score += 15; // Good match
        reasons.push('Suitable venue type');
      }
    }

    // Weather-based scoring
    let weatherSuitability: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
    if (weather) {
      if (venue.venue_type === 'indoor') {
        score += 15;
        weatherSuitability = 'excellent';
        reasons.push('Weather-protected indoor venue');
      } else if (venue.venue_type === 'outdoor') {
        if (weather.isOutdoorFriendly) {
          score += 10;
          weatherSuitability = 'excellent';
          reasons.push('Great weather for outdoor play');
        } else {
          score -= 25;
          weatherSuitability = 'poor';
          reasons.push('Weather may not be suitable');
        }
      } else { // mixed
        score += 5;
        weatherSuitability = weather.isOutdoorFriendly ? 'good' : 'fair';
        reasons.push('Flexible indoor/outdoor options');
      }
    }

    // Rating scoring
    if (venue.average_rating >= 4.5) {
      score += 20;
      reasons.push('Excellent user ratings');
    } else if (venue.average_rating >= 4.0) {
      score += 15;
      reasons.push('Great user ratings');
    } else if (venue.average_rating >= 3.5) {
      score += 10;
      reasons.push('Good user ratings');
    } else if (venue.average_rating < 3.0) {
      score -= 15;
    }

    // Facility quality scoring
    const avgFacilityRating = venue.ratings.length > 0
      ? venue.ratings.reduce((sum, r) => sum + r.facilities_rating, 0) / venue.ratings.length
      : 3;
    
    if (avgFacilityRating >= 4.5) {
      score += 15;
      reasons.push('Excellent facilities');
    } else if (avgFacilityRating >= 4.0) {
      score += 10;
      reasons.push('Great facilities');
    }

    // Availability scoring (simplified - could be enhanced with real-time data)
    const availability_score = this.calculateAvailabilityScore(venue, gameDateTime);
    score += availability_score;
    if (availability_score > 15) {
      reasons.push('High availability');
    }

    // Ensure minimum score
    score = Math.max(0, score);

    return {
      venue,
      score,
      reasons,
      distance_km: distance,
      weather_suitability: weatherSuitability,
      availability_score
    };
  }

  // Calculate availability score based on operating hours and bookings
  private static calculateAvailabilityScore(venue: Venue, gameDateTime: Date): number {
    const dayOfWeek = gameDateTime.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const gameHour = gameDateTime.getHours();
    
    const hours = venue.operating_hours[dayOfWeek];
    if (!hours || hours.closed) {
      return -50; // Venue is closed
    }

    const openHour = parseInt(hours.open.split(':')[0]);
    const closeHour = parseInt(hours.close.split(':')[0]);
    
    if (gameHour < openHour || gameHour > closeHour) {
      return -30; // Outside operating hours
    }

    // Peak hours penalty (assuming 6-8 PM is peak)
    if (gameHour >= 18 && gameHour <= 20) {
      return 5; // Lower availability during peak
    }

    return 20; // Good availability
  }

  // Add a new venue rating
  static async addVenueRating(
    venueId: string,
    rating: number,
    facilitiesRating: number,
    cleanlinessRating: number,
    accessibilityRating: number,
    parkingRating: number,
    review?: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if user has already rated this venue
    const { data: existingRating } = await supabase
      .from('venue_ratings')
      .select('id')
      .eq('venue_id', venueId)
      .eq('user_id', user.id)
      .single();

    if (existingRating) {
      // Update existing rating
      const { error } = await supabase
        .from('venue_ratings')
        .update({
          rating,
          facilities_rating: facilitiesRating,
          cleanliness_rating: cleanlinessRating,
          accessibility_rating: accessibilityRating,
          parking_rating: parkingRating,
          review
        })
        .eq('id', existingRating.id);

      if (error) throw error;
    } else {
      // Create new rating
      const { error } = await supabase
        .from('venue_ratings')
        .insert({
          venue_id: venueId,
          user_id: user.id,
          rating,
          facilities_rating: facilitiesRating,
          cleanliness_rating: cleanlinessRating,
          accessibility_rating: accessibilityRating,
          parking_rating: parkingRating,
          review
        });

      if (error) throw error;
    }

    // Update venue's average rating
    await this.updateVenueAverageRating(venueId);
  }

  // Update venue's average rating
  private static async updateVenueAverageRating(venueId: string): Promise<void> {
    const { data: ratings, error } = await supabase
      .from('venue_ratings')
      .select('rating')
      .eq('venue_id', venueId);

    if (error) throw error;

    if (ratings && ratings.length > 0) {
      const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      
      await supabase
        .from('venues')
        .update({
          average_rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
          total_ratings: ratings.length
        })
        .eq('id', venueId);
    }
  }

  // Get weather-based venue suggestions
  static async getWeatherBasedSuggestions(
    location: LocationCoordinates,
    sport: string,
    gameDateTime: Date
  ): Promise<{ indoor: Venue[]; outdoor: Venue[]; weather: WeatherData | null }> {
    const weather = await WeatherService.getGameWeather(
      location.latitude,
      location.longitude,
      gameDateTime
    );

    const allVenues = await this.getVenuesNearLocation(location);
    
    const indoorVenues = allVenues
      .filter(v => v.venue_type === 'indoor' || v.venue_type === 'mixed')
      .filter(v => v.supported_sports.includes(sport.toLowerCase()))
      .sort((a, b) => b.average_rating - a.average_rating)
      .slice(0, 5);

    const outdoorVenues = allVenues
      .filter(v => v.venue_type === 'outdoor' || v.venue_type === 'mixed')
      .filter(v => v.supported_sports.includes(sport.toLowerCase()))
      .sort((a, b) => b.average_rating - a.average_rating)
      .slice(0, 5);

    return {
      indoor: indoorVenues,
      outdoor: outdoorVenues,
      weather
    };
  }

  // Search venues by name or location
  static async searchVenues(
    query: string,
    location?: LocationCoordinates,
    filters: VenueFilter = {}
  ): Promise<Venue[]> {
    let queryBuilder = supabase
      .from('venues')
      .select(`
        *,
        venue_ratings(
          id, rating, review, facilities_rating, cleanliness_rating,
          accessibility_rating, parking_rating, created_at,
          user:users(full_name)
        )
      `);

    // Text search
    if (query.trim()) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,address.ilike.%${query}%`);
    }

    // Apply filters
    if (filters.venue_type) {
      queryBuilder = queryBuilder.eq('venue_type', filters.venue_type);
    }

    if (filters.sport) {
      queryBuilder = queryBuilder.contains('supported_sports', [filters.sport.toLowerCase()]);
    }

    if (filters.min_rating) {
      queryBuilder = queryBuilder.gte('average_rating', filters.min_rating);
    }

    const { data, error } = await queryBuilder
      .order('average_rating', { ascending: false })
      .limit(20);

    if (error) throw error;

    let venues = (data || []).map(venue => ({
      ...venue,
      ratings: venue.venue_ratings?.map((rating: any) => ({
        ...rating,
        user_name: rating.user?.full_name
      })) || []
    }));

    // Filter by distance if location provided
    if (location && filters.max_distance_km) {
      venues = venues.filter(venue => {
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          venue.latitude,
          venue.longitude
        );
        return distance <= filters.max_distance_km!;
      });
    }

    return venues;
  }

  // Get popular venues for a sport
  static async getPopularVenues(sport: string, limit: number = 10): Promise<Venue[]> {
    const { data, error } = await supabase
      .from('venues')
      .select(`
        *,
        venue_ratings(
          id, rating, review, facilities_rating, cleanliness_rating,
          accessibility_rating, parking_rating, created_at,
          user:users(full_name)
        )
      `)
      .contains('supported_sports', [sport.toLowerCase()])
      .gte('total_ratings', 5) // At least 5 ratings
      .order('average_rating', { ascending: false })
      .order('total_ratings', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(venue => ({
      ...venue,
      ratings: venue.venue_ratings?.map((rating: any) => ({
        ...rating,
        user_name: rating.user?.full_name
      })) || []
    }));
  }
}
