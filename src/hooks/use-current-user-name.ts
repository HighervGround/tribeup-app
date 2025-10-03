import { useAppStore } from '@/store/appStore'

export const useCurrentUserName = () => {
  const { user } = useAppStore()
  
  return user?.name || user?.email?.split('@')[0] || 'Anonymous'
}
