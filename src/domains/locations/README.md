# Locations Domain

## Purpose
The Location Services system handles geospatial features including venue discovery, distance calculations, route planning, and map visualizations.

## Domain Score: 80/100

## Responsibilities

### Venue Management
- Venue search and discovery
- Sport-specific venue recommendations
- Venue ratings and reviews
- Indoor/outdoor venue classification

### Geospatial Operations
- Distance calculations between points
- Location-based game filtering
- Proximity search for nearby games
- Coordinate validation and geocoding

### Map Integration
- Interactive map views with game markers
- Google Maps integration
- Custom map clustering for dense areas
- Route planning and directions

### Location Search
- Address autocomplete
- OpenStreetMap integration
- Location caching for performance
- Recent location history

## Key Files

### Components
- `MapView.tsx` - Base map component with markers
- `EnhancedMapView.tsx` - Advanced map with clustering and filters
- `GoogleMapView.tsx` - Google Maps specific implementation
- `InteractiveRoutePlanner.tsx` - Route planning and directions
- `VenueRatingModal.tsx` - Venue rating and review collection

### Hooks
- `useLocation.ts` - User location tracking and permissions
- `useLocationSearch.ts` - Location search with autocomplete
- `useGeolocation.ts` - Browser geolocation API wrapper

### Services
- `locationCache.ts` - Location data caching
- `locationNotificationService.ts` - Location-based notifications
- `venueService.ts` - Venue CRUD operations
- `routesApi.ts` - Route planning API integration
- `googleMapsLoader.ts` - Google Maps SDK loader

## Business Rules

### Distance Calculations
- Use Haversine formula for accurate distances
- Default search radius: 25 miles (configurable)
- Sort games by distance from user location
- Show distances in miles (US) or kilometers (metric)

### Location Privacy
- Request location permission before accessing
- Allow manual location entry if permission denied
- Cache user location locally (not server)
- Respect user privacy settings

### Venue Requirements
- All games must have valid coordinates
- Address is optional but recommended
- Venue name required for searchability
- Indoor venues skip weather checks

### Map Clustering
- Cluster markers when zoom level < 12
- Show count badge on cluster markers
- Expand cluster on click
- Individual markers when zoomed in

## Dependencies on Other Domains

### Games Domain
- Provides game locations for map display
- Receives venue data for game creation
- Uses distance for game discovery

### Weather Domain
- Provides indoor/outdoor status
- Coordinates for weather API calls

### Users Domain
- User location preferences
- Favorite venues
- Recent game locations

## Common AI Prompts

### Location Search
"Implement location search with autocomplete"
"Show recent searches in dropdown"
"Validate coordinates before saving"

### Map Features
"Display games as markers on map"
"Implement clustering for nearby games"
"Show user location with blue dot"
"Add route from user to game location"

### Distance Calculation
"Calculate distance between two points"
"Filter games within [X] miles of user"
"Sort game list by distance"

### Venue Management
"Search for venues matching sport type"
"Show venue ratings and reviews"
"Allow users to add new venues"

## API Integrations

### Google Maps JavaScript API
- Map rendering and interaction
- Place autocomplete
- Geocoding and reverse geocoding
- Directions API for routes

### OpenStreetMap (Fallback)
- Free alternative to Google Maps
- Nominatim for geocoding
- Lower rate limits

## Performance Considerations
- Cache location searches for 1 hour
- Debounce location search input (300ms)
- Lazy load Google Maps SDK
- Use map bounds for efficient queries
- Implement virtual scrolling for venue lists
- Batch geocoding requests

## Database Tables

### Primary Tables
- `venues` - Venue information and metadata
- `venue_reviews` - User ratings and reviews

### Related Tables
- `games` - Has location coordinates and venue FK
- `user_profiles` - User location preferences

## Location Data Structure
```typescript
interface Location {
  coordinates: {
    lat: number;
    lng: number;
  };
  address?: string;
  venue_name?: string;
  venue_id?: string;
  is_indoor: boolean;
}
```

## Future Enhancements
- Heatmap of popular game areas
- Venue availability checking
- Transit directions integration
- Parking information
- Accessibility information for venues
- 3D venue views

