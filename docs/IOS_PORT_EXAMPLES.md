# iOS Port Examples: React to Swift Translation

This document provides concrete examples of how React/TypeScript components translate to Swift/SwiftUI.

---

## Example 1: Game Card Component

### React (Web)

```typescript
// src/domains/games/components/UnifiedGameCard.tsx
interface UnifiedGameCardProps {
  game: Game;
  onPress?: () => void;
}

export const UnifiedGameCard = ({ game, onPress }: UnifiedGameCardProps) => {
  return (
    <div 
      className="bg-card rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow"
      onClick={onPress}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{game.title}</h3>
          <p className="text-sm text-muted-foreground">{game.sport}</p>
        </div>
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: game.sportColor }}
        />
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" />
          <span>{format(game.date, 'MMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPinIcon className="w-4 h-4" />
          <span>{game.location}</span>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UsersIcon className="w-4 h-4" />
          <span>{game.totalPlayers}/{game.maxPlayers}</span>
        </div>
        {game.isJoined && (
          <Badge variant="success">Joined</Badge>
        )}
      </div>
    </div>
  );
};
```

### Swift (iOS)

```swift
// Domains/Games/Views/GameCardView.swift
import SwiftUI

struct GameCardView: View {
    let game: Game
    let onTap: () -> Void
    
    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 12) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(game.title)
                            .font(.headline)
                            .foregroundColor(.primary)
                        
                        Text(game.sport.capitalized)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    Circle()
                        .fill(Color(hex: game.sportColor))
                        .frame(width: 12, height: 12)
                }
                
                // Details
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 8) {
                        Image(systemName: "calendar")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(game.date.formatted(date: .abbreviated, time: .omitted))
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    HStack(spacing: 8) {
                        Image(systemName: "mappin.circle")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(game.location)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                // Footer
                HStack {
                    HStack(spacing: 4) {
                        Image(systemName: "person.2")
                            .font(.caption)
                        Text("\(game.totalPlayers)/\(game.maxPlayers)")
                            .font(.caption)
                    }
                    .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    if game.isJoined {
                        Text("Joined")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.green)
                            .cornerRadius(8)
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
        }
        .buttonStyle(PlainButtonStyle())
    }
}
```

---

## Example 2: Game List with Data Fetching

### React (Web)

```typescript
// src/domains/games/components/HomeScreen.tsx
export const HomeScreen = () => {
  const { data: games, isLoading, error } = useGames({
    sport: selectedSport,
    location: userLocation,
  });
  
  const { mutate: joinGame } = useGameJoinToggle();
  
  if (isLoading) return <GameCardSkeleton />;
  if (error) return <ErrorView error={error} />;
  
  return (
    <div className="space-y-4">
      {games?.map(game => (
        <UnifiedGameCard
          key={game.id}
          game={game}
          onPress={() => navigate(`/games/${game.id}`)}
        />
      ))}
    </div>
  );
};
```

### Swift (iOS)

```swift
// Domains/Games/Views/GameListView.swift
import SwiftUI

struct GameListView: View {
    @StateObject private var viewModel = GameListViewModel()
    @State private var selectedSport: String?
    
    var body: some View {
        Group {
            if viewModel.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if let error = viewModel.error {
                ErrorView(error: error) {
                    Task {
                        await viewModel.loadGames()
                    }
                }
            } else {
                ScrollView {
                    LazyVStack(spacing: 16) {
                        ForEach(viewModel.games) { game in
                            GameCardView(game: game) {
                                // Navigate to game detail
                            }
                        }
                    }
                    .padding()
                }
            }
        }
        .task {
            await viewModel.loadGames()
        }
        .refreshable {
            await viewModel.loadGames()
        }
    }
}

// Domains/Games/ViewModels/GameListViewModel.swift
import Combine

class GameListViewModel: ObservableObject {
    @Published var games: [Game] = []
    @Published var isLoading = false
    @Published var error: Error?
    
    private let gameRepository: GameRepository
    private var cancellables = Set<AnyCancellable>()
    
    init(gameRepository: GameRepository = GameRepository.shared) {
        self.gameRepository = gameRepository
    }
    
    func loadGames() async {
        await MainActor.run {
            isLoading = true
            error = nil
        }
        
        do {
            let fetchedGames = try await gameRepository.fetchGames()
            await MainActor.run {
                self.games = fetchedGames
                self.isLoading = false
            }
        } catch {
            await MainActor.run {
                self.error = error
                self.isLoading = false
            }
        }
    }
}
```

---

## Example 3: Real-time Chat

### React (Web)

