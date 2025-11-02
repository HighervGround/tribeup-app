import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { SupabaseService } from '@/core/database/supabaseService';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  username?: string;
  bio?: string;
  location?: string;
  role: 'user' | 'moderator' | 'admin';
  preferences: UserPreferences;
}

export interface Game {
  id: string;
  title: string;
  sport: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  latitude?: number;
  longitude?: number;
  maxPlayers: number;
  totalPlayers: number; // Total participants from games_with_counts.total_players (DO NOT recalculate)
  availableSpots: number; // Available capacity from games_with_counts.available_spots (DO NOT recalculate)
  cost: string;
  description: string;
  imageUrl: string;
  sportColor: string;
  isJoined: boolean;
  createdBy: string;
  createdAt: string;
  // Host profile data
  creatorId?: string;
  creatorData?: {
    id: string;
    name: string;
    avatar?: string;
    username?: string;
    rating?: string | number;
  };
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  colorBlindFriendly: boolean;
  // Optional list of sports from the DB profile
  sports?: string[];
  notifications: {
    push: boolean;
    email: boolean;
    gameReminders: boolean;
  };
  privacy: {
    locationSharing: boolean;
    profileVisibility: 'public' | 'players' | 'private';
  };
}

export interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  
  // Games state
  games: Game[];
  myGames: Game[];
  nearbyGames: Game[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Chat state
  chatContext: { type: 'game' | 'direct', id: string, title: string } | null;
  
  // Search state
  searchFilters: {
    sports: string[];
    dateRange: { start: Date | null; end: Date | null };
    distance: number;
    priceRange: { min: number; max: number };
  };
}

export interface AppActions {
  // User actions
  setUser: (user: User | null) => void;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  signOut: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  initializeAuth: () => Promise<void>;
  
  // Games actions
  setGames: (games: Game[]) => void;
  addGame: (game: Game) => void;
  updateGame: (gameId: string, updates: Partial<Game>) => void;
  joinGame: (gameId: string) => void;
  leaveGame: (gameId: string) => void;
  
  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Chat actions
  setChatContext: (context: { type: 'game' | 'direct', id: string, title: string } | null) => void;
  
  // Search actions
  updateSearchFilters: (filters: Partial<AppState['searchFilters']>) => void;
  clearSearchFilters: () => void;
  
  // Utility actions
  reset: () => void;
}

// Default values
const defaultPreferences: UserPreferences = {
  theme: 'auto',
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  colorBlindFriendly: false,
  notifications: {
    push: true,
    email: false,
    gameReminders: true,
  },
  privacy: {
    locationSharing: true,
    profileVisibility: 'public',
  },
};

const defaultSearchFilters: AppState['searchFilters'] = {
  sports: [],
  dateRange: { start: null, end: null },
  distance: 25,
  priceRange: { min: 0, max: 100 },
};

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  games: [],
  myGames: [],
  nearbyGames: [],
  isLoading: false,
  error: null,
  chatContext: null,
  searchFilters: defaultSearchFilters,
};

