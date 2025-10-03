import { useAppStore } from '@/store/appStore'

export const useCurrentUserImage = () => {
  const { user } = useAppStore()
  
  return user?.avatar || ''
}
