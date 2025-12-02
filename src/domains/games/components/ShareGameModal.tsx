import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { 
  Share2, 
  Copy, 
  Mail, 
  MessageSquare, 
  Calendar,
  MapPin,
  Users,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { formatTimeString, formatDateForShare, formatCost } from '@/shared/utils/dateUtils';
import { useDeepLinks } from '@/shared/hooks/useDeepLinks';
import { analyticsService } from '@/core/analytics/analyticsService';

interface ShareGameModalProps {
  game: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareGameModal({ game, isOpen, onClose }: ShareGameModalProps) {
  const [copied, setCopied] = useState(false);
  const { generateGameUrl } = useDeepLinks();
  
  if (!isOpen) return null;

  // Helper function to extract location name (remove full address)
  const extractLocationName = (location: string): string => {
    if (!location) return 'Location TBD';
    // Split by comma and take first part (venue name)
    const parts = location.split(',');
    return parts[0]?.trim() || location;
  };

  // Helper function to get sport emoji
  const getSportEmoji = (sport: string): string => {
    const emojiMap: Record<string, string> = {
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
      rock_climbing: '🧗',
    };
    return emojiMap[sport?.toLowerCase()] || '🏃';
  };

  // Helper function to format skill level
  const formatSkillLevel = (skillLevel?: string): string => {
    if (!skillLevel) return 'All skill levels welcome';
    const skillMap: Record<string, string> = {
      beginner: 'Beginner friendly',
      intermediate: 'Intermediate level',
      advanced: 'Advanced players',
      mixed: 'All skill levels welcome',
      competitive: 'Competitive',
    };
    return skillMap[skillLevel.toLowerCase()] || skillLevel;
  };

  // Generate improved share message
  const generateShareMessage = (url: string): string => {
    const sportEmoji = getSportEmoji(game.sport);
    const locationName = extractLocationName(game.location);
    const formattedDate = formatDateForShare(game.date);
    const formattedTime = formatTimeString(game.time);
    const cost = formatCost(game.cost || 'Free');
    const totalPlayers = game.totalPlayers ?? 0;
    const maxPlayers = game.maxPlayers ?? 0;
    const availableSpots = Math.max(0, maxPlayers - totalPlayers);
    const skillLevel = formatSkillLevel(game.skillLevel);
    
    const title = game.title || `${game.sport} at ${locationName}`;
    
    let message = `${sportEmoji} ${title}\n\n`;
    message += `📅 ${formattedDate} at ${formattedTime}\n`;
    message += `📍 ${locationName}\n`;
    message += `👥 ${totalPlayers}/${maxPlayers} players`;
    if (availableSpots > 0) {
      message += ` (${availableSpots} spot${availableSpots > 1 ? 's' : ''} left)`;
    } else if (totalPlayers >= maxPlayers) {
      message += ' (Full)';
    }
    message += `\n💰 ${cost}\n`;
    message += `🎯 ${skillLevel}\n\n`;
    message += `Join me! ${url}`;
    
    return message;
  };

  // Generate URL with UTM parameters
  const generateShareUrl = (shareMethod: string): string => {
    return generateGameUrl(game.id, {
      utm_source: shareMethod,
      utm_medium: 'share',
      utm_campaign: 'game_invitation',
    });
  };

  // Track share event in analytics
  const trackShare = (shareMethod: string) => {
    const totalPlayers = game.totalPlayers ?? 0;
    const maxPlayers = game.maxPlayers ?? 0;
    const availableSpots = Math.max(0, maxPlayers - totalPlayers);
    
    analyticsService.trackEvent('game_shared', {
      game_id: game.id,
      sport: game.sport,
      share_method: shareMethod,
      has_players: totalPlayers > 0,
      available_spots: availableSpots,
      total_players: totalPlayers,
      max_players: maxPlayers,
    });
  };

  const handleCopyLink = async () => {
    const url = generateShareUrl('clipboard');
    const shareMessage = generateShareMessage(url);
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
      trackShare('clipboard');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    const url = generateShareUrl('native_share');
    const shareMessage = generateShareMessage(url);
    const title = game.title || `${game.sport} at ${extractLocationName(game.location)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${title}`,
          text: shareMessage,
          url: url
        });
        trackShare('native_share');
      } catch (error: any) {
        // User cancelled share or error occurred
        if (error.name !== 'AbortError') {
          // If not a cancellation, fallback to clipboard
          await handleCopyLink();
        }
      }
    } else {
      // Fallback to clipboard if Web Share API not available
      await handleCopyLink();
    }
  };

  const handleEmailShare = () => {
    const url = generateShareUrl('email');
    const shareMessage = generateShareMessage(url);
    const title = game.title || `${game.sport} at ${extractLocationName(game.location)}`;
    
    const subject = encodeURIComponent(`Join me for ${game.sport}!`);
    const body = encodeURIComponent(`Hi!\n\nI'm organizing a ${game.sport} game and would love for you to join:\n\n${shareMessage}\n\nHope to see you there!`);
    
    window.open(`mailto:?subject=${subject}&body=${body}`);
    trackShare('email');
  };

  const handleSMSShare = () => {
    const url = generateShareUrl('sms');
    const shareMessage = generateShareMessage(url);
    const message = encodeURIComponent(shareMessage);
    
    window.open(`sms:?body=${message}`);
    trackShare('sms');
  };

  const handleWhatsAppShare = () => {
    const url = generateShareUrl('whatsapp');
    const shareMessage = generateShareMessage(url);
    const message = encodeURIComponent(shareMessage);
    
    window.open(`https://wa.me/?text=${message}`);
    trackShare('whatsapp');
  };

  // Generate URL for display (with UTM parameters)
  const gameDetailsUrl = generateShareUrl('clipboard');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Activity
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Game Preview */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">{game.title}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{game.sport}</Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{extractLocationName(game.location)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{formatDateForShare(game.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{formatTimeString(game.time)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{game.totalPlayers ?? 0}/{game.maxPlayers ?? 0} players</span>
              </div>
            </div>
          </div>

          {/* Share Link */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Activity Link
            </label>
            <div className="flex gap-2">
              <Input
                value={gameDetailsUrl}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className={copied ? 'bg-green-50 text-green-700' : ''}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Anyone can view this activity. Sign up to join!
            </p>
          </div>

          <Separator />

          {/* Share Options */}
          <div>
            <h4 className="text-sm font-medium mb-3">Share via</h4>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleNativeShare}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              
              <Button
                variant="outline"
                onClick={handleEmailShare}
                className="flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Email
              </Button>
              
              <Button
                variant="outline"
                onClick={handleSMSShare}
                className="flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                SMS
              </Button>
              
              <Button
                variant="outline"
                onClick={handleWhatsAppShare}
                className="flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button onClick={handleCopyLink} className="flex-1">
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
