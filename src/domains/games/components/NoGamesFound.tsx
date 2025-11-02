import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Users, MapPin, Calendar } from 'lucide-react';

interface NoGamesFoundProps {
  onCreateGame: () => void;
}

export function NoGamesFound({ onCreateGame }: NoGamesFoundProps) {
  return (
    <Card className="text-center py-12">
      <CardContent className="space-y-6">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <Users className="w-8 h-8 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">No Activities Found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            There are no activities available in your area right now. Be the first to create one and start building your sports community!
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onCreateGame} className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Create Activity
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Explore Nearby
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p>Don't see what you're looking for?</p>
          <p>Try adjusting your search filters or location settings.</p>
        </div>
      </CardContent>
    </Card>
  );
}

