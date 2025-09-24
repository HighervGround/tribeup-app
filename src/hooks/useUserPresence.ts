import { useState } from 'react';

interface OnlineUser {
  id: string;
  name: string;
  avatar?: string;
  lastSeen: string;
}

export function useUserPresence() {
  return {
    onlineUsers: [] as OnlineUser[],
    onlineCount: 0,
    isLoading: false,
    error: null,
    isRealtime: false,
    isPolling: false,
    connectionStatus: 'closed' as const,
  };
}
