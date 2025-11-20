import { useCreateTribe, useUpdateTribe, useDeleteTribe } from './useTribes';
import { useJoinTribe, useLeaveTribe, useTribeJoinToggle } from './useTribeMembers';
import { useAppStore } from '@/store/appStore';

/**
 * Combined hook for all tribe actions
 */
export function useTribeActions() {
  const { user } = useAppStore();
  const createTribe = useCreateTribe();
  const updateTribe = useUpdateTribe();
  const deleteTribe = useDeleteTribe();
  const joinTribe = useJoinTribe();
  const leaveTribe = useLeaveTribe();
  const toggleJoin = useTribeJoinToggle();

  return {
    createTribe: createTribe.mutate,
    updateTribe: updateTribe.mutate,
    deleteTribe: deleteTribe.mutate,
    joinTribe: (tribeId: string) => {
      if (!user?.id) return;
      joinTribe.mutate({ tribeId, userId: user.id });
    },
    leaveTribe: (tribeId: string) => {
      if (!user?.id) return;
      leaveTribe.mutate({ tribeId, userId: user.id });
    },
    toggleJoin: async (tribeId: string, isMember: boolean) => {
      if (!user?.id) return;
      return toggleJoin.toggle(tribeId, user.id, isMember);
    },
    isLoading: createTribe.isPending || updateTribe.isPending || deleteTribe.isPending,
  };
}

