import React from 'react';
import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';

export function GameCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <Skeleton className="aspect-video w-full" />
        
        {/* Date/Time skeleton */}
        <div className="absolute top-3 left-3">
          <Skeleton className="h-12 w-20 rounded-lg" />
        </div>
        
        {/* Sport tag skeleton */}
        <div className="absolute top-3 right-3">
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
      
      <CardContent className="p-4">
        {/* Title skeleton */}
        <div className="mb-3">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        
        {/* Description skeleton */}
        <div className="mb-3">
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        
        {/* Host info skeleton */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-8" />
        </div>
        
        {/* Participants & action skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-8 w-20 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

