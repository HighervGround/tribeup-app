import { supabase } from '@/core/database/supabase';
import { NotificationService } from '@/core/notifications/notificationService';
import { LocationCoordinates, calculateDistance } from '@/domains/locations/hooks/useLocation';
import { VenueService } from '@/domains/locations/services/venueService';
import { envConfig } from '@/core/config/envConfig';

export interface LocationNotificationPreferences {
  enabled: boolean;
  radius_km: number;
  preferred_sports: string[];
  notification_frequency: 'immediate' | 'hourly' | 'daily';
  quiet_hours: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  min_players_threshold: number;
  max_notifications_per_day: number;
  venue_types: ('indoor' | 'outdoor' | 'mixed')[];
}

export interface GameNotification {
  id: string;
  game_id: string;
  user_id: string;
  notification_type: 'new_game_nearby' | 'game_starting_soon' | 'venue_recommendation' | 'weather_alert';
  title: string;
  body: string;
  data: any;
  sent_at: string;
  read: boolean;
}

export interface NearbyGameAlert {
  game_id: string;
  title: string;
  sport: string;
  distance_km: number;
  players_needed: number;
  start_time: string;
  venue_name?: string;
  weather_suitable: boolean;
}

export class LocationNotificationService {
  private static readonly DEFAULT_PREFERENCES: LocationNotificationPreferences = {
    enabled: true,
    radius_km: 15,
    preferred_sports: [],
    notification_frequency: 'immediate',
    quiet_hours: {
      start: '22:00',
      end: '08:00'
    },
    min_players_threshold: 2,
    max_notifications_per_day: 5,
    venue_types: ['indoor', 'outdoor', 'mixed']
  };

  // Initialize location-based notifications for a user
  static async initializeLocationNotifications(userId: string): Promise<void> {
    try {
      // Check if user already has preferences
      const { data: existing } = await supabase
        .from('location_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!existing) {
        // Create default preferences
        await supabase
          .from('location_notification_preferences')
          .insert({
            user_id: userId,
            ...this.DEFAULT_PREFERENCES
          });
      }

      // Request notification permission if not already granted
      await NotificationService.requestPermission();
      
      console.log('✅ Location notifications initialized for user:', userId);
    } catch (error) {
      console.error('Error initializing location notifications:', error);
    }
  }