// Create the store
export const useAppStore = create<AppState & AppActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,
      
      // User actions
      setUser: (user) => set((state) => {
        state.user = user;
        state.isAuthenticated = !!user;
      }),
      
      updateUserPreferences: async (preferences) => {
        const { setLoading, setError } = get();
        try {
          setLoading(true);
          const currentUser = await SupabaseService.getCurrentUser();
          if (currentUser) {
            await SupabaseService.updateUserProfile(currentUser.id, { preferences });
            set((state) => {
              if (state.user) {
                state.user.preferences = { ...state.user.preferences, ...preferences };
              }
            });
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to update preferences');
        } finally {
          setLoading(false);
        }
      },
      
      signOut: async () => {
        const { setLoading, setError } = get();
        try {
          setLoading(true);
          await SupabaseService.signOut();
          set((state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.myGames = [];
            state.chatContext = null;
          });
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to sign out');
        } finally {
          setLoading(false);
        }
      },

      signIn: async (email: string, password: string) => {
        const { setLoading, setError } = get();
        try {
          setLoading(true);
          const { user } = await SupabaseService.signIn(email, password);
          if (user) {
            const userProfile = await SupabaseService.getUserProfile(user.id);
            set((state) => {
              state.user = userProfile;
              state.isAuthenticated = true;
            });
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to sign in');
        } finally {
          setLoading(false);
        }
      },

      signUp: async (email: string, password: string, userData: Partial<User>) => {
        const { setLoading, setError } = get();
        try {
          setLoading(true);
          const { user } = await SupabaseService.signUp(email, password, userData);
          if (user) {
            const userProfile = await SupabaseService.getUserProfile(user.id);
            set((state) => {
              state.user = userProfile;
              state.isAuthenticated = true;
            });
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to sign up');
        } finally {
          setLoading(false);
        }
      },

      initializeAuth: async () => {
        const { setLoading, setError, setGames } = get();
        const state = get();
        
        // Prevent multiple simultaneous calls with a flag
        if (state.isLoading || (state as any).isInitializing) {
          return;
        }
        
        // Set initializing flag to prevent race conditions
        set((state) => { (state as any).isInitializing = true; });
        
        try {
          setLoading(true);
          
          // Only load games if we don't have them already
          if (state.games.length === 0) {
            const gamesData = await SupabaseService.getGames();
            setGames(gamesData);
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to initialize auth');
        } finally {
          setLoading(false);
          // Clear initializing flag to prevent race conditions
          set((state) => { (state as any).isInitializing = false; });
        }
      },
      
      // Games actions
      setGames: (games: Game[]) => {
        set((state) => {
          state.games = games;
          state.isLoading = false;
          // Update derived state
          const userId = state.user?.id;
          state.myGames = games.filter(game => game.createdBy === userId || game.isJoined);
          state.nearbyGames = games.slice(0, 10); // Simplified nearby logic
        });
      },
      
      addGame: async (gameData) => {
        const { setLoading, setError } = get();
        try {
          setLoading(true);
          const newGame = await SupabaseService.createGame(gameData);
          set((state) => {
            if (newGame && typeof newGame === 'object') {
              state.games.unshift(newGame as any);
              // Add to my games if I created it
              const game = newGame as any;
              if (game.createdBy === state.user?.id || game.creatorId === state.user?.id) {
                state.myGames.unshift(newGame as any);
              }
            }
          });
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to create game');
        } finally {
          setLoading(false);
        }
      },
      
      updateGame: async (gameId, updates) => {
        const { setLoading, setError } = get();
        try {
          setLoading(true);
          
          // Call the actual Supabase service to update the database
          const updatedGame = await SupabaseService.updateGame(gameId, updates);
          
          // Update local state with the response from database
          set((state) => {
            const gameIndex = state.games.findIndex(g => g.id === gameId);
            if (gameIndex !== -1) {
              state.games[gameIndex] = updatedGame;
            }
            
            // Update in myGames if present
            const myGameIndex = state.myGames.findIndex(g => g.id === gameId);
            if (myGameIndex !== -1) {
              state.myGames[myGameIndex] = updatedGame;
            }
          });
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to update game');
          throw error; // Re-throw so UI can handle the error
        } finally {
          setLoading(false);
        }
      },
      
      joinGame: async (gameId) => {
        console.warn('🚫 Zustand joinGame method is deprecated - use React Query mutations instead');
        // This method is disabled to prevent conflicts with React Query mutations
        // Use useJoinGame() hook instead
      },
      
      leaveGame: async (gameId) => {
        console.warn('🚫 Zustand leaveGame method is deprecated - use React Query mutations instead');
        // This method is disabled to prevent conflicts with React Query mutations
        // Use useLeaveGame() hook instead
      },
      
      // UI actions
      setLoading: (loading) => set((state) => {
        state.isLoading = loading;
      }),
      
      setError: (error) => set((state) => {
        state.error = error;
        state.isLoading = false;
      }),
      
      clearError: () => set((state) => {
        state.error = null;
      }),
      
      // Chat actions
      setChatContext: (context) => set((state) => {
        state.chatContext = context;
      }),
      
      // Search actions
      updateSearchFilters: (filters) => set((state) => {
        state.searchFilters = { ...state.searchFilters, ...filters };
      }),
      
      clearSearchFilters: () => set((state) => {
        state.searchFilters = defaultSearchFilters;
      }),
      
      // Utility actions
      reset: () => set(() => initialState),
    })),
    {
      name: 'tribeup-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        searchFilters: state.searchFilters,
        // Don't persist games, chat context, or loading states
      }),
    }
  )
);

// Selectors for derived state
export const useUser = () => useAppStore((state) => state.user);
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated);
export const useGames = () => useAppStore((state) => state.games);
export const useMyGames = () => useAppStore((state) => state.myGames);
export const useNearbyGames = () => useAppStore((state) => state.nearbyGames);
export const useAppLoading = () => useAppStore((state) => state.isLoading);
export const useAppError = () => useAppStore((state) => state.error);
export const useChatContext = () => useAppStore((state) => state.chatContext);
export const useSearchFilters = () => useAppStore((state) => state.searchFilters);

// Action selectors
export const useAppActions = () => useAppStore((state) => ({
  setUser: state.setUser,
  updateUserPreferences: state.updateUserPreferences,
  signOut: state.signOut,
  signIn: state.signIn,
  signUp: state.signUp,
  initializeAuth: state.initializeAuth,
  setGames: state.setGames,
  addGame: state.addGame,
  updateGame: state.updateGame,
  joinGame: state.joinGame,
  leaveGame: state.leaveGame,
  setLoading: state.setLoading,
  setError: state.setError,
  clearError: state.clearError,
  setChatContext: state.setChatContext,
  updateSearchFilters: state.updateSearchFilters,
  clearSearchFilters: state.clearSearchFilters,
  reset: state.reset,
}));