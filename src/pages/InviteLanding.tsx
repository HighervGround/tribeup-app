import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/core/database/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { toast } from 'sonner';

export default function InviteLanding() {
  const params = useParams();
  const code = params.code as string | undefined;

  useEffect(() => {
    if (!code) return;
    localStorage.setItem('ambassadorReferralCode', code);
    supabase.rpc('record_ambassador_referral', {
      p_referral_code: code,
      p_status: 'clicked',
      p_referred_user_id: null,
      p_referred_email: null,
    }).then(({ error }) => {
      if (error) console.warn('[InviteLanding] record clicked failed', error.message);
    });
  }, [code]);

  if (!code) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Welcome to TribeUp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            You were invited by a Campus Ambassador. Create your account to join games and events.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => { toast.info('Redirecting to sign up…'); window.location.href = '/login'; }}>Sign Up</Button>
            <Button variant="secondary" onClick={() => { window.location.href = '/'; }}>Explore</Button>
          </div>
          <p className="text-xs text-muted-foreground">Referral code: {code}</p>
        </CardContent>
      </Card>
    </div>
  );
}
