import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAmbassador } from '@/domains/users/hooks/useAmbassador';
import { supabase } from '@/core/database/supabase';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { toast } from 'sonner';

export interface AmbassadorApplicationProps {
  onSubmitted?: () => void;
}

export const AmbassadorApplication = ({ onSubmitted }: AmbassadorApplicationProps) => {
  const [campusName, setCampusName] = useState('UF Campus');
  const [university, setUniversity] = useState('University of Florida');
  const [year, setYear] = useState('');
  const [major, setMajor] = useState('');
  const [motivation, setMotivation] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [socialLinks, setSocialLinks] = useState('');

  const { data: sessionData } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data?.session ?? null;
    },
  });

  const userId = sessionData?.user?.id;
  const { profile, isApplying, isLoading, submitApplication } = useAmbassador(userId);

  const handleSubmit = async () => {
    if (!userId) {
      toast.error('Please sign in to apply.');
      return;
    }
    await submitApplication({
      campus_name: campusName.trim(),
      university: university.trim(),
      application_data: {
        year: year.trim(),
        major: major.trim(),
        motivation: motivation.trim(),
        resumeUrl: resumeUrl.trim(),
        socialLinks: socialLinks.trim(),
      },
    });
    onSubmitted?.();
  };

  if (isLoading) {
    return <Skeleton className="h-56 w-full" />;
  }

  if (profile && profile.application_status !== 'rejected') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campus Ambassador Application</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Status: {profile.application_status}</Badge>
            {profile.application_status === 'approved' && (
              <Badge className="bg-green-600 text-white">Approved</Badge>
            )}
            {profile.application_status === 'pending' && (
              <Badge className="bg-yellow-600 text-white">Under Review</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            You already submitted an application. We'll notify you once reviewed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Campus Ambassador Application</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm">Campus Name</label>
            <Input value={campusName} onChange={(e) => setCampusName(e.target.value)} placeholder="UF Campus" />
          </div>
          <div>
            <label className="text-sm">University</label>
            <Input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="University of Florida" />
          </div>
          <div>
            <label className="text-sm">Year</label>
            <Input value={year} onChange={(e) => setYear(e.target.value)} placeholder="Sophomore" />
          </div>
          <div>
            <label className="text-sm">Major</label>
            <Input value={major} onChange={(e) => setMajor(e.target.value)} placeholder="Computer Science" />
          </div>
        </div>
        <div>
          <label className="text-sm">Motivation</label>
          <Textarea value={motivation} onChange={(e) => setMotivation(e.target.value)} placeholder="Why do you want to be an ambassador?" rows={4} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm">Resume URL (optional)</label>
            <Input value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className="text-sm">Social Links (optional)</label>
            <Input value={socialLinks} onChange={(e) => setSocialLinks(e.target.value)} placeholder="Instagram, LinkedIn" />
          </div>
        </div>
        <div className="flex justify-end">
          <Button disabled={isApplying} onClick={handleSubmit}>
            {isApplying ? 'Submitting…' : 'Submit Application'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