```typescript
// src/domains/games/components/EnhancedGameChat.tsx
export const EnhancedGameChat = ({ gameId }: { gameId: string }) => {
  const { messages, sendMessage, isConnected } = useRealtimeChat({
    roomName: `game:${gameId}`,
    username: currentUser.name,
  });
  
  const [input, setInput] = useState('');
  
  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {messages.map(msg => (
          <div key={msg.id} className="mb-4">
            <p className="font-semibold">{msg.user.name}</p>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2 p-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <Button onClick={handleSend}>Send</Button>
      </div>
    </div>
  );
};
```

### Swift (iOS)

```swift
// Domains/Games/Views/GameChatView.swift
import SwiftUI

struct GameChatView: View {
    let gameId: String
    @StateObject private var viewModel: GameChatViewModel
    
    init(gameId: String) {
        self.gameId = gameId
        _viewModel = StateObject(wrappedValue: GameChatViewModel(gameId: gameId))
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Messages
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 12) {
                        ForEach(viewModel.messages) { message in
                            ChatMessageView(message: message)
                                .id(message.id)
                        }
                    }
                    .padding()
                }
                .onChange(of: viewModel.messages.count) { _ in
                    if let lastMessage = viewModel.messages.last {
                        withAnimation {
                            proxy.scrollTo(lastMessage.id, anchor: .bottom)
                        }
                    }
                }
            }
            
            // Input
            HStack(spacing: 12) {
                TextField("Type a message...", text: $viewModel.inputText)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .onSubmit {
                        viewModel.sendMessage()
                    }
                
                Button(action: viewModel.sendMessage) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title2)
                        .foregroundColor(.primary)
                }
                .disabled(viewModel.inputText.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .padding()
        }
        .onAppear {
            viewModel.connect()
        }
        .onDisappear {
            viewModel.disconnect()
        }
    }
}

// Domains/Games/ViewModels/GameChatViewModel.swift
import Combine

class GameChatViewModel: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var inputText = ""
    @Published var isConnected = false
    
    private let gameId: String
    private let chatService: ChatRealtimeService
    private var cancellables = Set<AnyCancellable>()
    
    init(gameId: String, chatService: ChatRealtimeService = ChatRealtimeService.shared) {
        self.gameId = gameId
        self.chatService = chatService
    }
    
    func connect() {
        chatService.subscribeToChat(gameId: gameId) { [weak self] message in
            DispatchQueue.main.async {
                self?.messages.append(message)
            }
        }
        
        isConnected = true
    }
    
    func disconnect() {
        chatService.unsubscribeFromChat(gameId: gameId)
        isConnected = false
    }
    
    func sendMessage() {
        guard !inputText.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        
        let message = inputText
        inputText = ""
        
        Task {
            do {
                try await chatService.sendMessage(
                    gameId: gameId,
                    content: message
                )
            } catch {
                // Handle error
                await MainActor.run {
                    inputText = message // Restore on error
                }
            }
        }
    }
}
```

---

## Example 4: Create Game Form

### React (Web)

```typescript
// src/domains/games/components/CreateGame.tsx
export const CreateGame = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<GameFormData>();
  const { mutate: createGame, isPending } = useGameActions();
  
  const onSubmit = (data: GameFormData) => {
    createGame(data, {
      onSuccess: () => {
        toast.success('Game created!');
        navigate('/games');
      },
    });
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('title', { required: true })}
        placeholder="Game title"
      />
      {errors.title && <span>Title is required</span>}
      
      <Select {...register('sport')}>
        <option value="basketball">Basketball</option>
        <option value="soccer">Soccer</option>
      </Select>
      
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Game'}
      </Button>
    </form>
  );
};
```

### Swift (iOS)

