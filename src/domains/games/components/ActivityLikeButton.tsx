import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { ActivityLikeService } from '@/domains/games/services/activityLikeService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ActivityLikeButtonProps {
  activityId: string;
  variant?: 'default' | 'minimal';
  showCount?: boolean;
}

export function ActivityLikeButton({ 
  activityId, 
  variant = 'default',
  showCount = true 
}: ActivityLikeButtonProps) {
  const queryClient = useQueryClient();
  const [isAnimating, setIsAnimating] = useState(false);

  // Get like status
  const { data: isLiked = false } = useQuery({
    queryKey: ['activityLike', activityId],
    queryFn: () => ActivityLikeService.isLiked(activityId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get like count
  const { data: likeCount = 0 } = useQuery({
    queryKey: ['activityLikeCount', activityId],
    queryFn: () => ActivityLikeService.getLikeCount(activityId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: () => ActivityLikeService.toggleLike(activityId),
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['activityLike', activityId] });
      await queryClient.cancelQueries({ queryKey: ['activityLikeCount', activityId] });

      const previousIsLiked = queryClient.getQueryData(['activityLike', activityId]);
      const previousCount = queryClient.getQueryData(['activityLikeCount', activityId]);

      queryClient.setQueryData(['activityLike', activityId], !isLiked);
      queryClient.setQueryData(['activityLikeCount', activityId], (old: number = 0) => 
        isLiked ? Math.max(0, old - 1) : old + 1
      );

      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);

      return { previousIsLiked, previousCount };
    },
    onError: (err, _variables, context) => {
      // Rollback on error
      if (context) {
        queryClient.setQueryData(['activityLike', activityId], context.previousIsLiked);
        queryClient.setQueryData(['activityLikeCount', activityId], context.previousCount);
      }
      toast.error('Failed to update like');
    },
    onSuccess: (data) => {
      // Update with server response
      queryClient.setQueryData(['activityLike', activityId], data.isLiked);
      queryClient.setQueryData(['activityLikeCount', activityId], data.likeCount);
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLikeMutation.mutate();
  };

  if (variant === 'minimal') {
    return (
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 text-sm transition-all ${
          isLiked 
            ? 'text-red-500 hover:text-red-600' 
            : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-label={isLiked ? 'Unlike activity' : 'Like activity'}
      >
        <Heart 
          className={`w-4 h-4 transition-all ${
            isLiked ? 'fill-current' : ''
          } ${isAnimating ? 'scale-125' : ''}`}
        />
        {showCount && likeCount > 0 && (
          <span>{likeCount}</span>
        )}
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={`flex items-center gap-1.5 ${
        isLiked 
          ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20' 
          : 'text-muted-foreground hover:text-foreground'
      }`}
      aria-label={isLiked ? 'Unlike activity' : 'Like activity'}
      disabled={toggleLikeMutation.isPending}
    >
      <Heart 
        className={`w-4 h-4 transition-all ${
          isLiked ? 'fill-current' : ''
        } ${isAnimating ? 'scale-125' : ''}`}
      />
      {showCount && (
        <span className="text-sm font-medium">{likeCount || 0}</span>
      )}
    </Button>
  );
}

