# Weather Domain

## Purpose
The Weather Integration System provides real-time weather data and sport-specific suitability analysis for outdoor activities.

## Domain Score: 85/100

## Responsibilities

### Weather Data Fetching
- Real-time weather forecasts from WeatherAPI
- 4-hour window analysis around game time
- Temperature, precipitation, wind speed data
- Weather condition descriptions

### Sport-Specific Analysis
- Custom thresholds per sport type
- Suitability scoring (0-100)
- Weather warnings and recommendations
- Alternative timing suggestions

### Integration with Games
- Automatic weather checks during game creation
- Live weather updates on game details
- Weather-based game recommendations
- Unsuitable weather alerts

## Key Files

### Components
- `WeatherWidget.tsx` - Weather display with suitability indicator

### Services
- `weatherService.ts` - Weather API integration and suitability analysis

## Business Rules

### Weather Thresholds (Sport-Specific)

#### Basketball
- Max temperature: 95°F (35°C)
- Max precipitation: 20%
- Max wind speed: 25 mph

#### Soccer/Football
- Max temperature: 95°F (35°C)
- Max precipitation: 40%
- Max wind speed: 30 mph

#### Tennis
- Max temperature: 100°F (38°C)
- Max precipitation: 10%
- Max wind speed: 20 mph

#### Volleyball
- Max temperature: 100°F (38°C)
- Max precipitation: 20%
- Max wind speed: 25 mph

#### Baseball
- Max temperature: 95°F (35°C)
- Max precipitation: 30%
- Max wind speed: 35 mph

#### Running/Cycling
- Max temperature: 90°F (32°C)
- Max precipitation: 50%
- Max wind speed: N/A

### Suitability Scoring
- 80-100: Excellent conditions
- 60-79: Good conditions
- 40-59: Fair conditions (show warning)
- 0-39: Poor conditions (recommend rescheduling)

### Weather Windows
- Check ±2 hours from game start time
- Use worst case scenario for warnings
- Cache weather data for 30 minutes

## Dependencies on Other Domains

### Games Domain
- Provides game timing and location
- Receives weather suitability scores
- Displays weather widgets

### Locations Domain
- Coordinates for weather API calls
- Indoor vs outdoor venue classification

## Common AI Prompts

### Weather Integration
"Fetch weather for game location and time"
"Calculate suitability score for [sport type]"
"Show weather warning if conditions are poor"

### Custom Thresholds
"Add new sport type with weather thresholds"
"Adjust precipitation threshold for [sport]"
"Implement season-specific thresholds"

### User Experience
"Show weather icon based on conditions"
"Display suitability percentage with color coding"
"Suggest alternative times with better weather"

## API Integration

### WeatherAPI.com
- Endpoint: `https://api.weatherapi.com/v1/forecast.json`
- Parameters: location (lat/lon), date range
- Rate limit: Handle gracefully with caching
- Fallback: Show basic forecast if suitability calculation fails

## Performance Considerations
- Cache weather data for 30 minutes
- Batch weather requests for multiple games
- Show loading states while fetching
- Handle API errors gracefully
- Consider using weather data from game creation time

## Future Enhancements
- Historical weather accuracy tracking
- User-customizable weather preferences
- Weather-based game cancellation automation
- Integration with multiple weather APIs for redundancy

