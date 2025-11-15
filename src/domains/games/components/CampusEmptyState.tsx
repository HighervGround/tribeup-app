import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Plus, MapPin, Users, Calendar } from 'lucide-react';

interface CampusEmptyStateProps {
  onCreateGame: () => void;
  onExploreVenues?: () => void;
  title?: string;
  description?: string;
  showCampusCTA?: boolean;
}

export function CampusEmptyState({
  onCreateGame,
  onExploreVenues,
  title = "No activities yet",
  description = "Be the first to create an activity at your favorite UF spot!",
  showCampusCTA = true
}: CampusEmptyStateProps) {
  return (
    <div className="col-span-full">
      <Card className="bg-gradient-to-br from-orange-50 to-blue-50 dark:from-orange-950/20 dark:to-blue-950/20 border-orange-200 dark:border-orange-800">
        <CardContent className="p-8 text-center">
          {/* UF Campus Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-10 h-10 text-white" />
          </div>

          {/* Title and Description */}
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {title}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {description}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Button
              onClick={onCreateGame}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Activity
            </Button>

            {showCampusCTA && onExploreVenues && (
              <Button
                variant="outline"
                onClick={onExploreVenues}
                className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-950/20"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Explore Campus Venues
              </Button>
            )}
          </div>

          {/* Campus Tips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="font-medium text-sm mb-1">Pick Your Time</h4>
              <p className="text-xs text-muted-foreground">Weekdays after 5pm or weekends work great</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-sm mb-1">Start Small</h4>
              <p className="text-xs text-muted-foreground">Begin with 4-6 players for better turnout</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-medium text-sm mb-1">Choose Popular Spots</h4>
              <p className="text-xs text-muted-foreground">Student Rec, Flavet Field, Lake Alice</p>
            </div>
          </div>

          {/* UF Pride */}
          <div className="mt-8 pt-6 border-t border-orange-200 dark:border-orange-800">
            <p className="text-sm text-muted-foreground">
              🎓 <strong>Go Gators!</strong> Join the growing community of UF students playing sports together.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
