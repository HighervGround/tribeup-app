import { useCurrentUserImage } from '@/hooks/use-current-user-image'
import { useCurrentUserName } from '@/hooks/use-current-user-name'
import { supabase } from '@/lib/supabase'
import { useEffect, useState, useRef } from 'react'

export type RealtimeUser = {
  id: string
  name: string
  image: string
  lastSeen?: string
}

export const useRealtimePresenceRoom = (roomName: string) => {
  const currentUserImage = useCurrentUserImage()
  const currentUserName = useCurrentUserName()

  const [users, setUsers] = useState<Record<string, RealtimeUser>>({})
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    let isSubscribed = false

    const setupPresence = async () => {
      try {
        // Get authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.warn('[Presence] No authenticated user; presence disabled for room:', roomName)
          return
        }

        console.log('[Presence] Setting up for room:', roomName, 'user:', user.id)

        // Important: use user.id as presence key so multiple tabs collapse to one entry
        const channel = supabase.channel(`room:${roomName}:presence`, {
          config: {
            private: true,                  // ✅ important for auth-protected channels
            presence: { key: user.id },     // ✅ dedupe by user
          },
        })

        channelRef.current = channel

        // Set auth BEFORE subscribing
        const { data: { session } } = await supabase.auth.getSession()
        await supabase.realtime.setAuth(session?.access_token || '') // ✅ always a string

        // Handle presence sync (do not gate with isSubscribed)
        channel.on('presence', { event: 'sync' }, () => {
          const newState = channel.presenceState()
          
          // State is an object keyed by presence.key (user.id), values are arrays of metas
          // Using Object.keys(state).length gives a deduped online count
          const dedupedUsers = Object.keys(newState)
          
          console.log('[Presence] Online users in', roomName, ':', dedupedUsers.length)

          const newUsers = Object.fromEntries(
            Object.entries(newState).map(([userId, values]) => {
              const userValues = values as Array<{ name: string; image: string; last_seen?: string }>;
              return [
                userId,
                {
                  id: userId,
                  name: userValues[0]?.name || 'Anonymous',
                  image: userValues[0]?.image || '',
                  lastSeen: userValues[0]?.last_seen,
                },
              ];
            })
          ) as Record<string, RealtimeUser>
          
          setUsers(newUsers)
        })

        // Optional: handle join/leave events for fine-grained reactions
        channel.on('presence', { event: 'join' }, () => {
          console.log('[Presence] User joined room:', roomName)
        })

        channel.on('presence', { event: 'leave' }, () => {
          console.log('[Presence] User left room:', roomName)
        })

        // Subscribe to the channel
        const status = await channel.subscribe()
        
        if (status !== 'SUBSCRIBED') {
          console.warn('[Presence] Channel not subscribed:', status)
          return
        }

        isSubscribed = true
        console.log('[Presence] Successfully subscribed to room:', roomName)

        // Track initial presence AFTER subscribed
        await channel.track({
          name: currentUserName || 'Anonymous',
          image: currentUserImage || '',
          last_seen: new Date().toISOString(),
        })

        // Refresh last_seen every 30s
        intervalRef.current = setInterval(() => {
          if (channelRef.current) {
            channelRef.current.track({
              last_seen: new Date().toISOString(),
            }).catch((err: any) => {
              console.error('[Presence] Error updating last_seen:', err)
            })
          }
        }, 30000)

      } catch (error) {
        console.error('[Presence] Setup error:', error)
      }
    }

    setupPresence()

    // Cleanup to avoid duplicate subscriptions
    return () => {
      isSubscribed = false
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      
      if (channelRef.current) {
        console.log('[Presence] Cleaning up room:', roomName)
        supabase.removeChannel(channelRef.current).catch((err) => {
          console.error('[Presence] Error removing channel:', err)
        })
        channelRef.current = null
      }
    }
  }, [roomName, currentUserName, currentUserImage])

  return { users }
}
