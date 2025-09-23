import { create } from 'zustand';

export type PresenceUser = {
  user_id: string;
  name: string;
  avatar?: string;
  last_seen: string;
  status?: 'online' | 'in_game' | 'away';
};

type PresenceState = {
  onlineUsers: Record<string, PresenceUser>;
  channelStatus: 'closed' | 'joining' | 'joined' | 'error';
  usePolling: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setOnlineUsers: (users: Record<string, PresenceUser>) => void;
  setChannelStatus: (status: PresenceState['channelStatus']) => void;
  setUsePolling: (value: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
};

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineUsers: {},
  channelStatus: 'closed',
  usePolling: false,
  isLoading: true,
  error: null,
  
  setOnlineUsers: (users) => set({ onlineUsers: users }),
  setChannelStatus: (status) => set({ channelStatus: status }),
  setUsePolling: (value) => set({ usePolling: value }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
