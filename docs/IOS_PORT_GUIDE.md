# iOS Port Guide: TribeUp to Swift Native App

## Overview

This guide outlines the strategy for porting TribeUp from React/TypeScript web app to a native Swift iOS app, similar to Strava's architecture. The app will maintain the same backend (Supabase) while providing a native iOS experience.

---

## Architecture Decision: Native vs Hybrid

**Recommendation: Native Swift iOS App**

### Why Native?
- **Performance**: Native UI rendering, smooth animations, better memory management
- **Platform Integration**: Deep iOS features (Core Location, HealthKit, Background Tasks, Push Notifications)
- **User Experience**: Native iOS design patterns, haptics, system integrations
- **Strava-like Feel**: Professional, polished mobile experience
- **App Store**: Better discoverability and trust

### Architecture Pattern: MVVM + Combine

```
iOS App Architecture:
├── Models/          # Data models (Game, User, Location, etc.)
├── ViewModels/      # Business logic & state management
├── Views/           # SwiftUI views
├── Services/        # Network, database, location services
├── Repositories/    # Data access layer
└── Utilities/       # Helpers, extensions
```

---

## Tech Stack Mapping

### Frontend Stack

| React/Web | Swift iOS | Purpose |
|-----------|-----------|---------|
| React 18 | SwiftUI | UI Framework |
| TypeScript | Swift | Type Safety |
| React Query | Combine + URLSession | Data Fetching & Caching |
| Zustand | @StateObject/@ObservedObject | State Management |
| React Router | NavigationStack | Navigation |
| Tailwind CSS | SwiftUI Modifiers | Styling |
| Radix UI | SwiftUI Native Components | UI Components |
| Framer Motion | SwiftUI Animations | Animations |

### Backend Integration

| Web | iOS | Purpose |
|-----|-----|---------|
| `@supabase/supabase-js` | `supabase-swift` | Supabase Client |
| Supabase Realtime (WebSocket) | Supabase Realtime (WebSocket) | Real-time Updates |
| Supabase Auth | Supabase Auth | Authentication |
| Supabase Storage | Supabase Storage | File Uploads |

### Third-Party Services

| Service | iOS SDK | Purpose |
|---------|---------|---------|
| Google Maps JS API | Google Maps SDK for iOS | Maps & Location |
| WeatherAPI.com | URLSession + REST API | Weather Data |
| PostHog | PostHog iOS SDK | Analytics |

---

## Project Structure

```
TribeUp-iOS/
├── TribeUp/
│   ├── App/
│   │   ├── TribeUpApp.swift          # App entry point
│   │   ├── AppRouter.swift           # Navigation coordinator
│   │   └── AppDependencies.swift     # Dependency injection
│   │
│   ├── Core/
│   │   ├── Database/
│   │   │   ├── SupabaseClient.swift  # Supabase singleton
│   │   │   └── DatabaseTypes.swift   # Generated types
│   │   ├── Auth/
│   │   │   ├── AuthService.swift
│   │   │   └── AuthViewModel.swift
│   │   ├── Config/
│   │   │   └── Config.swift          # Environment config
│   │   └── Utils/
│   │       ├── Extensions/
│   │       └── Helpers/
│   │
│   ├── Domains/
│   │   ├── Games/
│   │   │   ├── Models/
│   │   │   │   └── Game.swift
│   │   │   ├── ViewModels/
│   │   │   │   ├── GameListViewModel.swift
│   │   │   │   ├── GameDetailViewModel.swift
│   │   │   │   └── CreateGameViewModel.swift
│   │   │   ├── Views/
│   │   │   │   ├── GameListView.swift
│   │   │   │   ├── GameDetailView.swift
│   │   │   │   ├── CreateGameView.swift
│   │   │   │   └── GameCardView.swift
│   │   │   ├── Services/
│   │   │   │   ├── GameService.swift
│   │   │   │   └── GameParticipantService.swift
│   │   │   └── Repositories/
│   │   │       └── GameRepository.swift
│   │   │
│   │   ├── Users/
│   │   │   ├── Models/
│   │   │   ├── ViewModels/
│   │   │   ├── Views/
│   │   │   └── Services/
│   │   │
│   │   ├── Locations/
│   │   │   ├── Models/
│   │   │   ├── ViewModels/
│   │   │   ├── Views/
│   │   │   └── Services/
│   │   │
│   │   ├── Weather/
│   │   │   ├── Models/
│   │   │   ├── ViewModels/
│   │   │   ├── Views/
│   │   │   └── Services/
│   │   │
│   │   └── Tribes/
│   │       ├── Models/
│   │       ├── ViewModels/
│   │       ├── Views/
│   │       └── Services/
│   │
│   ├── Shared/
│   │   ├── Components/
│   │   │   ├── UI/
│   │   │   │   ├── Button.swift
│   │   │   │   ├── Card.swift
│   │   │   │   └── TextField.swift
│   │   │   └── Common/
│   │   │       ├── LoadingView.swift
│   │   │       └── ErrorView.swift
│   │   └── Extensions/
│   │
│   └── Resources/
│       ├── Assets.xcassets/
│       ├── Colors.swift
│       └── Fonts/
│
├── TribeUpTests/                    # Unit tests
└── TribeUpUITests/                  # UI tests
```

