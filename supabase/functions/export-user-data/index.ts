// GDPR Data Export Edge Function
// Issue #40: https://github.com/HighervGround/React-TribeUp-Social-Sports-App/issues/40
//
// This Edge Function exports all user data in compliance with GDPR Article 15 (Right of Access)
// and Article 20 (Right to Data Portability).
//
// Security: Uses explicit user_id filtering in queries, not relying on RLS policies

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExportMetadata {
  user_id: string
  exported_at: string
  version: string
  format: string
}

interface UserDataExport {
  export_metadata: ExportMetadata
  profile: any
  games_created: any[]
  games_joined: any[]
  game_participants: any[]
  chat_messages: any[]
  tribe_chat_messages: any[]
  notifications: any[]
  tribes_owned: any[]
  tribe_memberships: any[]
  user_connections: any[]
  user_stats: any
  user_presence: any[]
  user_achievements: any[]
  rsvps: any[]
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const userId = user.id

    console.log(`Exporting data for user: ${userId}`)

    // Rate limiting check - max 1 export per 24 hours
    const { data: recentExports, error: rateLimitError } = await supabaseClient
      .from('user_data_exports')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1)

    if (!rateLimitError && recentExports && recentExports.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'You can only request one data export every 24 hours',
          next_available: new Date(new Date(recentExports[0].created_at).getTime() + 24 * 60 * 60 * 1000).toISOString(),
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Initialize export data structure
    const exportData: UserDataExport = {
      export_metadata: {
        user_id: userId,
        exported_at: new Date().toISOString(),
        version: '1.0',
        format: 'json',
      },
      profile: null,
      games_created: [],
      games_joined: [],
      game_participants: [],
      chat_messages: [],
      tribe_chat_messages: [],
      notifications: [],
      tribes_owned: [],
      tribe_memberships: [],
      user_connections: [],
      user_stats: null,
      user_presence: [],
      user_achievements: [],
      rsvps: [],
    }

    // ============================================================================
    // FETCH USER PROFILE DATA
    // ============================================================================
    
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
    } else {
      exportData.profile = profile
    }

    // ============================================================================
    // FETCH GAMES CREATED BY USER
    // ============================================================================
    
    const { data: gamesCreated, error: gamesCreatedError } = await supabaseClient
      .from('games')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false })

    if (gamesCreatedError) {
      console.error('Error fetching games created:', gamesCreatedError)
    } else {
      exportData.games_created = gamesCreated || []
    }

    // ============================================================================
    // FETCH GAME PARTICIPATIONS
    // ============================================================================
    
    const { data: gameParticipants, error: gameParticipantsError } = await supabaseClient
      .from('game_participants')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (gameParticipantsError) {
      console.error('Error fetching game participants:', gameParticipantsError)
    } else {
      exportData.game_participants = gameParticipants || []
      
      // Fetch full game details for games user joined
      if (gameParticipants && gameParticipants.length > 0) {
        const gameIds = gameParticipants.map(p => p.game_id)
        const { data: gamesJoined, error: gamesJoinedError } = await supabaseClient
          .from('games')
          .select('*')
          .in('id', gameIds)
          .order('created_at', { ascending: false })

        if (!gamesJoinedError) {
          exportData.games_joined = gamesJoined || []
        }
      }
    }

    // ============================================================================
    // FETCH RSVPs
    // ============================================================================
    
    const { data: rsvps, error: rsvpsError } = await supabaseClient
      .from('rsvps')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (rsvpsError) {
      console.error('Error fetching RSVPs:', rsvpsError)
    } else {
      exportData.rsvps = rsvps || []
    }

    // ============================================================================
    // FETCH CHAT MESSAGES
    // ============================================================================
    
    const { data: chatMessages, error: chatMessagesError } = await supabaseClient
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (chatMessagesError) {
      console.error('Error fetching chat messages:', chatMessagesError)
    } else {
      exportData.chat_messages = chatMessages || []
    }

    // ============================================================================
    // FETCH TRIBE CHAT MESSAGES
    // ============================================================================
    
    const { data: tribeChatMessages, error: tribeChatMessagesError } = await supabaseClient
      .from('tribe_chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (tribeChatMessagesError) {
      console.error('Error fetching tribe chat messages:', tribeChatMessagesError)
    } else {
      exportData.tribe_chat_messages = tribeChatMessages || []
    }

    // ============================================================================
    // FETCH NOTIFICATIONS
    // ============================================================================
    
    const { data: notifications, error: notificationsError } = await supabaseClient
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError)
    } else {
      exportData.notifications = notifications || []
    }

    // ============================================================================
    // FETCH TRIBE MEMBERSHIPS
    // ============================================================================
    
    const { data: tribeMemberships, error: tribeMembershipsError } = await supabaseClient
      .from('tribe_members')
      .select('*')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false })

    if (tribeMembershipsError) {
      console.error('Error fetching tribe memberships:', tribeMembershipsError)
    } else {
      exportData.tribe_memberships = tribeMemberships || []
    }

    // Fetch tribes owned by user
    const { data: tribesOwned, error: tribesOwnedError } = await supabaseClient
      .from('tribes')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })

    if (tribesOwnedError) {
      console.error('Error fetching tribes owned:', tribesOwnedError)
    } else {
      exportData.tribes_owned = tribesOwned || []
    }

    // ============================================================================
    // FETCH USER CONNECTIONS (FRIENDS/FOLLOWERS)
    // ============================================================================
    
    const { data: userConnections, error: userConnectionsError } = await supabaseClient
      .from('user_connections')
      .select('*')
      .or(`follower_id.eq.${userId},following_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (userConnectionsError) {
      console.error('Error fetching user connections:', userConnectionsError)
    } else {
      exportData.user_connections = userConnections || []
    }

    // ============================================================================
    // FETCH USER STATS
    // ============================================================================
    
    const { data: userStats, error: userStatsError } = await supabaseClient
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (userStatsError && userStatsError.code !== 'PGRST116') {
      console.error('Error fetching user stats:', userStatsError)
    } else {
      exportData.user_stats = userStats
    }

    // ============================================================================
    // FETCH USER PRESENCE
    // ============================================================================
    
    const { data: userPresence, error: userPresenceError } = await supabaseClient
      .from('user_presence')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (userPresenceError) {
      console.error('Error fetching user presence:', userPresenceError)
    } else {
      exportData.user_presence = userPresence || []
    }

    // ============================================================================
    // FETCH USER ACHIEVEMENTS
    // ============================================================================
    
    const { data: userAchievements, error: userAchievementsError } = await supabaseClient
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })

    if (userAchievementsError) {
      console.error('Error fetching user achievements:', userAchievementsError)
    } else {
      exportData.user_achievements = userAchievements || []
    }

    // ============================================================================
    // LOG EXPORT REQUEST FOR AUDIT TRAIL
    // ============================================================================
    
    const { error: auditError } = await supabaseClient
      .from('user_data_exports')
      .insert({
        user_id: userId,
        export_type: 'full',
        status: 'completed',
        requested_at: exportData.export_metadata.exported_at,
        completed_at: new Date().toISOString(),
      })

    if (auditError) {
      console.error('Error logging export request:', auditError)
      // Continue anyway - audit logging shouldn't block the export
    }

    // ============================================================================
    // RETURN EXPORT DATA
    // ============================================================================
    
    console.log(`Successfully exported data for user: ${userId}`)
    
    return new Response(
      JSON.stringify(exportData, null, 2),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="tribeup-data-export-${userId}-${Date.now()}.json"`,
        },
      }
    )

  } catch (error) {
    console.error('Unexpected error during data export:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
