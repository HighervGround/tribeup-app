import { useAppStore } from '../store/appStore'

export const useCurrentUserName = () => {
  const { user } = useAppStore()
  
  // Return user name from app store, with fallback to email or unknown
  return user?.name || user?.email?.split('@')[0] || '?'
}
