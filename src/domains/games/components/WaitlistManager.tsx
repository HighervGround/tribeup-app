import React, { useState, useEffect } from 'react';
import { Clock, Users, AlertCircle, CheckCircle, X } from 'lucide-react';
import { SupabaseService } from '@/core/database/supabaseService';
import { useAppStore } from '@/store/appStore';

interface WaitlistEntry {
  id: string;
  position: number;
  joinedAt: string;
  status: 'waiting' | 'notified' | 'expired' | 'joined';
  expiresAt?: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  };
}

interface WaitlistManagerProps {
  gameId: string;
  isGameFull: boolean;
  currentPlayers: number;
  maxPlayers: number;
  isUserJoined: boolean;
  onGameJoin?: () => void;
}

export const WaitlistManager: React.FC<WaitlistManagerProps> = ({
  gameId,
  isGameFull,
  currentPlayers,
  maxPlayers,
  isUserJoined,
  onGameJoin
}) => {
  const { user } = useAppStore();
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [userWaitlistStatus, setUserWaitlistStatus] = useState<{
    isOnWaitlist: boolean;
    position?: number;
    status?: string;
  }>({ isOnWaitlist: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);

  useEffect(() => {
    if (gameId) {
      loadWaitlistData();
    }
  }, [gameId]);

  const loadWaitlistData = async () => {
    try {
      const [waitlistData, userStatus] = await Promise.all([
        SupabaseService.getGameWaitlist(gameId),
        user ? SupabaseService.getUserWaitlistStatus(gameId) : Promise.resolve({ isOnWaitlist: false })
      ]);
      
      setWaitlist(waitlistData);
      setUserWaitlistStatus(userStatus);
    } catch (err) {
      console.error('Error loading waitlist data:', err);
      setError('Failed to load waitlist information');
    }
  };

  const handleJoinWaitlist = async () => {
    if (!user) {
      setError('Please sign in to join the waitlist');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await SupabaseService.joinWaitlist(gameId);
      if (result.success) {
        await loadWaitlistData();
        // Show success message
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to join waitlist');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveWaitlist = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await SupabaseService.leaveWaitlist(gameId);
      if (result.success) {
        await loadWaitlistData();
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to leave waitlist');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFromWaitlist = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await SupabaseService.joinFromWaitlist(gameId);
      if (result.success) {
        await loadWaitlistData();
        onGameJoin?.();
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to join game from waitlist');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'notified':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'expired':
        return <X className="w-4 h-4 text-red-500" />;
      case 'joined':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'Waiting';
      case 'notified':
        return 'Notified';
      case 'expired':
        return 'Expired';
      case 'joined':
        return 'Joined';
      default:
        return 'Unknown';
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  // Don't show waitlist manager if game isn't full and user isn't on waitlist
  if (!isGameFull && !userWaitlistStatus.isOnWaitlist && waitlist.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Waitlist ({waitlist.length})
          </h3>
        </div>
        {waitlist.length > 0 && (
          <button
            onClick={() => setShowWaitlist(!showWaitlist)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showWaitlist ? 'Hide' : 'Show'} Waitlist
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* User's waitlist status */}
      {userWaitlistStatus.isOnWaitlist && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon(userWaitlistStatus.status || 'waiting')}
              <span className="text-sm font-medium text-blue-900">
                You're #{userWaitlistStatus.position} on the waitlist
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {userWaitlistStatus.status === 'notified' && (
                <button
                  onClick={handleJoinFromWaitlist}
                  disabled={loading}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Join Game
                </button>
              )}
              <button
                onClick={handleLeaveWaitlist}
                disabled={loading}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Leave Waitlist
              </button>
            </div>
          </div>
          {userWaitlistStatus.status === 'notified' && (
            <p className="text-xs text-blue-700 mt-1">
              A spot is available! You have 24 hours to join.
            </p>
          )}
        </div>
      )}

      {/* Join waitlist button */}
      {isGameFull && !isUserJoined && !userWaitlistStatus.isOnWaitlist && user && (
        <div className="mb-4">
          <button
            onClick={handleJoinWaitlist}
            disabled={loading}
            className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Joining...' : 'Join Waitlist'}
          </button>
          <p className="text-xs text-gray-600 mt-1 text-center">
            You'll be notified if a spot opens up
          </p>
        </div>
      )}

      {/* Game capacity info */}
      <div className="mb-4 p-3 bg-gray-50 rounded-md">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Game Capacity:</span>
          <span className="font-medium text-gray-900">
            {currentPlayers}/{maxPlayers} players
          </span>
        </div>
        {isGameFull && (
          <div className="mt-1">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full" 
                style={{ width: '100%' }}
              />
            </div>
            <p className="text-xs text-red-600 mt-1">Game is full</p>
          </div>
        )}
      </div>

      {/* Waitlist entries */}
      {showWaitlist && waitlist.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Waitlist Queue</h4>
          {waitlist.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
            >
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-900 w-6">
                  #{entry.position}
                </span>
                {entry.user.avatarUrl ? (
                  <img
                    src={entry.user.avatarUrl}
                    alt={entry.user.name}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-xs text-gray-600">
                      {entry.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-sm text-gray-900">{entry.user.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                {entry.status === 'notified' && entry.expiresAt && (
                  <span className="text-xs text-blue-600">
                    {formatTimeRemaining(entry.expiresAt)}
                  </span>
                )}
                <div className="flex items-center space-x-1">
                  {getStatusIcon(entry.status)}
                  <span className="text-xs text-gray-600">
                    {getStatusText(entry.status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty waitlist message */}
      {waitlist.length === 0 && isGameFull && (
        <div className="text-center py-4">
          <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No one is on the waitlist yet</p>
          {!isUserJoined && user && (
            <p className="text-xs text-gray-500 mt-1">Be the first to join!</p>
          )}
        </div>
      )}
    </div>
  );
};
