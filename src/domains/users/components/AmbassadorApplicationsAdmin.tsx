import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/core/database/supabase';
import { AmbassadorService, CampusAmbassador } from '@/domains/users/services/ambassadorService';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { toast } from 'sonner';

export const AmbassadorApplicationsAdmin = () => {
  const { data: sessionData } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data?.session ?? null;
    },
  });
  const reviewerId = sessionData?.user?.id;

  const { data: pendingApps, refetch, isLoading: loadingApps, error: fetchError } = useQuery({
    queryKey: ['ambassador', 'applications', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campus_ambassadors')
        .select('*')
        .eq('application_status', 'pending')
        .order('applied_at', { ascending: true });
      if (error) throw error;
      return (data as any) as CampusAmbassador[];
    },
  });

  const approve = async (appId: string) => {
    if (!reviewerId) {
      toast.error('You must be signed in as admin to approve.');
      return;
    }
    try {
      await AmbassadorService.approveApplication(appId, reviewerId);
      await refetch();
    } catch (e) {
      toast.error('Approval failed');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ambassador Applications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loadingApps && (
          <p className="text-sm text-muted-foreground">Loading applications…</p>
        )}
        {fetchError && (
          <p className="text-sm text-red-600">
            Failed to load applications. Please ensure migrations and policies are applied.
          </p>
        )}
        {!loadingApps && !fetchError && !pendingApps?.length && (
          <p className="text-sm text-muted-foreground">No pending applications.</p>
        )}
        {pendingApps?.map((app) => (
          <div key={app.id} className="flex items-center justify-between p-3 border rounded-md">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{app.university}</Badge>
                <Badge>{app.campus_name}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Applied {new Date(app.applied_at).toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => approve(app.id)}>Approve</Button>
              {/* For future: add reject flow */}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
