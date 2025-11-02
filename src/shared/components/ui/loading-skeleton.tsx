import React from 'react';
// import { motion } from 'framer-motion'; // TEMPORARILY DISABLED
import { cn } from '@/shared/utils/utils';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'rectangular' | 'text';
  animation?: 'pulse' | 'wave' | 'none';
  width?: string | number;
  height?: string | number;
}

export function LoadingSkeleton({ 
  className, 
  variant = 'default',
  animation = 'pulse',
  width,
  height
}: LoadingSkeletonProps) {
  const baseClasses = "bg-muted animate-pulse";
  
  const variantClasses = {
    default: "rounded-md",
    circular: "rounded-full",
    rectangular: "rounded-none",
    text: "rounded-sm h-4"
  };

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "loading",
    none: ""
  };

  const style = {
    width: width || undefined,
    height: height || undefined
  };

  return (
    <div 
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
      aria-label="Loading..."
      role="status"
    />
  );
}

// Preset skeletons for common components
export function GameCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <LoadingSkeleton className="h-6 w-24" />
        <LoadingSkeleton variant="circular" className="h-8 w-8" />
      </div>
      
      <div className="space-y-2">
        <LoadingSkeleton className="h-4 w-3/4" />
        <LoadingSkeleton className="h-4 w-1/2" />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LoadingSkeleton variant="circular" className="h-6 w-6" />
          <LoadingSkeleton className="h-4 w-16" />
        </div>
        <LoadingSkeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

export function ChatMessageSkeleton({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <div className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {!isOwn && <LoadingSkeleton variant="circular" className="h-8 w-8" />}
      <div className={`max-w-xs ${isOwn ? 'order-first' : ''}`}>
        {!isOwn && <LoadingSkeleton className="h-3 w-16 mb-1" />}
        <LoadingSkeleton className={`h-10 ${isOwn ? 'w-32' : 'w-40'} rounded-2xl`} />
      </div>
    </div>
  );
}

export function UserProfileSkeleton() {
  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4">
        <LoadingSkeleton variant="circular" className="h-24 w-24" />
        <div className="space-y-2">
          <LoadingSkeleton className="h-6 w-32" />
          <LoadingSkeleton className="h-4 w-24" />
        </div>
        <LoadingSkeleton className="h-4 w-64" />
        <div className="flex items-center gap-4">
          <LoadingSkeleton className="h-8 w-12" />
          <LoadingSkeleton className="h-8 w-12" />
          <LoadingSkeleton className="h-8 w-12" />
        </div>
        <LoadingSkeleton className="h-10 w-48 rounded-full" />
      </div>
      
      {/* Cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-lg p-4 space-y-3">
          <LoadingSkeleton className="h-5 w-24" />
          <div className="space-y-2">
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}