# Strava App Reverse Engineering Analysis Report
## Version: 422.0.1 | Bundle ID: com.strava.stravaride

### Executive Summary
This report analyzes the Strava iOS app architecture, API patterns, and feature implementation to provide insights for building a pickup sports game application. The analysis focuses on club/group management, event organization, competition features, real-time communication, and location-based services.

---

## 1. Application Architecture

### 1.1 Bundle Structure
The app uses a modular bundle architecture with feature-specific bundles:

**Sports/Game-Relevant Bundles:**
- `ClubDetailBundle.bundle` - Club management and statistics
- `ClubEventBundle.bundle` - Event creation and management
- `CompetitionSettingsBundle.bundle` - Competition configuration
- `CreateCompetitionBundle.bundle` - Competition creation flow
- `FitnessBundle.bundle` - Fitness tracking and analysis
- `ChatBundle.bundle` - Real-time messaging (uses Stream.io)
- `ActivityGroupManagementBundle.bundle` - Group/team management
- `ClubSearchBundle.bundle` - Club discovery and search

**Supporting Bundles:**
- `LocationSearchBundle.bundle` - Location-based search
- `RecordUIBundle.bundle` - Activity recording interface
- `FeedKitBundle.bundle` - Social feed
- `NetworkingBundle.bundle` - API client infrastructure
- `MapUIBundle.bundle` - Map visualization

### 1.2 Technology Stack
- **Language**: Swift (based on class names and bundle structure)
- **UI**: UIKit (`.nib` files), Storyboards
- **Mapping**: Mapbox (custom tiles, satellite imagery)
- **Analytics**: Firebase, Snowplow, Branch.io
- **Chat**: Stream.io (chat-proxy endpoints)
- **GraphQL**: Custom GraphQL implementation with Apollo
- **Authentication**: OAuth 2.0, Facebook Auth, Google Sign-In

---

## 2. API Architecture

### 2.1 API Endpoints

**Primary API Base URLs:**
```
graphql.strava.com          # GraphQL API (production)
graphql.staging.strava.com  # GraphQL API (staging)
stream.strava.com           # Real-time streaming API
www.strava.com              # Web API
```

**Key API Patterns Found:**
- GraphQL-based API (main data fetching)
- REST endpoints for specific features (`/api/v3/`)
- WebSocket/Stream API for real-time features

### 2.2 API Client Architecture

**Key Components:**
- `APIClient` - Main API client
- `BaseURL` - Base URL configuration
- `Endpoint` / `EndpointMethod` / `EndpointPath` - Endpoint abstraction
- `GraphQLExecutor` / `GraphQLQueryWatcher` - GraphQL execution
- `AutomaticPersistedQueryInterceptor` - Query optimization

