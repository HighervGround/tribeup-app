import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from './ui/dialog';
import { Star, Users, Trophy, MessageCircle, CheckCircle } from 'lucide-react';
import { SupabaseService } from '../lib/supabaseService';
import { useAchievements } from '../hooks/useAchievements';
import { toast } from 'sonner';

interface Player {
  id: string;
  name: string;
  avatar?: string;
  isHost: boolean;
}

interface PostGameRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  gameTitle: string;
  players: Player[];
}

interface GameRating {
  overall: number;
  organization: number;
  skillLevel: number;
  fun: number;
  reviewText: string;
  wouldPlayAgain: boolean;
  recommendToOthers: boolean;
}

interface PlayerRating {
  playerId: string;
  skill: number;
  sportsmanship: number;
  communication: number;
  feedback: string;
}

export function PostGameRatingModal({ 
  isOpen, 
  onClose, 
  gameId, 
  gameTitle, 
  players 
}: PostGameRatingModalProps) {
  const { checkForNewAchievements } = useAchievements();
  const [step, setStep] = useState<'game' | 'players' | 'complete'>('game');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [gameRating, setGameRating] = useState<GameRating>({
    overall: 0,
    organization: 0,
    skillLevel: 0,
    fun: 0,
    reviewText: '',
    wouldPlayAgain: true,
    recommendToOthers: true
  });

  const [playerRatings, setPlayerRatings] = useState<PlayerRating[]>(
    players.map(player => ({
      playerId: player.id,
      skill: 0,
      sportsmanship: 0,
      communication: 0,
      feedback: ''
    }))
  );

  const StarRating = ({ 
    rating, 
    onRatingChange, 
    label 
  }: { 
    rating: number; 
    onRatingChange: (rating: number) => void; 
    label: string;
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`w-6 h-6 ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-400'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  const handleGameRatingSubmit = async () => {
    if (gameRating.overall === 0) {
      toast.error('Please provide an overall rating');
      return;
    }

    try {
      setIsSubmitting(true);
      await SupabaseService.submitGameReview({
        gameId,
        overallRating: gameRating.overall,
        organizationRating: gameRating.organization || undefined,
        skillLevelRating: gameRating.skillLevel || undefined,
        funRating: gameRating.fun || undefined,
        reviewText: gameRating.reviewText || undefined,
        wouldPlayAgain: gameRating.wouldPlayAgain,
        recommendToOthers: gameRating.recommendToOthers
      });

      setStep('players');
    } catch (error) {
      console.error('Failed to submit game rating:', error);
      toast.error('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlayerRatingsSubmit = async () => {
    const validRatings = playerRatings.filter(rating => 
      rating.skill > 0 && rating.sportsmanship > 0 && rating.communication > 0
    );

    if (validRatings.length === 0) {
      setStep('complete');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await Promise.all(
        validRatings.map(rating =>
          SupabaseService.submitPlayerRating({
            gameId,
            ratedPlayerId: rating.playerId,
            skillRating: rating.skill,
            sportsmanshipRating: rating.sportsmanship,
            communicationRating: rating.communication,
            feedbackText: rating.feedback || undefined
          })
        )
      );

      setStep('complete');
    } catch (error) {
      console.error('Failed to submit player ratings:', error);
      toast.error('Failed to submit player ratings. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    // Check for new achievements after rating
    await checkForNewAchievements();
    onClose();
  };

  const updatePlayerRating = (playerId: string, field: keyof PlayerRating, value: any) => {
    setPlayerRatings(prev =>
      prev.map(rating =>
        rating.playerId === playerId
          ? { ...rating, [field]: value }
          : rating
      )
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Rate Your Experience
          </DialogTitle>
          <DialogDescription>
            Help improve the community by rating {gameTitle}
          </DialogDescription>
        </DialogHeader>

        {step === 'game' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">How was the game?</h3>
              <p className="text-sm text-muted-foreground">Your feedback helps other players</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <StarRating
                rating={gameRating.overall}
                onRatingChange={(rating) => setGameRating(prev => ({ ...prev, overall: rating }))}
                label="Overall Rating *"
              />
              
              <StarRating
                rating={gameRating.organization}
                onRatingChange={(rating) => setGameRating(prev => ({ ...prev, organization: rating }))}
                label="Organization"
              />
              
              <StarRating
                rating={gameRating.skillLevel}
                onRatingChange={(rating) => setGameRating(prev => ({ ...prev, skillLevel: rating }))}
                label="Skill Level Match"
              />
              
              <StarRating
                rating={gameRating.fun}
                onRatingChange={(rating) => setGameRating(prev => ({ ...prev, fun: rating }))}
                label="Fun Factor"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Additional Comments</label>
              <Textarea
                placeholder="Share your experience with other players..."
                value={gameRating.reviewText}
                onChange={(e) => setGameRating(prev => ({ ...prev, reviewText: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gameRating.wouldPlayAgain}
                  onChange={(e) => setGameRating(prev => ({ ...prev, wouldPlayAgain: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">I'd play again</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gameRating.recommendToOthers}
                  onChange={(e) => setGameRating(prev => ({ ...prev, recommendToOthers: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">Recommend to others</span>
              </label>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Skip
              </Button>
              <Button 
                onClick={handleGameRatingSubmit} 
                disabled={isSubmitting || gameRating.overall === 0}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Next: Rate Players'}
              </Button>
            </div>
          </div>
        )}

        {step === 'players' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Rate Your Fellow Players</h3>
              <p className="text-sm text-muted-foreground">Optional but helps build a better community</p>
            </div>

            <div className="space-y-6">
              {players.map((player) => {
                const rating = playerRatings.find(r => r.playerId === player.id);
                if (!rating) return null;

                return (
                  <Card key={player.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {player.avatar && <AvatarImage src={player.avatar} alt={player.name} />}
                          <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">{player.name}</div>
                          {player.isHost && (
                            <Badge variant="secondary" className="text-xs">Host</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StarRating
                          rating={rating.skill}
                          onRatingChange={(r) => updatePlayerRating(player.id, 'skill', r)}
                          label="Skill Level"
                        />
                        <StarRating
                          rating={rating.sportsmanship}
                          onRatingChange={(r) => updatePlayerRating(player.id, 'sportsmanship', r)}
                          label="Sportsmanship"
                        />
                        <StarRating
                          rating={rating.communication}
                          onRatingChange={(r) => updatePlayerRating(player.id, 'communication', r)}
                          label="Communication"
                        />
                      </div>
                      
                      <Textarea
                        placeholder="Optional feedback for this player..."
                        value={rating.feedback}
                        onChange={(e) => updatePlayerRating(player.id, 'feedback', e.target.value)}
                        className="min-h-[60px]"
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('complete')} className="flex-1">
                Skip Player Ratings
              </Button>
              <Button 
                onClick={handlePlayerRatingsSubmit} 
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Ratings'}
              </Button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center space-y-6 py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Thanks for your feedback!</h3>
              <p className="text-muted-foreground">
                Your ratings help make TribeUp better for everyone
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Trophy className="w-4 h-4" />
                <span>Check your profile for any new achievements!</span>
              </div>
            </div>

            <Button onClick={handleComplete} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