---

## Key Components to Port

### 1. Authentication Flow

**Web (React):**
```typescript
// src/core/auth/SimpleAuthProvider.tsx
```

**iOS (Swift):**
```swift
// Core/Auth/AuthViewModel.swift
class AuthViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    
    func signIn(email: String, password: String) async throws {
        // Supabase auth
    }
    
    func signInWithGoogle() async throws {
        // OAuth flow
    }
}
```

### 2. Game Management

**Web (React):**
```typescript
// src/domains/games/components/HomeScreen.tsx
// src/domains/games/components/CreateGame.tsx
// src/domains/games/components/GameDetails.tsx
```

**iOS (Swift):**
```swift
// Domains/Games/Views/GameListView.swift
struct GameListView: View {
    @StateObject private var viewModel = GameListViewModel()
    
    var body: some View {
        List(viewModel.games) { game in
            GameCardView(game: game)
        }
        .task {
            await viewModel.loadGames()
        }
    }
}

// Domains/Games/ViewModels/GameListViewModel.swift
class GameListViewModel: ObservableObject {
    @Published var games: [Game] = []
    @Published var isLoading = false
    
    private let gameRepository: GameRepository
    
    func loadGames() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            games = try await gameRepository.fetchGames()
        } catch {
            // Handle error
        }
    }
}
```

### 3. Real-time Updates

**Web (React):**
```typescript
// src/shared/hooks/useSupabaseRealtime.ts
useEffect(() => {
    const channel = supabase
        .channel(`game:${gameId}`)
        .on('postgres_changes', { ... }, handleUpdate)
        .subscribe();
    
    return () => channel.unsubscribe();
}, [gameId]);
```

**iOS (Swift):**
```swift
// Domains/Games/Services/GameRealtimeService.swift
class GameRealtimeService {
    private var channel: RealtimeChannel?
    
    func subscribeToGame(gameId: String, onUpdate: @escaping (Game) -> Void) {
        channel = supabase.channel("game:\(gameId)")
            .on(.postgresChanges(
                InsertAction.self,
                schema: "public",
                table: "games",
                filter: "id=eq.\(gameId)"
            )) { message in
                // Handle update
                if let game = try? message.decode(as: Game.self) {
                    onUpdate(game)
                }
            }
            .subscribe()
    }
    
    func unsubscribe() {
        channel?.unsubscribe()
    }
}
```

### 4. Location Services

**Web (React):**
```typescript
// src/domains/locations/hooks/useGeolocation.ts
```

**iOS (Swift):**
```swift
// Domains/Locations/Services/LocationService.swift
import CoreLocation

class LocationService: NSObject, ObservableObject, CLLocationManagerDelegate {
    private let locationManager = CLLocationManager()
    @Published var currentLocation: CLLocation?
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    
    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
    }
    
    func requestLocationPermission() {
        locationManager.requestWhenInUseAuthorization()
    }
    
    func startLocationUpdates() {
        locationManager.startUpdatingLocation()
    }
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        currentLocation = locations.last
    }
}
```

### 5. Maps Integration

**Web (React):**
```typescript
// src/domains/locations/components/GoogleMapView.tsx
```

