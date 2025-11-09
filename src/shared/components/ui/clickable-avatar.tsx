import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/components/ui/avatar';
import { cn } from '@/shared/utils/utils';
import { useAppStore } from '@/store/appStore';

interface ClickableAvatarProps {
  userId?: string;
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const sizeClasses = {
  xs: 'h-6 w-6',
  sm: 'h-6 w-6',
  md: 'h-8 w-8', 
  lg: 'h-10 w-10',
  xl: 'h-12 w-12'
};

export function ClickableAvatar({
  userId,
  src,
  alt,
  fallback,
  size = 'md',
  className,
  onClick,
  disabled = false
}: ClickableAvatarProps) {
  const navigate = useNavigate();
  const { user } = useAppStore();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (onClick) {
      onClick();
    } else if (userId && !disabled) {
      // Route normalization: if user taps their own card, redirect to own profile route
      const currentUserId = user?.id;
      if (userId === currentUserId) {
        navigate('/profile/me');
      } else {
        navigate(`/user/${userId}`);
      }
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    
    // Handle "Unknown User" case specifically
    if (name.startsWith('Unknown User')) {
      return '??';
    }
    
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Avatar
      className={cn(
        sizeClasses[size],
        (userId || onClick) && !disabled && 'cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={handleClick}
    >
      {src && (
        <AvatarImage 
          src={src} 
          alt={alt || 'User avatar'} 
        />
      )}
      <AvatarFallback className="bg-primary/10 text-primary font-medium">
        {fallback || getInitials(alt)}
      </AvatarFallback>
    </Avatar>
  );
}