**API Classes for Sports Features:**
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
```

### 2.3 Authentication

**Auth Flow:**
- OAuth 2.0 implementation
- Token refresh mechanism (`RefreshingToken`, `TokenRefreshed`)
- Guest user support (`GuestUserTokenPayload`)
- Multi-provider auth (Facebook, Google, Apple)

**Auth Components:**
```
OAuthViewController
OAuthViewModel
AuthenticationRepository
TokenProvider
AuthState
```

---

## 3. Sports/Game Features

### 3.1 Clubs (Groups/Teams)

**Features:**
- Club creation (`ClubCreateAPIClient`, `CreateClubURLDestination`)
- Club editing (`ClubEditAPIClient`, `EditClubURLDestination`)
- Club search (`ClubSearchAPI`, `ClubSearchBundle.bundle`)
- Club member management
- Club statistics and analytics
- Club avatar/photo uploads
- Club invite links (`clubInviteLink`)
- Club chat channels (`CreateClubChannelAPI`)

**UI Components:**
```
STRVClubDetailScatterplotTableViewCell
STRVClubDetailStatValueTableViewCell
STRVClubDetailStatisticsTableViewCell
STRVClubMembersViewController
STRVClubEventFacepileViewController
STRVClubPendingMemberTableViewCell
```

### 3.2 Events

**Features:**
- Event creation (`CreateClubEventURLDestination`)
- Event editing (`STRVClubEventEditTableViewCell`)
- Event insights/analytics (`EventInsightsAPIClient`)
- Event sharing to chat
- Event flyer generation (`clubEventFlyer`)
- Event attendees list
- Event photos gallery

**Components:**
```
ClubEventBundle.bundle
EventInsightsAPIClient
EventCard
EventSender
EventView
```

### 3.3 Competitions

**Features:**
- Competition creation (`CreateCompetitionURLDestination`)
- Competition settings (`CompetitionSettingsBundle.bundle`)
- Competition participants (`CompetitionParticipantsURLDestination`)
- Competition rules (`CompetitionRulesURLDestination`)
- Competition photos (`CompetitionPhotosURLDestination`)
- Competition invitations (`CompetitionInviteURLDestination`)
- Competition activities list (`CompetitionActivitiesListFeedLoader`)

**UI Flow:**
```
CreateCompetitionActivitiesViewController
CreateCompetitionDateViewController
CreateCompetitionNamingViewController
DimensionViewController
SportPickerTableViewCell
CompetitionSettingsViewController
```

### 3.4 Activities (Matches/Games)

**Features:**
- Activity recording (`RecordUIBundle.bundle`)
- Activity groups (`ActivityGroupManagementBundle.bundle`)
- Activity search (`ActivitySearchBundle.bundle`)
- Live activity streaming (`/api/v3/live/activities/`)
- Activity sharing
- Activity segments (for tracking specific parts of games)

**Key Strings:**
- `/api/v3/live/activities/[a-zA-Z0-9-]*$` - Live activity endpoint
- `ActivityGroupAthleteRelationshipUpdater` - Group relationships

---

## 4. Real-Time Features

### 4.1 Chat/Messaging

**Infrastructure:**
- **Stream.io integration** for real-time chat
- Multiple regional chat proxies:
  ```
  chat-proxy-us-east.stream-io-api.com
  chat-proxy-dublin.stream-io-api.com
  chat-proxy-singapore.stream-io-api.com
  chat-proxy-sydney.stream-io-api.com
  ```

**Features:**
- Club channel creation (`CreateClubChannelAPI`)
- Real-time messaging
- Message notifications (`ChatPushNotificationContent`)
- Push notifications for chat (`ChatRemoteNotificationHandler`)
- Attachment upload/download (`StreamAttachmentUploader`, `StreamAttachmentDownloader`)

**Components:**
```
ChatBundle.bundle
StreamChat
StreamCDNClient
MessageNotification
ChatPushNotificationInfo
```

### 4.2 Notifications

**Types:**
- Push notifications
- Email notifications
- System notifications
- Message notifications
- Chat notifications

**Components:**
```
StravaNotificationManager
NotificationManagerFactory
PushNotificationsSettingsURLDestination
NotificationContent
```

---

## 5. Location Services

### 5.1 Location Features

**Permissions:**
- `NSLocationAlwaysAndWhenInUseUsageDescription` - Full location access
- `NSLocationTemporaryUsageDescriptionDictionary` - Temporary access
- Location sharing permissions

**Components:**
```
LocationSearchBundle.bundle
LocationSearchPickerAdapter
LocationAccessRequester
LocationSharingPermission
CLLocationCoordinate2D
```

### 5.2 Mapping

**Mapping Services:**
- **Mapbox** for custom maps
- Satellite imagery support
- Heatmap functionality
- Route visualization
- Segment mapping

**Map Endpoints:**
```
https://api.mapbox.com
https://heatmap-external-c.strava.com/auth
https://heatmap-origin-k8s.strava.com/tiles-night/
https://personal-heatmaps-external.strava.com/tiles/
```

**Components:**
```
MapUIBundle.bundle
MapRenderingEngineFactory
ActivitySegmentMapViewController
LocationSearchMapViewController
```

---

## 6. Social Features

### 6.1 Feed & Sharing

**Features:**
- Social feed (`FeedKitBundle.bundle`)
- Post composition (`PostComposerBundle.bundle`)
- Photo uploads (`StravaPhotoUIKitBundle.bundle`)
- Share sheets (`StravaShareSheetBundle.bundle`)
- Activity sharing
- Club post sharing (`ShareToClubPostURLHandler`)

### 6.2 Relationships

**Components:**
```
AthleteConnectionsBundle.bundle
ActivityGroupAthleteRelationshipUpdater
AthleteRelationshipController
Follow/unfollow functionality
```

### 6.3 Leaderboards

**Components:**
```
ViewLeaderboardBundle.bundle
LeaderboardTableViewCell
LeaderboardSectionHeaderView
OverallLeaderCell
```

---

## 7. Key Implementation Patterns

### 7.1 URL-Based Navigation

The app uses a URL-based navigation pattern with destination factories:

```
ClubCreateURLDestinationFactory
CompetitionDetailURLDestinationFactory
EditClubURLDestinationFactory
ClubInviteURLDestination
```

### 7.2 Modular Architecture

- Feature-based bundles
- Dependency injection
- Factory patterns for view controllers
- Protocol-based abstractions

### 7.3 Data Persistence

- Core Data (`StravaCoreDataBundle.bundle`)
- Local caching
- Offline support patterns

---

## 8. Recommendations for Pickup Sports App

### 8.1 Architecture

1. **Modular Bundle Structure**
   - Create feature bundles for games, teams, players, locations
   - Separate UI, networking, and data layers

2. **GraphQL API**
   - Consider GraphQL for flexible data fetching
   - Implement persisted queries for performance
   - Use query watchers for real-time updates

### 8.2 Core Features to Implement

1. **Game/Event Management**
   - Game creation with location, time, sport type
   - Player RSVP/attendance tracking
   - Game status (upcoming, in-progress, completed)
   - Score/statistics tracking

2. **Team/Group Features**
   - Team creation and management
   - Player invitations
   - Team statistics and history
   - Team chat channels

3. **Location Services**
   - Location-based game discovery
   - Venue/park location search
   - Proximity-based notifications
   - Map visualization for games

4. **Real-Time Communication**
   - Chat for games/teams (consider Stream.io)
   - Push notifications for game updates
   - Live game updates

5. **Social Features**
   - Player profiles
   - Activity feed
   - Leaderboards
   - Reputation/ratings system

### 8.3 Technical Stack Suggestions

**Backend:**
- GraphQL API (like Strava)
- Real-time messaging (Stream.io or Socket.io)
- WebSocket for live updates
- Push notification service

**Mobile:**
- Modular architecture (Swift packages/bundles)
- Mapbox for location features
- OAuth 2.0 for authentication
- Core Data for local persistence

**Third-Party Services:**
- Firebase (analytics, crash reporting)
- Mapbox (mapping)
- Stream.io (chat/messaging)
- Branch.io (deep linking)

---

## 9. API Endpoint Patterns

### 9.1 REST Patterns
```
/api/v3/live/activities/{id}     # Live activity tracking
/api/v3/segment_targets           # Target segments
```

### 9.2 GraphQL Patterns
- Query: `AssetsQuery`, `SharableActivityDataQuery`
- Mutations: Likely for creating/updating clubs, events, competitions
- Subscriptions: For real-time updates

### 9.3 WebSocket/Stream
- Real-time activity streaming
- Chat messages
- Live notifications

---

## 10. Security Considerations

### 10.1 Authentication
- OAuth 2.0 with token refresh
- Multi-factor authentication support
- Guest access patterns

### 10.2 Data Privacy
- Location privacy zones
- Photo visibility settings
- Privacy settings bundle

---

## 11. Additional Resources

### 11.1 External Services
- **Stream.io**: Chat/messaging infrastructure
- **Mapbox**: Mapping and location services
- **Firebase**: Backend services
- **Branch.io**: Deep linking
- **Iterable**: Email/notification campaigns

### 11.2 Support URLs Found
```
https://support.strava.com
https://communityhub.strava.com/
https://www.strava.com/legal/privacy
https://www.strava.com/legal/terms
```

---

## Conclusion

The Strava app demonstrates a well-architected sports/social application with:
- Modular feature-based architecture
- GraphQL + REST hybrid API
- Real-time messaging and updates
- Location-based features
- Strong social/community features

Key takeaways for a pickup sports app:
1. Use modular architecture for maintainability
2. Implement GraphQL for flexible data fetching
3. Integrate real-time chat for team/game communication
4. Leverage location services for discovery
5. Build strong social features (profiles, feed, leaderboards)
6. Focus on event/game management as core feature

---

## 12. Activity Types

Strava supports numerous activity/sport types, which is relevant for a pickup sports app:

**Supported Activity Types (from CommonActivityTypes.plist):**
- Alpine Ski
- Backcountry Ski
- Badminton
- Canoeing
- Crossfit
- Mountain Bike Ride
- Gravel Ride
- E-Bike Ride
- Elliptical
- Handcycle
- HIIT (High Intensity Interval Training)
- Ice Skate
- Inline Skate
- Kayaking
- Kitesurf
- And many more...

**Activity Type System:**
- Each activity has a `beaconActivityType` identifier
- Activities can be marked as indoor/outdoor
- Sport categorization and tagging system
- Activity type filtering and search

**For Pickup Sports App:**
- Implement a similar sport/activity type system
- Support multiple sports (basketball, soccer, tennis, volleyball, etc.)
- Allow filtering games by sport type
- Track sport-specific statistics

---

**Analysis Date:** November 2024
**Analyzed Version:** 422.0.1
**Bundle ID:** com.strava.stravaride