**iOS (Swift):**
```swift
// Domains/Locations/Views/MapView.swift
import GoogleMaps

struct GameMapView: UIViewRepresentable {
    let games: [Game]
    @Binding var selectedGame: Game?
    
    func makeUIView(context: Context) -> GMSMapView {
        let camera = GMSCameraPosition.camera(
            withLatitude: 29.6516,
            longitude: -82.3248,
            zoom: 13.0
        )
        let mapView = GMSMapView.map(withFrame: .zero, camera: camera)
        mapView.delegate = context.coordinator
        return mapView
    }
    
    func updateUIView(_ mapView: GMSMapView, context: Context) {
        mapView.clear()
        
        for game in games {
            let marker = GMSMarker()
            marker.position = CLLocationCoordinate2D(
                latitude: game.latitude,
                longitude: game.longitude
            )
            marker.title = game.title
            marker.map = mapView
        }
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, GMSMapViewDelegate {
        var parent: GameMapView
        
        init(_ parent: GameMapView) {
            self.parent = parent
        }
        
        func mapView(_ mapView: GMSMapView, didTap marker: GMSMarker) -> Bool {
            // Handle marker tap
            return true
        }
    }
}
```

---

## Supabase iOS Integration

### Setup

1. **Add Supabase Swift SDK:**
```swift
// Package.swift or Xcode Package Manager
dependencies: [
    .package(url: "https://github.com/supabase/supabase-swift", from: "2.0.0")
]
```

2. **Initialize Supabase Client:**
```swift
// Core/Database/SupabaseClient.swift
import Supabase

class SupabaseClient {
    static let shared = SupabaseClient()
    
    let client: SupabaseClient
    
    private init() {
        guard let url = URL(string: Config.supabaseURL),
              let key = Config.supabaseAnonKey else {
            fatalError("Missing Supabase configuration")
        }
        
        client = SupabaseClient(
            supabaseURL: url,
            supabaseKey: key,
            options: SupabaseClientOptions(
                auth: AuthOptions(
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                ),
                realtime: RealtimeClientOptions(
                    heartbeatInterval: 30
                )
            )
        )
    }
}
```

3. **Authentication:**
```swift
// Core/Auth/AuthService.swift
class AuthService {
    private let supabase = SupabaseClient.shared.client
    
    func signIn(email: String, password: String) async throws -> Session {
        let session = try await supabase.auth.signIn(
            email: email,
            password: password
        )
        return session
    }
    
    func signUp(email: String, password: String) async throws -> Session {
        let session = try await supabase.auth.signUp(
            email: email,
            password: password
        )
        return session
    }
    
    func signOut() async throws {
        try await supabase.auth.signOut()
    }
    
    func getCurrentUser() -> User? {
        return try? supabase.auth.session.user
    }
}
```

4. **Database Queries:**
```swift
// Domains/Games/Repositories/GameRepository.swift
class GameRepository {
    private let supabase = SupabaseClient.shared.client
    
    func fetchGames() async throws -> [Game] {
        let response: [Game] = try await supabase
            .from("games")
            .select()
            .gte("date", value: Date().ISO8601Format())
            .order("date", ascending: true)
            .execute()
            .value
        
        return response
    }
    
    func createGame(_ game: GameCreate) async throws -> Game {
        let response: Game = try await supabase
            .from("games")
            .insert(game)
            .select()
            .single()
            .execute()
            .value
        
        return response
    }
}
```

---

## Real-time Features

### Game Updates

```swift
// Domains/Games/Services/GameRealtimeService.swift
class GameRealtimeService {
    private let supabase = SupabaseClient.shared.client
    private var channels: [String: RealtimeChannel] = [:]
    
    func subscribeToGame(
        gameId: String,
        onUpdate: @escaping (Game) -> Void
    ) {
        let channel = supabase.channel("game:\(gameId)")
        
        channel.on(.postgresChanges(
            UpdateAction.self,
            schema: "public",
            table: "games",
            filter: "id=eq.\(gameId)"
        )) { message in
            do {
                let game: Game = try message.decode()
                onUpdate(game)
            } catch {
                print("Error decoding game update: \(error)")
            }
        }
        
        channel.subscribe()
        channels[gameId] = channel
    }
    
    func unsubscribeFromGame(gameId: String) {
        channels[gameId]?.unsubscribe()
        channels.removeValue(forKey: gameId)
    }
}
```

