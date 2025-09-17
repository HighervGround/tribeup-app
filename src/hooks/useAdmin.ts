import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseService } from '../lib/supabaseService';
import { toast } from 'sonner';
import { useAppStore } from '../store/appStore';

// Query keys
export const adminKeys = {
  all: ['admin'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  auditLog: () => [...adminKeys.all, 'auditLog'] as const,
  permissions: (userId: string) => [...adminKeys.all, 'permissions', userId] as const,
};

/**
 * Hook to check if current user has admin role
 */
export function useIsAdmin() {
  const { user } = useAppStore();
  
  return useQuery({
    queryKey: ['admin', 'isAdmin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      return await SupabaseService.hasAdminRole(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to check if current user has moderator role
 */
export function useIsModerator() {
  const { user } = useAppStore();
  
  return useQuery({
    queryKey: ['admin', 'isModerator', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      return await SupabaseService.hasModeratorRole(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get all users (admin only)
 */
export function useAllUsers() {
  return useQuery({
    queryKey: adminKeys.users(),
    queryFn: async () => {
      return await SupabaseService.getAllUsers();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to get admin audit log
 */
export function useAdminAuditLog(limit = 50) {
  return useQuery({
    queryKey: [...adminKeys.auditLog(), limit],
    queryFn: async () => {
      return await SupabaseService.getAdminAuditLog(limit);
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to update user role (admin only)
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'user' | 'moderator' | 'admin' }) => {
      return await SupabaseService.updateUserRole(userId, role);
    },
    onSuccess: (_, { userId, role }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      queryClient.invalidateQueries({ queryKey: adminKeys.auditLog() });
      
      toast.success('User role updated successfully!', {
        description: `User role changed to ${role}`,
      });
    },
    onError: (error) => {
      console.error('Update user role error:', error);
      toast.error('Failed to update user role', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });
    },
  });
}

/**
 * Hook to delete game (admin/moderator)
 */
export function useDeleteGame() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ gameId, reason }: { gameId: string; reason?: string }) => {
      return await SupabaseService.deleteGame(gameId, reason);
    },
    onSuccess: (_, { gameId }) => {
      // Invalidate games queries
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: adminKeys.auditLog() });
      
      toast.success('Game deleted successfully!', {
        description: 'The game has been removed and participants have been notified',
      });
    },
    onError: (error) => {
      console.error('Delete game error:', error);
      toast.error('Failed to delete game', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });
    },
  });
}

/**
 * Hook to check if user can perform admin actions
 */
export function useCanPerformAdminActions() {
  const { data: isAdmin } = useIsAdmin();
  const { data: isModerator } = useIsModerator();
  
  return {
    canDeleteAnyGame: isAdmin || isModerator,
    canManageUsers: isAdmin,
    canViewAuditLog: isAdmin,
    canAssignModerators: isAdmin,
  };
}
