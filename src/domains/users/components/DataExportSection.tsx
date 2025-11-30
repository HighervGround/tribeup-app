import { useState } from 'react';
import { Download, FileJson, AlertCircle, CheckCircle2, Clock, Info } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { supabase } from '@/core/database/supabase';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ExportHistory {
  id: string;
  requested_at: string;
  completed_at: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
}

export function DataExportSection() {
  const [isExporting, setIsExporting] = useState(false);
  const queryClient = useQueryClient();

  // Dev/helper: Build a client-side export when Edge Function isn't available
  const clientSideExport = async (): Promise<Blob> => {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const exportData: any = {
      export_metadata: {
        user_id: userId,
        exported_at: new Date().toISOString(),
        version: '1.0',
        format: 'json',
        mode: 'client-fallback',
      },
      profile: null,
      games_created: [],
      game_participants: [],
      games_joined: [],
      rsvps: [],
      chat_messages: [],
      tribe_chat_messages: [],
      tribe_memberships: [],
      tribes_owned: [],
      notifications: [],
      user_connections: [],
      user_stats: null,
      user_presence: [],
      user_achievements: [],
    };

    // Helper to safely query without throwing
    const safe = async <T,>(p: Promise<{ data: T | null; error: any }>): Promise<T | [] | null> => {
      try {
        const { data, error } = await p;
        if (error) {
          console.warn('[DataExport] Client fallback query warning:', error?.message || error);
          return Array.isArray(data) ? [] : null;
        }
        return data as any;
      } catch (err) {
        console.warn('[DataExport] Client fallback unexpected error:', err);
        return null as any;
      }
    };

    exportData.profile = await safe(
      supabase.from('user_profiles').select('*').eq('id', userId).single()
    );

    exportData.games_created = (await safe(
      supabase.from('games').select('*').eq('creator_id', userId).order('created_at', { ascending: false })
    )) || [];

    const gp: any[] = (await safe(
      supabase.from('game_participants').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    )) as any[] || [];
    exportData.game_participants = gp;

    if (gp.length) {
      const ids = gp.map((g) => g.game_id).filter(Boolean);
      if (ids.length) {
        exportData.games_joined = (await safe(
          supabase.from('games').select('*').in('id', ids).order('created_at', { ascending: false })
        )) || [];
      }
    }

    exportData.rsvps = (await safe(
      supabase.from('rsvps').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    )) || [];

    exportData.chat_messages = (await safe(
      supabase.from('chat_messages').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    )) || [];

    exportData.tribe_chat_messages = (await safe(
      supabase.from('tribe_chat_messages').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    )) || [];

    exportData.tribe_memberships = (await safe(
      supabase.from('tribe_members').select('*').eq('user_id', userId).order('joined_at', { ascending: false })
    )) || [];

    exportData.tribes_owned = (await safe(
      supabase.from('tribes').select('*').eq('created_by', userId).order('created_at', { ascending: false })
    )) || [];

    exportData.notifications = (await safe(
      supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    )) || [];

    exportData.user_connections = (await safe(
      supabase.from('user_connections').select('*').or(`follower_id.eq.${userId},following_id.eq.${userId}`).order('created_at', { ascending: false })
    )) || [];

    exportData.user_stats = await safe(
      supabase.from('user_stats').select('*').eq('user_id', userId).single()
    );

    exportData.user_presence = (await safe(
      supabase.from('user_presence').select('*').eq('user_id', userId).order('updated_at', { ascending: false })
    )) || [];

    exportData.user_achievements = (await safe(
      supabase.from('user_achievements').select('*').eq('user_id', userId).order('earned_at', { ascending: false })
    )) || [];

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    return blob;
  };

  // Fetch recent export history
  const { data: exportHistory, isLoading: isLoadingHistory, error: historyError } = useQuery<ExportHistory[]>({
    queryKey: ['user-data-exports'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('user_data_exports')
          .select('id, requested_at, completed_at, status, error_message')
          .order('requested_at', { ascending: false })
          .limit(5);

        // If table doesn't exist yet (migrations not applied), return empty array
        if (error?.code === '42P01' || error?.code === 'PGRST204') {
          console.warn('user_data_exports table not found - migrations may not be applied yet');
          return [];
        }

        if (error) {
          // Swallow errors to avoid global toasts; show inline alert via historyError
          console.warn('Failed to load export history:', error);
          return [];
        }
        return data || [];
      } catch (err) {
        console.warn('Unexpected error loading export history:', err);
        return [];
      }
    },
    retry: false,
    throwOnError: false,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Check if user can request export (rate limiting)
  const canRequestExport = () => {
    if (!exportHistory || exportHistory.length === 0) return true;
    
    const lastExport = exportHistory[0];
    const lastExportTime = new Date(lastExport.requested_at).getTime();
    const now = Date.now();
    const hoursSinceLastExport = (now - lastExportTime) / (1000 * 60 * 60);
    
    return hoursSinceLastExport >= 24;
  };

  const getNextAvailableTime = () => {
    if (!exportHistory || exportHistory.length === 0) return null;
    
    const lastExport = exportHistory[0];
    const lastExportTime = new Date(lastExport.requested_at).getTime();
    const nextAvailable = new Date(lastExportTime + 24 * 60 * 60 * 1000);
    
    return nextAvailable;
  };

  // Request data export mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Try Edge Function first
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-user-data`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          return response.blob();
        }

        // If function is missing/unavailable, optionally fall back
        if (response.status === 404 || response.status === 403) {
          const fallbackEnabled = import.meta.env.DEV || 
            import.meta.env.VITE_EXPORT_FALLBACK === 'true' || 
            import.meta.env.VITE_EXPORT_FALLBACK === true;
          if (fallbackEnabled) {
            console.warn('[DataExport] Edge Function not available, using client-side fallback');
            return clientSideExport();
          }
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || 'Export service not available');
        }

        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to export data');
      } catch (networkErr: any) {
        // Handle network/CORS/preflight failures (e.g., TypeError: Load failed)
        if (import.meta.env.DEV) {
          console.warn('[DataExport] Dev mode: falling back to client-side export due to network error:', networkErr);
          return clientSideExport();
        }
        const msg = (networkErr?.message || '').toLowerCase();
        const canFallback = import.meta.env.VITE_EXPORT_FALLBACK === 'true' || 
          import.meta.env.VITE_EXPORT_FALLBACK === true;
        if (canFallback && (msg.includes('load failed') || msg.includes('failed to fetch') || msg.includes('network') || msg.includes('cors'))) {
          console.warn('[DataExport] Network error calling Edge Function, using client-side fallback');
          return clientSideExport();
        }
        throw new Error('Unable to reach export service');
      }
    },
    onMutate: () => {
      setIsExporting(true);
      toast.info('Preparing your data export...');
    },
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tribeup-data-export-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Your data has been exported successfully!');
      
      // Refresh export history
      queryClient.invalidateQueries({ queryKey: ['user-data-exports'] });
    },
    onError: (error: Error) => {
      console.error('Export error:', error);
      const msg = (error?.message || '').toLowerCase();
      if (msg.includes('load failed') || msg.includes('failed to fetch') || msg.includes('network')) {
        toast.error('Export service unavailable. Please deploy the function or enable fallback.');
      } else {
        toast.error(error.message || 'Failed to export data. Please try again.');
      }
    },
    onSettled: () => {
      setIsExporting(false);
    },
  });

  const handleExport = () => {
    if (!canRequestExport()) {
      const nextTime = getNextAvailableTime();
      if (nextTime) {
        toast.error(`You can request another export after ${nextTime.toLocaleString()}`);
      }
      return;
    }

    exportMutation.mutate();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getStatusBadge = (status: ExportHistory['status']) => {
    const variants: Record<ExportHistory['status'], { variant: any; icon: any; label: string }> = {
      pending: { variant: 'outline', icon: Clock, label: 'Pending' },
      processing: { variant: 'outline', icon: Clock, label: 'Processing' },
      completed: { variant: 'success', icon: CheckCircle2, label: 'Completed' },
      failed: { variant: 'destructive', icon: AlertCircle, label: 'Failed' },
    };

    const { variant, icon: Icon, label } = variants[status];
    
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="size-3" />
        {label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson className="size-5" />
          Download Your Data
        </CardTitle>
        <CardDescription>
          Export all your TribeUp data in JSON format (GDPR compliant)
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Error Alert for Missing Table */}
        {historyError && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription className="text-sm">
              <p className="font-medium mb-1">Database Setup Required</p>
              <p className="text-xs">
                The data export feature requires database migrations to be applied. 
                Please contact support or check the deployment documentation.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Information Alert */}
        <Alert>
          <Info className="size-4" />
          <AlertDescription className="text-sm">
            <p className="font-medium mb-2">Your export will include:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Profile information and settings</li>
              <li>Games created and participated in</li>
              <li>Chat messages and notifications</li>
              <li>Tribe memberships and activities</li>
              <li>Connections, stats, and achievements</li>
            </ul>
            <p className="mt-2 text-muted-foreground">
              You can request one export every 24 hours. Your data will be downloaded as a JSON file.
            </p>
          </AlertDescription>
        </Alert>

        {/* Export Button */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleExport}
            disabled={isExporting || !canRequestExport()}
            className="w-full sm:w-auto"
            size="lg"
          >
            {isExporting ? (
              <>
                <Clock className="mr-2 size-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 size-4" />
                Request Data Export
              </>
            )}
          </Button>

          {!canRequestExport() && (
            <p className="text-sm text-muted-foreground">
              Next export available: {getNextAvailableTime()?.toLocaleString()}
            </p>
          )}
        </div>

        {/* Export History */}
        {!isLoadingHistory && exportHistory && exportHistory.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Recent Exports</h4>
            <div className="space-y-2">
              {exportHistory.map((export_) => (
                <div
                  key={export_.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(export_.status)}
                      <span className="text-sm text-muted-foreground">
                        {formatDate(export_.requested_at)}
                      </span>
                    </div>
                    {export_.error_message && (
                      <p className="text-xs text-destructive">{export_.error_message}</p>
                    )}
                  </div>
                  {export_.completed_at && (
                    <CheckCircle2 className="size-4 text-success" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Privacy Assurance */}
        <Alert>
          <AlertCircle className="size-4" />
          <AlertDescription className="text-xs text-muted-foreground">
            Your privacy is important to us. This export only includes your personal data and is
            generated securely. The file is downloaded directly to your device and is not stored
            on our servers.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
