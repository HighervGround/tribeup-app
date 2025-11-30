import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Trophy } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useUserAchievements } from '@/domains/users/hooks/useUserProfile';
import { AchievementGrid } from '@/domains/users/components/AchievementBadge';

export default function AchievementsPage() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const { data: achievements = [], isLoading } = useUserAchievements(user?.id || '');

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>Back</Button>
        <h1 className="text-xl font-semibold">Achievements</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            All Achievements ({achievements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-6 text-center text-muted-foreground">Loading...</div>
          ) : achievements.length > 0 ? (
            <AchievementGrid 
              achievements={achievements.map((ua: any) => ({
                ...ua.achievements,
                earned_at: ua.earned_at
              }))}
              maxDisplay={48}
              size="md"
              layout="card"
              showScore={true}
            />
          ) : (
            <div className="py-6 text-center text-muted-foreground">No achievements yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
