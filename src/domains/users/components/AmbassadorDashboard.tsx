import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAmbassador } from '@/domains/users/hooks/useAmbassador';
import { supabase } from '@/core/database/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { StatGroup } from '@/shared/components/ui/stats/StatGroup';
import { StatCard } from '@/shared/components/ui/stats/StatCard';
import { toast } from 'sonner';

export interface AmbassadorDashboardProps {
  onInvite?: (referralLink: string) => void;
}

export const AmbassadorDashboard = ({ onInvite }: AmbassadorDashboardProps) => {
  const { data: sessionData } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data?.session ?? null;
    },
  });
  const userId = sessionData?.user?.id;
  const { profile, stats, isLoading, ensureReferralCode, refresh } = useAmbassador(userId);

  useEffect(() => {
    if (userId) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (!userId) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (isLoading) {
    return <Skeleton className="h-56 w-full" />;
  }

  if (!profile || profile.application_status !== 'approved') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ambassador Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Your application is not approved yet. Once approved, your ambassador tools will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  const referralCode = profile.referral_code || '';
  const referralLink = referralCode ? `${window.location.origin}/invite/${referralCode}` : '';

  const handleGenerateCode = async () => {
    const code = await ensureReferralCode();
    if (code) {
      toast.success('Referral code ready!');
    } else {
      toast.error('Unable to generate referral code.');
    }
  };

  const handleCopyLink = async () => {
    if (!referralLink) {
      toast.info('Generating referral code…');
      await handleGenerateCode();
      return;
    }
    await navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied!');
    onInvite?.(referralLink);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Ambassador Dashboard</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-600 text-white">Official Ambassador</Badge>
            {profile.profile_verified && <Badge className="bg-green-600 text-white">Verified</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Referral Code</p>
            <p className="font-mono text-sm">{referralCode || '—'}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleGenerateCode}>Generate</Button>
            <Button onClick={handleCopyLink} disabled={!referralCode}>Copy Link</Button>
          </div>
        </div>

        <StatGroup>
          <StatCard title="Clicks" value={stats?.clicks ?? 0} />
          <StatCard title="Signups" value={stats?.signups ?? 0} />
          <StatCard title="Conversions" value={stats?.conversions ?? 0} />
        </StatGroup>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ambassador Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm space-y-1">
                <li>Official Ambassador badge</li>
                <li>Verified TribeUp profile</li>
                <li>Early access to features</li>
                <li>Resume-ready leadership experience</li>
                <li>Exclusive events and meetups</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campus Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <p><span className="text-muted-foreground">Campus:</span> {profile.campus_name}</p>
                <p><span className="text-muted-foreground">University:</span> {profile.university}</p>
                <p><span className="text-muted-foreground">Badge:</span> {profile.badge_level}</p>
                <p><span className="text-muted-foreground">Goal:</span> {profile.referral_goal} signups</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};
