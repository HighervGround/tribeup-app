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
import { formatTimeString } from '@/shared/utils/dateUtils';

interface ShareGameModalProps {
  game: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareGameModal({ game, isOpen, onClose }: ShareGameModalProps) {
  const [copied, setCopied] = useState(false);
  
  if (!isOpen) return null;

  const gameDetailsUrl = `${window.location.origin}/game/${game.id}`;
  const shareText = `Join me for ${game.sport} at ${game.location} on ${game.date}!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(gameDetailsUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${game.title}`,
          text: shareText,
          url: gameDetailsUrl
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Join me for ${game.sport}!`);
    const body = encodeURIComponent(`
Hi!

I'm organizing a ${game.sport} game and would love for you to join:

📍 ${game.location}
📅 ${game.date} at ${formatTimeString(game.time)}
💰 ${game.cost || 'Free'}
👥 ${game.totalPlayers ?? 0}/${game.maxPlayers ?? 0} players

${game.description ? game.description + '\n\n' : ''}View game details: ${gameDetailsUrl}

Hope to see you there!
    `.trim());
    
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleSMSShare = () => {
    const message = encodeURIComponent(`${shareText} View details: ${gameDetailsUrl}`);
    window.open(`sms:?body=${message}`);
  };

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(`${shareText} View details: ${gameDetailsUrl}`);
    window.open(`https://wa.me/?text=${message}`);
  };

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
                <span>{game.location}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{game.date}</span>
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
