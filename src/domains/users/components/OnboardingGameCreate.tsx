import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { 
  ArrowLeft,
  Loader2,
  MapPin,
  Calendar,
  Clock,
  Users
} from 'lucide-react';
import { supabase } from '@/core/database/supabase';
import { toast } from 'sonner';
import { useSimpleAuth } from '@/core/auth/SimpleAuthProvider';

interface OnboardingGameCreateProps {
  selectedSports: string[];
  userProfile: {
    firstName: string;
    lastName: string;
    bio: string;
    skillLevel: string;
  };
  onGameCreated: () => void;
  onBack: () => void;
}

const quickTimeSlots = [
  { value: '09:00', label: '9:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '21:00', label: '9:00 PM' },
];

export const OnboardingGameCreate: React.FC<OnboardingGameCreateProps> = ({
  selectedSports,
  userProfile,
  onGameCreated,
  onBack
}) => {
  const { user } = useSimpleAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const getDefaultDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    sport: selectedSports[0]?.toLowerCase() || '',
    title: '',
    location: '',
    date: getDefaultDate(),
    time: '18:00',
    duration: '60',
    maxPlayers: '10',
    cost: 'FREE'
  });

  const getSportEmoji = (sport: string) => {
    const sportEmojis: Record<string, string> = {
      basketball: '🏀',
      soccer: '⚽',
      tennis: '🎾',
      pickleball: '🥒',
      volleyball: '🏐',
      football: '🏈',
      baseball: '⚾',
      running: '🏃',
      cycling: '🚴',
      swimming: '🏊',
      hiking: '🥾',
      'rock climbing': '🧗'
    };
    return sportEmojis[sport.toLowerCase()] || '🏃';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to create games');
      return;
    }

    if (!formData.title || !formData.location || !formData.sport) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);

      const gameData = {
        title: formData.title,
        sport: formData.sport.toLowerCase(),
        date: formData.date,
        time: formData.time,
        duration: parseInt(formData.duration),
        location: formData.location,
        max_players: parseInt(formData.maxPlayers),
        cost: formData.cost,
        description: `${userProfile.firstName}'s ${formData.sport} game`,
        creator_id: user.id,
        created_by: user.id
      };

      const { data, error } = await supabase
        .from('games')
        .insert(gameData)
        .select()
        .single();

      if (error) throw error;

      // Automatically join the creator to the game
      const { error: joinError } = await supabase
        .from('game_participants')
        .insert({
          game_id: data.id,
          user_id: user.id,
          status: 'joined'
        });

      if (joinError) {
        console.error('Error joining game:', joinError);
        // Don't throw, game was still created successfully
      }

      toast.success('Game created successfully!');
      onGameCreated();
    } catch (error) {
      console.error('Error creating game:', error);
      toast.error('Failed to create game');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="mb-2">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sport Selection */}
            <div className="space-y-2">
              <Label htmlFor="sport">Sport *</Label>
              <Select
                value={formData.sport}
                onValueChange={(value) => setFormData({ ...formData, sport: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a sport">
                    {formData.sport && (
                      <span className="flex items-center gap-2">
                        <span>{getSportEmoji(formData.sport)}</span>
                        <span className="capitalize">{formData.sport}</span>
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {selectedSports.map((sport) => (
                    <SelectItem key={sport} value={sport.toLowerCase()}>
                      <div className="flex items-center gap-2">
                        <span>{getSportEmoji(sport)}</span>
                        <span>{sport}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Game Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Game Title *</Label>
              <Input
                id="title"
                placeholder={`e.g., ${userProfile.firstName}'s ${formData.sport || 'game'}`}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="location"
                  placeholder="e.g., Southwest Rec Center"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="pl-10"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Select
                  value={formData.time}
                  onValueChange={(value) => setFormData({ ...formData, time: value })}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {quickTimeSlots.find(slot => slot.value === formData.time)?.label || formData.time}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {quickTimeSlots.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Max Players */}
            <div className="space-y-2">
              <Label htmlFor="maxPlayers">Max Players</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="maxPlayers"
                  type="number"
                  min="2"
                  max="50"
                  value={formData.maxPlayers}
                  onChange={(e) => setFormData({ ...formData, maxPlayers: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Game...
                </>
              ) : (
                'Create Game'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-xs text-center text-muted-foreground">
        You'll be automatically added as the first participant
      </div>
    </div>
  );
};
