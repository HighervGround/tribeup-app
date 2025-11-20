// Realtime hooks disabled to prevent WebSocket connection overhead
// These hooks are kept for API compatibility but return no-op values

export function useGameRealtime(gameId?: string) {
  return {
    isConnected: false
  };
}

export function useAllGamesRealtime() {
  return {
    isConnected: false,
    isDisabled: true,
    connectionAttempts: 0
  };
}
