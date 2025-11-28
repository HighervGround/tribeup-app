import { supabase } from '@/core/database/supabase';

/**
 * User data export for GDPR compliance
 * Aggregates all user data from Supabase and returns it in a machine-readable format
 */

export interface UserDataExport {
  exportDate: string;
  profile: ProfileData | null;
  gamesCreated: GameData[];
  gamesJoined: ParticipationData[];
  tribes: TribeData[];
  tribeMemberships: TribeMembershipData[];
  chatMessages: ChatMessageData[];
  notifications: NotificationData[];
}

interface ProfileData {
  id: string;
  email: string;
  username: string | null;
  fullName: string | null;
  bio: string | null;
  location: string | null;
  avatarUrl: string | null;
  preferredSports: string[] | null;
  role: string;
  onboardingCompleted: boolean | null;
  createdAt: string | null;
}

interface GameData {
  id: string;
  title: string;
  sport: string;
  date: string;
  time: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  maxPlayers: number;
  currentPlayers: number | null;
  cost: string | null;
  imageUrl: string | null;
  createdAt: string | null;
}

interface ParticipationData {
  gameId: string | null;
  gameTitle?: string;
  sport?: string;
  status: string | null;
  joinedAt: string | null;
  leftAt: string | null;
  rating: number | null;
  review: string | null;
  playTimeMinutes: number | null;
}

interface TribeData {
  id: string;
  name: string;
  description: string | null;
  activity: string;
  location: string | null;
  memberCount: number;
  gameCount: number;
  createdAt: string | null;
}

interface TribeMembershipData {
  tribeId: string;
  tribeName?: string;
  role: string;
  status: string;
  joinedAt: string | null;
}

interface ChatMessageData {
  id: string;
  gameId: string | null;
  message: string;
  createdAt: string | null;
}

interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean | null;
  createdAt: string | null;
}

/**
 * Exports all user data for GDPR compliance
 * @returns Promise<UserDataExport> All user data in a structured format
 * @throws Error if user is not authenticated or if data fetch fails
 */