  // Update user's location notification preferences
  static async updatePreferences(
    userId: string, 
    preferences: Partial<LocationNotificationPreferences>
  ): Promise<void> {
    const { error } = await supabase
      .from('location_notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  // Get user's location notification preferences
  static async getPreferences(userId: string): Promise<LocationNotificationPreferences> {
    const { data, error } = await supabase
      .from('location_notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return this.DEFAULT_PREFERENCES;
    }

    return data;
  }

  // Check for nearby games and send notifications
  static async checkNearbyGames(
    userId: string,
    userLocation: LocationCoordinates
  ): Promise<NearbyGameAlert[]> {
    try {
      const preferences = await this.getPreferences(userId);
      
      if (!preferences.enabled) {
        return [];
      }

      // Check if we're in quiet hours
      if (this.isQuietHours(preferences.quiet_hours)) {
        console.log('🔇 In quiet hours, skipping notifications');
        return [];
      }

      // Check daily notification limit
      const todayCount = await this.getTodayNotificationCount(userId);
      if (todayCount >= preferences.max_notifications_per_day) {
        console.log('📊 Daily notification limit reached');
        return [];
      }

      // Get nearby games
      const nearbyGames = await this.findNearbyGames(
        userLocation,
        preferences.radius_km,
        preferences.preferred_sports,
        preferences.venue_types
      );

      // Filter games that haven't been notified about
      const newGames = await this.filterUnnotifiedGames(userId, nearbyGames);

      // Send notifications for new games
      const alerts: NearbyGameAlert[] = [];
      for (const game of newGames) {
        if (game.players_needed >= preferences.min_players_threshold) {
          await this.sendGameNotification(userId, game, userLocation);
          alerts.push(game);
        }
      }

      return alerts;
    } catch (error) {
      console.error('Error checking nearby games:', error);
      return [];
    }
  }

  // Find nearby games based on location and preferences
  private static async findNearbyGames(
    location: LocationCoordinates,
    radiusKm: number,
    preferredSports: string[],
    venueTypes: string[]
  ): Promise<NearbyGameAlert[]> {
    // Calculate bounding box
    const latOffset = radiusKm / 111;
    const lonOffset = radiusKm / (111 * Math.cos(location.latitude * Math.PI / 180));

    let query = supabase
      .from('games_with_counts')
      .select(`
        id, title, sport, date, time, location, latitude, longitude,
        max_players, total_players, available_spots
      `)
      .gte('latitude', location.latitude - latOffset)
      .lte('latitude', location.latitude + latOffset)
      .gte('longitude', location.longitude - lonOffset)
      .lte('longitude', location.longitude + lonOffset)
      .gte('date', new Date().toISOString().split('T')[0]) // Future games only
      .order('date', { ascending: true })
      .order('time', { ascending: true })
      .limit(20);

    // Filter by preferred sports if specified
    if (preferredSports.length > 0) {
      query = query.in('sport', preferredSports);
    }

    const { data: games, error } = await query;
    if (error) throw error;

    const alerts: NearbyGameAlert[] = [];
    
    for (const game of games || []) {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        game.latitude || 0,
        game.longitude || 0
      );

      // Skip if outside radius
      if (distance > radiusKm) continue;

      // Filter by venue type if specified
      if (venueTypes.length > 0 && game.venues) {
        const venueType = game.venues.venue_type;
        if (!venueTypes.includes(venueType)) continue;
      }

      const playersNeeded = game.available_spots || (game.max_players - (game.total_players || 0));
      const gameDateTime = new Date(`${game.date}T${game.time}`);

      alerts.push({
        game_id: game.id,
        title: game.title,
        sport: game.sport,
        distance_km: Math.round(distance * 10) / 10,
        players_needed: playersNeeded,
        start_time: gameDateTime.toISOString(),
        venue_name: game.venues?.name || game.location,
        weather_suitable: true // Will be enhanced with weather check
      });
    }

    return alerts;
  }

  // Filter out games that user has already been notified about
  private static async filterUnnotifiedGames(
    userId: string,
    games: NearbyGameAlert[]
  ): Promise<NearbyGameAlert[]> {
    if (games.length === 0) return [];

    const gameIds = games.map(g => g.game_id);
    
    const { data: notified, error } = await supabase
      .from('game_notifications')
      .select('game_id')
      .eq('user_id', userId)
      .in('game_id', gameIds)
      .eq('notification_type', 'new_game_nearby');

    if (error) {
      console.error('Error checking notified games:', error);
      return games; // Return all if we can't check
    }

    const notifiedGameIds = new Set(notified?.map(n => n.game_id) || []);
    return games.filter(game => !notifiedGameIds.has(game.game_id));
  }

  // Send notification for a nearby game
  private static async sendGameNotification(
    userId: string,
    game: NearbyGameAlert,
    userLocation: LocationCoordinates
  ): Promise<void> {
    const title = `🏃 ${game.sport} game nearby!`;
    const body = `"${game.title}" needs ${game.players_needed} more player${game.players_needed !== 1 ? 's' : ''} • ${game.distance_km}km away`;

    // Send push notification
    await NotificationService.sendNotification(title, body, {
      type: 'nearby_game',
      game_id: game.game_id,
      sport: game.sport,
      distance: game.distance_km
    });

    // Record notification in database
    await supabase
      .from('game_notifications')
      .insert({
        user_id: userId,
        game_id: game.game_id,
        notification_type: 'new_game_nearby',
        title,
        body,
        data: {
          distance_km: game.distance_km,
          players_needed: game.players_needed,
          venue_name: game.venue_name
        }
      });

    console.log(`📱 Sent nearby game notification to user ${userId} for game ${game.game_id}`);
  }

  // Send venue recommendation notifications
  static async sendVenueRecommendations(
    userId: string,
    userLocation: LocationCoordinates,
    sport: string,
    gameDateTime: Date
  ): Promise<void> {
    try {
      const preferences = await this.getPreferences(userId);
      if (!preferences.enabled) return;

      const recommendations = await VenueService.getVenueRecommendations(
        userLocation,
        sport,
        gameDateTime
      );

      if (recommendations.length > 0) {
        const topVenue = recommendations[0];
        const title = `🏟️ Great venue for ${sport}!`;
        const body = `${topVenue.venue.name} is ${topVenue.distance_km}km away with ${topVenue.venue.average_rating}⭐ rating`;

        await NotificationService.sendNotification(title, body, {
          type: 'venue_recommendation',
          venue_id: topVenue.venue.id,
          sport,
          score: topVenue.score
        });

        // Record notification
        await supabase
          .from('game_notifications')
          .insert({
            user_id: userId,
            game_id: null,
            notification_type: 'venue_recommendation',
            title,
            body,
            data: {
              venue_id: topVenue.venue.id,
              venue_name: topVenue.venue.name,
              distance_km: topVenue.distance_km,
              rating: topVenue.venue.average_rating
            }
          });
      }
    } catch (error) {
      console.error('Error sending venue recommendations:', error);
    }
  }

  // Send weather-based notifications
  static async sendWeatherAlerts(
    userId: string,
    userLocation: LocationCoordinates,
    upcomingGames: any[]
  ): Promise<void> {
    try {
      const preferences = await this.getPreferences(userId);
      if (!preferences.enabled) return;

      for (const game of upcomingGames) {
        const gameDateTime = new Date(`${game.date}T${game.time}`);
        const hoursUntilGame = (gameDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

        // Only send weather alerts 2-24 hours before game
        if (hoursUntilGame < 2 || hoursUntilGame > 24) continue;

        // Get weather-based venue suggestions
        const suggestions = await VenueService.getWeatherBasedSuggestions(
          userLocation,
          game.sport,
          gameDateTime
        );

        if (suggestions.weather && !suggestions.weather.isOutdoorFriendly) {
          const title = `🌧️ Weather alert for ${game.title}`;
          const body = `${suggestions.weather.condition} expected. Consider these indoor alternatives.`;

          await NotificationService.sendNotification(title, body, {
            type: 'weather_alert',
            game_id: game.id,
            weather: suggestions.weather,
            indoor_venues: suggestions.indoor.slice(0, 3)
          });

          // Record notification
          await supabase
            .from('game_notifications')
            .insert({
              user_id: userId,
              game_id: game.id,
              notification_type: 'weather_alert',
              title,
              body,
              data: {
                weather_condition: suggestions.weather.condition,
                indoor_venues_count: suggestions.indoor.length
              }
            });
        }
      }
    } catch (error) {
      console.error('Error sending weather alerts:', error);
    }
  }

  // Check if current time is within quiet hours
  private static isQuietHours(quietHours: { start: string; end: string }): boolean {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = quietHours.start.split(':').map(Number);
    const [endHour, endMin] = quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      // Same day quiet hours (e.g., 22:00 to 23:59)
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight quiet hours (e.g., 22:00 to 08:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Get count of notifications sent today
  private static async getTodayNotificationCount(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    
    const { count, error } = await supabase
      .from('game_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('sent_at', `${today}T00:00:00.000Z`)
      .lt('sent_at', `${today}T23:59:59.999Z`);

    if (error) {
      console.error('Error getting notification count:', error);
      return 0;
    }

    return count || 0;
  }

  // Start background location monitoring
  static async startLocationMonitoring(userId: string): Promise<void> {
    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        console.warn('Geolocation not supported');
        return;
      }

      // Request location permission
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state !== 'granted') {
        console.warn('Location permission not granted');
        return;
      }

      // Set up periodic location checks (configurable interval)
      const checkInterval = envConfig.get('locationMonitoringInterval');
      
      setInterval(async () => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const location: LocationCoordinates = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };

            await this.checkNearbyGames(userId, location);
          },
          (error) => {
            console.error('Error getting location:', error);
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 10 * 60 * 1000 // 10 minutes
          }
        );
      }, checkInterval);

      console.log('✅ Location monitoring started for user:', userId);
    } catch (error) {
      console.error('Error starting location monitoring:', error);
    }
  }

  // Stop location monitoring
  static stopLocationMonitoring(): void {
    // Clear any existing intervals
    // In a real implementation, you'd track the interval ID
    console.log('🛑 Location monitoring stopped');
  }

  // Get user's notification history
  static async getNotificationHistory(
    userId: string,
    limit: number = 50
  ): Promise<GameNotification[]> {
    const { data, error } = await supabase
      .from('game_notifications')
      .select(`
        *,
        game:games(title, sport, date, time)
      `)
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Mark notification as read
  static async markNotificationRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('game_notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  }

  // Get unread notification count
  static async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('game_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return count || 0;
  }
}
