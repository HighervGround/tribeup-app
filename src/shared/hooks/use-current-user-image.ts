import { useAppStore } from '@/store/appStore'

export const useCurrentUserImage = () => {
  const { user } = useAppStore()
  
  // Return user avatar from app store
  return user?.avatar || null
}
