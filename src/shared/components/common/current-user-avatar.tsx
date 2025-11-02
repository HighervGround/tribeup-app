import { useCurrentUserImage } from '@/shared/hooks/use-current-user-image'
import { useCurrentUserName } from '@/shared/hooks/use-current-user-name'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { cn } from '@/shared/utils/utils'

interface CurrentUserAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showOnlineIndicator?: boolean
}

export const CurrentUserAvatar = ({ 
  size = 'md', 
  className,
  showOnlineIndicator = false 
}: CurrentUserAvatarProps) => {
  const profileImage = useCurrentUserImage()
  const name = useCurrentUserName()
  
  // Generate initials from name, handling edge cases
  const initials = name && name !== '?' 
    ? name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) // Limit to 2 characters
    : '??'

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  }

  return (
    <div className="relative">
      <Avatar className={cn(sizeClasses[size], className)}>
        {profileImage && (
          <AvatarImage 
            src={profileImage} 
            alt={name || 'User avatar'} 
            className="object-cover"
          />
        )}
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      {showOnlineIndicator && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
      )}
    </div>
  )
}
