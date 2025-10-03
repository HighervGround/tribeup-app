import { useCurrentUserImage } from '@/hooks/use-current-user-image'
import { useCurrentUserName } from '@/hooks/use-current-user-name'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export type RealtimeUser = {
  id: string
  name: string
  image: string
}

export const useRealtimePresenceRoom = (roomName: string) => {
  const currentUserImage = useCurrentUserImage()
  const currentUserName = useCurrentUserName()

  const [users, setUsers] = useState<Record<string, RealtimeUser>>({})

  useEffect(() => {
    const room = supabase.channel(roomName)

    room
      .on('presence', { event: 'sync' }, () => {
        const newState = room.presenceState()

        const newUsers = Object.fromEntries(
          Object.entries(newState).map(([key, values]) => {
            const userValues = values as Array<{ image: string; name: string }>;
            return [
              key,
              { id: key, name: userValues[0]?.name || '', image: userValues[0]?.image || '' },
            ];
          })
        ) as Record<string, RealtimeUser>
        setUsers(newUsers)
      })
      .subscribe(async (status: string) => {
        if (status !== 'SUBSCRIBED') {
          return
        }

        await room.track({
          name: currentUserName,
          image: currentUserImage,
        })
      })

    return () => {
      room.unsubscribe()
    }
  }, [roomName, currentUserName, currentUserImage])

  return { users }
}