export async function exportUserData(): Promise<UserDataExport> {
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('You must be authenticated to export your data');
  }

  const userId = user.id;

  // Fetch all user data in parallel for better performance
  const [
    profileResult,
    gamesCreatedResult,
    gamesJoinedResult,
    tribesCreatedResult,
    tribeMembershipsResult,
    chatMessagesResult,
    notificationsResult,
  ] = await Promise.all([
    // User profile
    supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single(),
    
    // Games created by user
    supabase
      .from('games')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false }),
    
    // Games joined by user (with game details)
    supabase
      .from('game_participants')
      .select(`
        *,
        games:game_id (
          title,
          sport
        )
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false }),
    
    // Tribes created by user
    supabase
      .from('tribes')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false }),
    
    // Tribe memberships (with tribe details)
    supabase
      .from('tribe_members')
      .select(`
        *,
        tribes:tribe_id (
          name
        )
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false }),
    
    // Chat messages
    supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    
    // Notifications
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ]);

  // Handle errors (log but don't fail the entire export)
  if (profileResult.error) {
    console.error('Error fetching profile:', profileResult.error);
  }
  if (gamesCreatedResult.error) {
    console.error('Error fetching created games:', gamesCreatedResult.error);
  }
  if (gamesJoinedResult.error) {
    console.error('Error fetching joined games:', gamesJoinedResult.error);
  }
  if (tribesCreatedResult.error) {
    console.error('Error fetching tribes:', tribesCreatedResult.error);
  }
  if (tribeMembershipsResult.error) {
    console.error('Error fetching tribe memberships:', tribeMembershipsResult.error);
  }
  if (chatMessagesResult.error) {
    console.error('Error fetching chat messages:', chatMessagesResult.error);
  }
  if (notificationsResult.error) {
    console.error('Error fetching notifications:', notificationsResult.error);
  }

  // Transform profile data
  const profile: ProfileData | null = profileResult.data ? {
    id: profileResult.data.id,
    email: profileResult.data.email,
    username: profileResult.data.username,
    fullName: profileResult.data.full_name,
    bio: profileResult.data.bio,
    location: profileResult.data.location,
    avatarUrl: profileResult.data.avatar_url,
    preferredSports: profileResult.data.preferred_sports,
    role: profileResult.data.role,
    onboardingCompleted: profileResult.data.onboarding_completed,
    createdAt: profileResult.data.created_at,
  } : null;

  // Transform games created
  const gamesCreated: GameData[] = (gamesCreatedResult.data || []).map(game => ({
    id: game.id,
    title: game.title,
    sport: game.sport,
    date: game.date,
    time: game.time,
    location: game.location,
    latitude: game.latitude,
    longitude: game.longitude,
    description: game.description,
    maxPlayers: game.max_players,
    currentPlayers: game.current_players,
    cost: game.cost,
    imageUrl: game.image_url,
    createdAt: game.created_at,
  }));

  // Transform games joined
  const gamesJoined: ParticipationData[] = (gamesJoinedResult.data || []).map(participation => ({
    gameId: participation.game_id,
    gameTitle: (participation.games as { title?: string } | null)?.title,
    sport: (participation.games as { sport?: string } | null)?.sport,
    status: participation.status,
    joinedAt: participation.joined_at,
    leftAt: participation.left_at,
    rating: participation.rating,
    review: participation.review,
    playTimeMinutes: participation.play_time_minutes,
  }));

  // Transform tribes created
  const tribes: TribeData[] = (tribesCreatedResult.data || []).map(tribe => ({
    id: tribe.id,
    name: tribe.name,
    description: tribe.description,
    activity: tribe.activity,
    location: tribe.location,
    memberCount: tribe.member_count,
    gameCount: tribe.game_count,
    createdAt: tribe.created_at,
  }));

  // Transform tribe memberships
  const tribeMemberships: TribeMembershipData[] = (tribeMembershipsResult.data || []).map(membership => ({
    tribeId: membership.tribe_id,
    tribeName: (membership.tribes as { name?: string } | null)?.name,
    role: membership.role,
    status: membership.status,
    joinedAt: membership.joined_at,
  }));

  // Transform chat messages
  const chatMessages: ChatMessageData[] = (chatMessagesResult.data || []).map(message => ({
    id: message.id,
    gameId: message.game_id,
    message: message.message,
    createdAt: message.created_at,
  }));

  // Transform notifications
  const notifications: NotificationData[] = (notificationsResult.data || []).map(notification => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    read: notification.read,
    createdAt: notification.created_at,
  }));

  return {
    exportDate: new Date().toISOString(),
    profile,
    gamesCreated,
    gamesJoined,
    tribes,
    tribeMemberships,
    chatMessages,
    notifications,
  };
}

/**
 * Downloads user data as a JSON file
 * @param data The user data export object
 * @param filename Optional filename (default: tribeup-data-export-{timestamp}.json)
 */
export function downloadDataAsJson(data: UserDataExport, filename?: string): void {
  const timestamp = new Date().toISOString().split('T')[0];
  const defaultFilename = `tribeup-data-export-${timestamp}.json`;
  
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object after a short delay to ensure download completes
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Converts user data export to CSV format (profile section only for simplicity)
 * For full CSV export, consider exporting each section as a separate CSV file
 */
export function convertProfileToCsv(profile: ProfileData | null): string {
  if (!profile) {
    return 'No profile data available';
  }

  const headers = [
    'ID',
    'Email',
    'Username',
    'Full Name',
    'Bio',
    'Location',
    'Preferred Sports',
    'Role',
    'Onboarding Completed',
    'Created At',
  ];

  const values: string[] = [
    profile.id,
    profile.email,
    profile.username || '',
    profile.fullName || '',
    profile.bio || '',
    profile.location || '',
    (profile.preferredSports || []).join('; '),
    profile.role,
    profile.onboardingCompleted ? 'Yes' : 'No',
    profile.createdAt || '',
  ];

  // Escape values for CSV (handle commas and quotes)
  const escapeCsvValue = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  return [
    headers.join(','),
    values.map(escapeCsvValue).join(','),
  ].join('\n');
}
