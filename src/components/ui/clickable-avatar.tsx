import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { cn } from './utils';

interface ClickableAvatarProps {
  userId?: string;
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const sizeClasses = {
  sm: 'size-6',
  md: 'size-8', 
  lg: 'size-10',
  xl: 'size-12'
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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (onClick) {
      onClick();
    } else if (userId && !disabled) {
      navigate(`/user/${userId}`);
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
