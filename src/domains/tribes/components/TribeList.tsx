import { useState } from 'react';
import { useTribes, useSearchTribes } from '../hooks/useTribes';
import { TribeCard } from './TribeCard';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/shared/components/ui/card';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';
import { DEFAULT_SPORTS } from '@/domains/games/components/SportPicker';

export function TribeList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<string | undefined>();

  const { data: tribes, isLoading } = useTribes(selectedActivity);
  const { data: searchResults, isLoading: isSearching } = useSearchTribes(
    searchQuery,
    selectedActivity
  );

  const displayTribes = searchQuery.length >= 2 ? searchResults : tribes;
  const isLoadingData = searchQuery.length >= 2 ? isSearching : isLoading;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tribes</h1>
          <p className="text-muted-foreground">Join communities for your favorite activities</p>
        </div>
        <Button onClick={() => navigate('/tribe/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Tribe
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tribes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Activity filter */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedActivity === undefined ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedActivity(undefined)}
          >
            All Activities
          </Button>
          {DEFAULT_SPORTS.map((sport) => (
            <Button
              key={sport.value}
              variant={selectedActivity === sport.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedActivity(sport.value)}
            >
              {sport.icon} {sport.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tribes Grid */}
      {isLoadingData ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : displayTribes && displayTribes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayTribes.map((tribe) => (
            <TribeCard key={tribe.id} tribe={tribe} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery.length >= 2
                ? 'No tribes found matching your search'
                : 'No tribes available yet'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default TribeList;

