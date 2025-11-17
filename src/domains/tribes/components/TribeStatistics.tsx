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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
      <Card className="min-w-0">
        <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
          <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground truncate">Members</CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
          <div className="flex items-center gap-2 min-w-0">
            <Users className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xl md:text-2xl font-bold truncate">{statistics.active_member_count || statistics.member_count}</div>
              <p className="text-xs text-muted-foreground truncate">Active members</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
          <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground truncate">Games</CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xl md:text-2xl font-bold truncate">{statistics.actual_game_count || statistics.game_count}</div>
              <p className="text-xs text-muted-foreground truncate">Games organized</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0 sm:col-span-2 md:col-span-1">
        <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
          <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground truncate">Activity</CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
          <div className="flex items-center gap-2 min-w-0">
            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-xl md:text-2xl font-bold truncate">
                {statistics.next_game_date ? 'Upcoming' : 'None'}
              </div>
              <p className="text-xs text-muted-foreground truncate">Next game</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TribeStatistics;

