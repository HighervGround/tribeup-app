import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/core/database/supabase';
import { AmbassadorService, CampusAmbassador } from '@/domains/users/services/ambassadorService';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog';
import { ExternalLink, Mail, Calendar, GraduationCap, Building2, User, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export const AmbassadorApplicationsAdmin = () => {
  const [selectedApp, setSelectedApp] = useState<CampusAmbassador | null>(null);
  
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
      // Fetch pending applications
      const { data: apps, error: appsError } = await supabase
        .from('campus_ambassadors')
        .select('*')
        .eq('application_status', 'pending')
        .order('applied_at', { ascending: true });
      
      if (appsError) {
        console.error('Error fetching applications:', appsError);
        throw appsError;
      }
      
      if (!apps || apps.length === 0) return [];
      
      // Fetch user details separately
      const userIds = apps.map(app => app.user_id);
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url, username')
        .in('id', userIds);
      
      if (usersError) {
        console.error('Error fetching users:', usersError);
        // Continue with apps even if users fetch fails
      }
      
      // Merge user data with applications
      const usersMap = new Map((users || []).map(u => [u.id, u]));
      return apps.map(app => {
        const user = usersMap.get(app.user_id);
        return {
          ...app,
          applicant: user ? {
            id: user.id,
            name: user.full_name,
            email: user.email,
            avatar: user.avatar_url,
            username: user.username
          } : {
            id: app.user_id,
            name: 'Unknown User',
            email: 'No email',
            avatar: null,
            username: 'unknown'
          }
        };
      });
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
      setSelectedApp(null);
      toast.success('Ambassador application approved!');
    } catch (e) {
      toast.error('Approval failed');
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ambassador Applications</span>
            {!loadingApps && pendingApps && pendingApps.length > 0 && (
              <Badge variant="secondary">{pendingApps.length} pending</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingApps && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}
          {fetchError && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
              <p className="text-sm font-medium">Failed to load applications</p>
              <p className="text-xs mt-1">Please ensure migrations and policies are applied.</p>
            </div>
          )}
          {!loadingApps && !fetchError && !pendingApps?.length && (
            <div className="text-center py-8 text-muted-foreground">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">No pending applications</p>
              <p className="text-xs mt-1">New applications will appear here</p>
            </div>
          )}
          {pendingApps?.map((app) => (
            <div 
              key={app.id} 
              className="group flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:border-primary hover:shadow-sm transition-all"
              onClick={() => setSelectedApp(app)}
            >
              {/* Avatar */}
              <Avatar className="w-12 h-12">
                <AvatarImage src={app.applicant?.avatar} alt={app.applicant?.name} />
                <AvatarFallback>
                  {app.applicant?.name?.charAt(0)?.toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm truncate">
                    {app.applicant?.name || 'Anonymous'}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {app.campus_name}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2 truncate">
                  {app.applicant?.email || 'No email'}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {app.university}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(app.applied_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Application Details Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedApp?.applicant?.avatar} alt={selectedApp?.applicant?.name} />
                <AvatarFallback>
                  {selectedApp?.applicant?.name?.charAt(0)?.toUpperCase() || 'A'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold">{selectedApp?.applicant?.name || 'Anonymous'}</p>
                <p className="text-sm text-muted-foreground font-normal">
                  {selectedApp?.applicant?.email || 'No email'}
                </p>
              </div>
            </DialogTitle>
            <DialogDescription>
              Review the complete application before approving
            </DialogDescription>
          </DialogHeader>
          
          {selectedApp && (
            <div className="space-y-6 py-4">
              {/* Applicant Info */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 text-sm uppercase text-muted-foreground">
                  <User className="w-4 h-4" />
                  Applicant Information
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Name</p>
                    <p className="font-medium">{selectedApp.applicant?.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p className="font-medium truncate">{selectedApp.applicant?.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Username</p>
                    <p className="font-medium">@{selectedApp.applicant?.username || 'unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Applied</p>
                    <p className="font-medium">
                      {new Date(selectedApp.applied_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Campus Info */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 text-sm uppercase text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  Campus Information
                </h3>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">University</p>
                    <p className="font-medium">{selectedApp.university}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Campus</p>
                    <p className="font-medium">{selectedApp.campus_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Year</p>
                    <p className="font-medium">{selectedApp.year}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Major</p>
                    <p className="font-medium">{selectedApp.major || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Motivation */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 text-sm uppercase text-muted-foreground">
                  <GraduationCap className="w-4 h-4" />
                  Motivation
                </h3>
                <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedApp.motivation}</p>
                </div>
              </div>

              {/* Resume */}
              {selectedApp.resume_url && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase text-muted-foreground">Resume</h3>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between"
                    onClick={() => window.open(selectedApp.resume_url!, '_blank')}
                  >
                    <span>View Resume Document</span>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Social Links */}
              {selectedApp.social_links && Object.keys(selectedApp.social_links).length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-sm uppercase text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    Social Profiles
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(selectedApp.social_links as Record<string, string>).map(([platform, url]) => (
                      <Button
                        key={platform}
                        variant="outline"
                        className="justify-between"
                        onClick={() => window.open(url, '_blank')}
                      >
                        <span className="capitalize">{platform}</span>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline"
              onClick={() => setSelectedApp(null)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => selectedApp && approve(selectedApp.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