### Chat Messages

```swift
// Domains/Games/Services/ChatRealtimeService.swift
class ChatRealtimeService {
    private let supabase = SupabaseClient.shared.client
    private var channel: RealtimeChannel?
    
    func subscribeToChat(
        gameId: String,
        onMessage: @escaping (ChatMessage) -> Void
    ) {
        channel = supabase.channel("chat:\(gameId)")
        
        channel?.on(.postgresChanges(
            InsertAction.self,
            schema: "public",
            table: "game_chat_messages",
            filter: "game_id=eq.\(gameId)"
        )) { message in
            do {
                let chatMessage: ChatMessage = try message.decode()
                onMessage(chatMessage)
            } catch {
                print("Error decoding chat message: \(error)")
            }
        }
        
        channel?.subscribe()
    }
    
    func sendMessage(gameId: String, content: String, userId: String) async throws {
        let message = ChatMessageCreate(
            game_id: gameId,
            user_id: userId,
            content: content
        )
        
        try await supabase
            .from("game_chat_messages")
            .insert(message)
            .execute()
    }
}
```

---

## Platform-Specific Features

### 1. Push Notifications

```swift
// Core/Notifications/PushNotificationService.swift
import UserNotifications

class PushNotificationService: NSObject, UNUserNotificationCenterDelegate {
    static let shared = PushNotificationService()
    
    func requestAuthorization() async throws -> Bool {
        return try await UNUserNotificationCenter.current()
            .requestAuthorization(options: [.alert, .sound, .badge])
    }
    
    func registerForRemoteNotifications() {
        UIApplication.shared.registerForRemoteNotifications()
    }
    
    // Handle notification when app is in foreground
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound, .badge])
    }
}
```

### 2. Background Location Updates

```swift
// Domains/Locations/Services/BackgroundLocationService.swift
import CoreLocation

class BackgroundLocationService: NSObject, CLLocationManagerDelegate {
    private let locationManager = CLLocationManager()
    
    func enableBackgroundLocationUpdates() {
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
        locationManager.startMonitoringSignificantLocationChanges()
    }
}
```

### 3. HealthKit Integration (Optional - for activity tracking)

```swift
// Domains/Users/Services/HealthKitService.swift
import HealthKit

class HealthKitService {
    private let healthStore = HKHealthStore()
    
    func requestAuthorization() async throws {
        guard HKHealthStore.isHealthDataAvailable() else {
            throw HealthKitError.notAvailable
        }
        
        let typesToRead: Set<HKObjectType> = [
            HKObjectType.quantityType(forIdentifier: .heartRate)!,
            HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!
        ]
        
        try await healthStore.requestAuthorization(toShare: nil, read: typesToRead)
    }
}
```

### 4. Haptic Feedback

```swift
// Shared/Utils/HapticFeedback.swift
import UIKit

enum HapticFeedback {
    case success
    case warning
    case error
    case selection
    
    func play() {
        switch self {
        case .success:
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.success)
        case .warning:
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.warning)
        case .error:
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.error)
        case .selection:
            let generator = UISelectionFeedbackGenerator()
            generator.selectionChanged()
        }
    }
}
```

---

## UI/UX Considerations

### Design System

1. **Colors:**
```swift
// Resources/Colors.swift
extension Color {
    static let primary = Color(hex: "#FA4616") // UF Orange
    static let secondary = Color(hex: "#0021A5") // UF Blue
    static let background = Color(.systemBackground)
    static let foreground = Color(.label)
}
```

2. **Typography:**
```swift
// Resources/Typography.swift
extension Font {
    static let title = Font.system(size: 28, weight: .bold)
    static let headline = Font.system(size: 20, weight: .semibold)
    static let body = Font.system(size: 16, weight: .regular)
    static let caption = Font.system(size: 12, weight: .regular)
}
```

3. **Components:**
```swift
// Shared/Components/UI/Button.swift
struct PrimaryButton: View {
    let title: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.primary)
                .cornerRadius(12)
        }
    }
}
```

