import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AmbassadorService, CampusAmbassador, AmbassadorReferralStats } from '@/domains/users/services/ambassadorService';

interface UseAmbassadorResult {
  profile: CampusAmbassador | null;
  stats: AmbassadorReferralStats | null;
  isLoading: boolean;
  isApplying: boolean;
  submitApplication: (payload: { campus_name: string; university?: string; application_data?: Record<string, any>; }) => Promise<void>;
  ensureReferralCode: () => Promise<string | null>;
  refresh: () => Promise<void>;
}

export function useAmbassador(userId: string | undefined): UseAmbassadorResult {
  const qc = useQueryClient();

  const { data: profile, isLoading: loadingProfile } = useQuery<CampusAmbassador | null>({
    queryKey: ['ambassador', 'profile', userId],
    queryFn: async () => (userId ? AmbassadorService.getAmbassadorProfile(userId) : null),
    enabled: !!userId,
  });

  const { data: stats, isLoading: loadingStats } = useQuery<AmbassadorReferralStats | null>({
    queryKey: ['ambassador', 'stats', userId],
    queryFn: async () => (userId ? AmbassadorService.getReferralStats(userId) : null),
    enabled: !!userId,
  });

  const { mutateAsync: submit, isPending: isApplying } = useMutation({
    mutationFn: async (payload: { campus_name: string; university?: string; application_data?: Record<string, any>; }) => {
      if (!userId) return;
      await AmbassadorService.applyForAmbassador(userId, payload);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['ambassador', 'profile', userId] });
    },
  });

  const ensureReferralCode = async () => {
    if (!userId) return null;
    const code = await AmbassadorService.ensureReferralCode(userId);
    await qc.invalidateQueries({ queryKey: ['ambassador', 'profile', userId] });
    await qc.invalidateQueries({ queryKey: ['ambassador', 'stats', userId] });
    return code;
  };

  const refresh = async () => {
    if (!userId) return;
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['ambassador', 'profile', userId] }),
      qc.invalidateQueries({ queryKey: ['ambassador', 'stats', userId] }),
    ]);
  };

  return {
    profile: profile ?? null,
    stats: stats ?? null,
    isLoading: loadingProfile || loadingStats,
    isApplying,
    submitApplication: submit,
    ensureReferralCode,
    refresh,
  };
}