```swift
// Domains/Games/Views/CreateGameView.swift
import SwiftUI

struct CreateGameView: View {
    @StateObject private var viewModel = CreateGameViewModel()
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            Form {
                Section("Game Details") {
                    TextField("Game Title", text: $viewModel.title)
                    if let error = viewModel.titleError {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                    
                    Picker("Sport", selection: $viewModel.selectedSport) {
                        ForEach(Sport.allCases, id: \.self) { sport in
                            Text(sport.rawValue.capitalized).tag(sport)
                        }
                    }
                }
                
                Section("Date & Time") {
                    DatePicker("Date", selection: $viewModel.date, displayedComponents: .date)
                    DatePicker("Time", selection: $viewModel.time, displayedComponents: .hourAndMinute)
                }
                
                Section("Location") {
                    LocationPickerView(selectedLocation: $viewModel.location)
                }
            }
            .navigationTitle("Create Game")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        Task {
                            await viewModel.createGame()
                            if viewModel.isSuccess {
                                dismiss()
                            }
                        }
                    }
                    .disabled(viewModel.isLoading || !viewModel.isValid)
                }
            }
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK") { }
            } message: {
                Text(viewModel.errorMessage ?? "Failed to create game")
            }
        }
    }
}

// Domains/Games/ViewModels/CreateGameViewModel.swift
import Combine

class CreateGameViewModel: ObservableObject {
    @Published var title = ""
    @Published var selectedSport: Sport = .basketball
    @Published var date = Date()
    @Published var time = Date()
    @Published var location: Location?
    @Published var isLoading = false
    @Published var isSuccess = false
    @Published var showError = false
    @Published var errorMessage: String?
    
    var titleError: String? {
        title.isEmpty ? "Title is required" : nil
    }
    
    var isValid: Bool {
        !title.isEmpty && location != nil
    }
    
    private let gameRepository: GameRepository
    
    init(gameRepository: GameRepository = GameRepository.shared) {
        self.gameRepository = gameRepository
    }
    
    func createGame() async {
        guard isValid else { return }
        
        await MainActor.run {
            isLoading = true
            errorMessage = nil
        }
        
        do {
            let gameData = GameCreate(
                title: title,
                sport: selectedSport.rawValue,
                date: date,
                time: time,
                location: location!
            )
            
            _ = try await gameRepository.createGame(gameData)
            
            await MainActor.run {
                isSuccess = true
                isLoading = false
            }
        } catch {
            await MainActor.run {
                errorMessage = error.localizedDescription
                showError = true
                isLoading = false
            }
        }
    }
}
```

---

## Example 5: Location Picker with Map

### React (Web)

```typescript
// src/domains/locations/components/LocationPicker.tsx
export const LocationPicker = ({ onSelect }: { onSelect: (location: Location) => void }) => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  
  return (
    <div>
      <GoogleMapView
        onLocationSelect={(location) => {
          setSelectedLocation(location);
          onSelect(location);
        }}
      />
      {selectedLocation && (
        <div>
          <p>{selectedLocation.name}</p>
          <p>{selectedLocation.address}</p>
        </div>
      )}
    </div>
  );
};
```

### Swift (iOS)

```swift
// Domains/Locations/Views/LocationPickerView.swift
import SwiftUI
import MapKit

struct LocationPickerView: View {
    @Binding var selectedLocation: Location?
    @StateObject private var locationService = LocationService.shared
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 29.6516, longitude: -82.3248),
        span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
    )
    @State private var searchText = ""
    @State private var searchResults: [MKMapItem] = []
    
    var body: some View {
        VStack {
            // Search Bar
            HStack {
                TextField("Search location...", text: $searchText)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .onSubmit {
                        searchLocation()
                    }
                
                Button(action: searchLocation) {
                    Image(systemName: "magnifyingglass")
                }
            }
            .padding()
            
            // Map
            Map(coordinateRegion: $region, annotationItems: selectedLocation != nil ? [selectedLocation!] : []) { location in
                MapMarker(
                    coordinate: CLLocationCoordinate2D(
                        latitude: location.latitude,
                        longitude: location.longitude
                    ),
                    tint: .primary
                )
            }
            .onTapGesture { location in
                // Handle map tap
            }
            .frame(height: 300)
            
            // Selected Location Info
            if let location = selectedLocation {
                VStack(alignment: .leading, spacing: 4) {
                    Text(location.name)
                        .font(.headline)
                    Text(location.address)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding()
            }
        }
    }
    
    private func searchLocation() {
        let request = MKLocalSearch.Request()
        request.naturalLanguageQuery = searchText
        request.region = region
        
        let search = MKLocalSearch(request: request)
        search.start { response, error in
            guard let response = response else { return }
            searchResults = response.mapItems
            
            if let firstResult = response.mapItems.first {
                let coordinate = firstResult.placemark.coordinate
                region.center = coordinate
                selectedLocation = Location(
                    name: firstResult.name ?? "",
                    address: firstResult.placemark.title ?? "",
                    latitude: coordinate.latitude,
                    longitude: coordinate.longitude
                )
            }
        }
    }
}
```

---

## Key Patterns

### 1. State Management
- **React**: `useState`, `useQuery`, Zustand
- **Swift**: `@State`, `@StateObject`, `@Published` properties

### 2. Data Fetching
- **React**: React Query hooks
- **Swift**: `async/await` with `Task` and Combine

### 3. Navigation
- **React**: `useNavigate()` from React Router
- **Swift**: `NavigationStack` with programmatic navigation

### 4. Forms
- **React**: React Hook Form
- **Swift**: `@State` properties with validation

### 5. Real-time
- **React**: Supabase Realtime hooks
- **Swift**: Supabase Realtime channels with Combine publishers

---

These examples demonstrate the translation patterns from React to Swift. The key is maintaining the same business logic while adapting to iOS-native patterns and SwiftUI's declarative syntax.