### Navigation

```swift
// App/AppRouter.swift
class AppRouter: ObservableObject {
    @Published var path = NavigationPath()
    
    enum Route: Hashable {
        case gameDetail(String)
        case createGame
        case userProfile(String)
        case settings
    }
    
    func navigate(to route: Route) {
        path.append(route)
    }
    
    func pop() {
        path.removeLast()
    }
}
```

---

## Migration Strategy

### Phase 1: Foundation (Weeks 1-2)
- [ ] Set up Xcode project structure
- [ ] Integrate Supabase Swift SDK
- [ ] Implement authentication flow
- [ ] Set up navigation system
- [ ] Create shared UI components

### Phase 2: Core Features (Weeks 3-6)
- [ ] Port game list and detail views
- [ ] Implement game creation flow
- [ ] Add location services and maps
- [ ] Implement real-time subscriptions
- [ ] Port chat functionality

### Phase 3: Advanced Features (Weeks 7-10)
- [ ] Add weather integration
- [ ] Implement user profiles
- [ ] Port tribe/social features
- [ ] Add push notifications
- [ ] Implement background tasks

### Phase 4: Polish & Testing (Weeks 11-12)
- [ ] UI/UX refinements
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] App Store preparation
- [ ] Beta testing

---

## Key Differences from Web App

### 1. State Management
- **Web**: React Query + Zustand
- **iOS**: Combine + `@Published` properties in ViewModels

### 2. Navigation
- **Web**: React Router with URL-based routing
- **iOS**: NavigationStack with programmatic navigation

### 3. Styling
- **Web**: Tailwind CSS classes
- **iOS**: SwiftUI modifiers and custom views

### 4. Real-time
- **Web**: Supabase Realtime via WebSocket in browser
- **iOS**: Supabase Realtime via WebSocket in native client

### 5. Location
- **Web**: Browser Geolocation API
- **iOS**: Core Location framework with background support

---

## Testing Strategy

### Unit Tests
```swift
// TribeUpTests/Domains/Games/GameRepositoryTests.swift
class GameRepositoryTests: XCTestCase {
    func testFetchGames() async throws {
        let repository = GameRepository()
        let games = try await repository.fetchGames()
        XCTAssertFalse(games.isEmpty)
    }
}
```

### UI Tests
```swift
// TribeUpUITests/GameFlowTests.swift
class GameFlowTests: XCTestCase {
    func testCreateGame() {
        let app = XCUIApplication()
        app.launch()
        
        app.buttons["Create Game"].tap()
        // Test game creation flow
    }
}
```

---

## Performance Considerations

1. **Image Caching**: Use `AsyncImage` with caching
2. **List Optimization**: Use `LazyVStack` for long lists
3. **Network Caching**: Implement URLSession caching
4. **Background Tasks**: Use background URLSession for data sync
5. **Memory Management**: Properly unsubscribe from real-time channels

---

## Resources

### Documentation
- [Supabase Swift SDK](https://github.com/supabase/supabase-swift)
- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui)
- [Combine Framework](https://developer.apple.com/documentation/combine)
- [Google Maps iOS SDK](https://developers.google.com/maps/documentation/ios-sdk)

### Example Apps
- Strava iOS app (reference for sports app UX)
- Supabase example apps

---

## Next Steps

1. **Set up Xcode project** with proper folder structure
2. **Install dependencies** (Supabase Swift SDK, Google Maps SDK)
3. **Create base architecture** (MVVM pattern)
4. **Port authentication** first (foundation for everything)
5. **Incrementally port features** domain by domain
6. **Test thoroughly** on physical devices
7. **Submit to App Store** after beta testing

---

## Questions to Consider

1. **Shared Code**: Consider creating a shared Swift package for business logic
2. **Backend Compatibility**: Ensure Supabase RLS policies work with iOS app
3. **Analytics**: Set up PostHog iOS SDK for tracking
4. **Crash Reporting**: Integrate Sentry or similar
5. **CI/CD**: Set up Fastlane for automated builds and deployments

---

This guide provides a comprehensive roadmap for porting TribeUp to iOS. Start with Phase 1 and iterate based on your specific needs and timeline.
