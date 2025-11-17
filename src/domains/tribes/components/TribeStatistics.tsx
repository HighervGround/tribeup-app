import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Users, Calendar, TrendingUp } from 'lucide-react';

interface TribeStatisticsProps {
  tribeId: string;
  statistics: any;
}

export function TribeStatistics({ statistics }: TribeStatisticsProps) {
  if (!statistics) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No statistics available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <div className="text-2xl font-bold">{statistics.active_member_count || statistics.member_count}</div>
              <p className="text-xs text-muted-foreground">Active members</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Games</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <div>
              <div className="text-2xl font-bold">{statistics.actual_game_count || statistics.game_count}</div>
              <p className="text-xs text-muted-foreground">Games organized</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <div>
              <div className="text-2xl font-bold">
                {statistics.next_game_date ? 'Upcoming' : 'None'}
              </div>
              <p className="text-xs text-muted-foreground">Next game</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TribeStatistics;

