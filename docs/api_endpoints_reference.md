# Strava API Endpoints Reference
## Extracted from Strava iOS App v422.0.1

### Base URLs

#### Production
- `graphql.strava.com` - Main GraphQL API
- `stream.strava.com` - Real-time streaming API
- `www.strava.com` - Web API and webhooks
- `cdn-1.strava.com` - CDN for assets

#### Staging
- `graphql.staging.strava.com` - Staging GraphQL API
- `c-staging.strava.com` - Staging CDN
- `www.staging.strava.com` - Staging web

---

### REST API Endpoints

#### Activity Endpoints
```
/api/v3/live/activities/{id}     # Live activity tracking
/api/v3/segment_targets           # Segment targets
/api/v3/shop/login               # Shop login with access token
```

#### Web URLs (Web View Integration)
```
https://www.strava.com/activities/{id}
https://www.strava.com/athletes/{id}
https://www.strava.com/clubs/
https://www.strava.com/clubs/{id}
https://www.strava.com/challenges/{id}
https://www.strava.com/segments/{id}
https://www.strava.com/routes/
```

---

### GraphQL API

The app uses GraphQL as the primary data fetching mechanism. Key patterns:

**Query Classes Found:**
- `AssetsQuery`
- `SharableActivityDataQuery`
- Custom query classes for each feature

**GraphQL Infrastructure:**
- `GraphQLExecutor` - Query execution engine
- `GraphQLQueryWatcher` - Real-time query watching
- `AutomaticPersistedQueryInterceptor` - Query optimization
- `GraphQLFactory` - Query factory pattern
- `GraphQLAssembly` - Dependency injection

---

### Real-Time API

#### Chat/Messaging (Stream.io)
```
chat.stream-io-api.com/
chat-proxy-us-east.stream-io-api.com/
chat-proxy-dublin.stream-io-api.com/
chat-proxy-singapore.stream-io-api.com/
chat-proxy-sydney.stream-io-api.com/
```

#### WebSocket
- WebSocket connections for real-time updates
- Activity streaming
- Live notifications

---

### Map & Location Services

#### Mapbox
```
https://api.mapbox.com
https://api.mapbox.com/v4/mapbox.satellite-only/{z}/{x}/{y}.jpg?access_token={MAPBOX_SERVER_SECRET}
https://api.tiles.mapbox.com/v3/
```

#### Strava Heatmaps
```
https://heatmap-external-c.strava.com/auth
https://heatmap-external-c.strava.com/tiles-auth/
https://heatmap-origin-k8s.strava.com/tiles-night/
https://personal-heatmaps-external.strava.com/tiles/
https://www.strava.com/tiles/liveheat/{z}/{x}/{y}?sport_types=
```

---

### Third-Party Services

#### Branch.io (Deep Linking)
```
https://api.branch.io/v1/url
https://api-safetrack.branch.io
https://api-safetrack-eu.branch.io
https://api3.branch.io
https://api3-eu.branch.io
https://bnc.lt
https://cdn.branch.io
```

#### Firebase
```
https://firebaseinstallations.googleapis.com
https://console.firebase.google.com/
```

#### Analytics
```
https://app-analytics-services.com/a
https://app-analytics-services.com/config/app/{appId}?
https://app-analytics-services.com/sdk-exp
https://app-analytics-services.com/skan
https://app-analytics-services-att.com/a
```

#### Iterable (Email/Notifications)
```
https://api.iterable.com/api
```

#### Facebook Graph API
```
https://graph.facebook.com/v16.0/
```

#### Google OAuth
```
https://accounts.google.com/o/oauth2/v2/auth
```

#### Apple App Store
```
https://api-adservices.apple.com/api/v1/
```

#### Sentry (Error Tracking)
```
https://7e28b012684c97644ee1d6f42f293e85@o352714.ingest.us.sentry.io/4509055888916482
https://8207a88a55744998ac1c43d6443f980a@o352714.ingest.us.sentry.io/4505048745312256
```

---

### API Client Architecture

#### Core Components
```
APIClient                 # Main API client
BaseURL                   # Base URL configuration
Endpoint                  # Endpoint abstraction
EndpointMethod            # HTTP method (GET, POST, etc.)
EndpointPath              # Endpoint path
APIKey                    # API key management
APIPathConvertible        # Path conversion protocol
```

#### Feature-Specific API Clients
```
ClubAPI
ClubCreateAPIClient
ClubEditAPIClient
ClubInfoAPI
ClubSearchAPI
CreateClubChannelAPI
CreateNewClubAPIClient
EventInsightsAPIClient
EditCompetitionAPI
ActivityCommentsAPI
CommentReactionsAPI
AthleteSearchAPI
ActivityStreamsAPI
```

---

### URL Destination Pattern

The app uses a URL-based navigation system:

#### Club URLs
```
AthleteClubsURLDestination
ClubCreateURLDestination
ClubEditURLDestination
ClubInviteURLDestination
ClubsSubpageURLDestination
CreateClubURLDestination
CreateClubChannelURLDestination
```

#### Competition URLs
```
CompetitionDetailURLDestination
CompetitionEditURLDestination
CompetitionInviteURLDestination
CompetitionParticipantsURLDestination
CompetitionPhotosURLDestination
CompetitionRulesURLDestination
CreateCompetitionURLDestination
CompletedCompetitionsURLDestination
```

#### Event URLs
```
CreateClubEventURLDestination
ClubEventInsightsURLDestination
```

---

### Authentication Endpoints

OAuth 2.0 flow:
- Authorization endpoint (via `OAuthViewController`)
- Token refresh mechanism
- Guest token support

---

### Notification Endpoints

Push notifications likely use:
- Apple Push Notification Service (APNs)
- Firebase Cloud Messaging
- Custom notification endpoints via GraphQL

---

## Notes

1. **Primary API**: GraphQL at `graphql.strava.com` is the main API
2. **Real-time**: Stream.io handles chat, WebSocket for live updates
3. **Modular**: Feature-specific API clients suggest REST endpoints per feature
4. **Web Integration**: Many features link to web views at `www.strava.com`
5. **CDN**: Asset delivery via `cdn-1.strava.com`

---

## Recommendations for Your App

### API Design
1. Use GraphQL for flexible data fetching
2. Implement REST endpoints for simple operations
3. Use WebSocket for real-time features (live games, chat)
4. Consider Stream.io or similar for chat infrastructure

### Authentication
1. OAuth 2.0 with token refresh
2. Guest access for browsing
3. Social login (Google, Facebook, Apple)

### Real-time Features
1. WebSocket for live game updates
2. Chat service for team/game communication
3. Push notifications for game reminders

---

**Last Updated:** Analysis of v422.0.1


