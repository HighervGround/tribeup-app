import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { X, Copy, Share2, MessageCircle, Mail, Users, Check } from 'lucide-react';
import { toast } from 'sonner';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
  gameId: string;
  gameDate: string;
  gameTime: string;
  gameLocation: string;
  sport: string;
}

export function InviteModal({ 
  isOpen, 
  onClose, 
  gameTitle, 
  gameId, 
  gameDate, 
  gameTime, 
  gameLocation, 
  sport 
}: InviteModalProps) {
  const [copied, setCopied] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  if (!isOpen) return null;

  const gameUrl = `${window.location.origin}/game/${gameId}`;
  const shareText = `🏃‍♂️ Join me for ${sport}!\n\n"${gameTitle}"\n📅 ${gameDate} at ${gameTime}\n📍 ${gameLocation}\n\nTap to RSVP: ${gameUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(gameUrl);
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
          title: `Join me for ${sport}!`,
          text: shareText,
          url: gameUrl,
        });
        toast.success('Shared successfully!');
      } catch (error) {
        // User cancelled or error occurred
        handleCopyLink(); // Fallback to copy
      }
    } else {
      handleCopyLink(); // Fallback for browsers without native share
    }
  };

  const handleSMS = () => {
    const smsUrl = `sms:?body=${encodeURIComponent(shareText)}`;
    window.open(smsUrl, '_blank');
    toast.success('SMS app opened!');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Join me for ${sport} - ${gameTitle}`);
    const body = encodeURIComponent(`Hi!\n\nI'm organizing a ${sport} game and would love for you to join!\n\n${gameTitle}\n📅 ${gameDate} at ${gameTime}\n📍 ${gameLocation}\n\nClick here to RSVP: ${gameUrl}\n\nSee you there!\n`);
    const emailUrl = `mailto:?subject=${subject}&body=${body}`;
    window.open(emailUrl, '_blank');
    toast.success('Email app opened!');
  };

  const handleWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
    toast.success('WhatsApp opened!');
  };

  const quickInviteOptions = [
    {
      name: 'Copy Link',
      icon: copied ? Check : Copy,
      action: handleCopyLink,
      description: 'Copy shareable link',
      color: copied ? 'text-green-600' : 'text-blue-600'
    },
    {
      name: 'Share',
      icon: Share2,
      action: handleNativeShare,
      description: 'Use device share menu',
      color: 'text-purple-600'
    },
    {
      name: 'Text Message',
      icon: MessageCircle,
      action: handleSMS,
      description: 'Send via SMS',
      color: 'text-green-600'
    },
    {
      name: 'Email',
      icon: Mail,
      action: handleEmail,
      description: 'Send via email',
      color: 'text-red-600'
    },
    {
      name: 'WhatsApp',
      icon: Users,
      action: handleWhatsApp,
      description: 'Share on WhatsApp',
      color: 'text-green-500'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Invite Friends</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Game Preview */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{sport}</Badge>
              <h3 className="font-semibold text-sm">{gameTitle}</h3>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>📅 {gameDate} at {gameTime}</div>
              <div>📍 {gameLocation}</div>
            </div>
          </div>

          {/* Share Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Game Link</label>
            <div className="flex gap-2">
              <Input 
                value={gameUrl} 
                readOnly 
                className="text-xs"
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleCopyLink}
                className={copied ? 'text-green-600' : ''}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Quick Share Options */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Quick Invite</label>
            <div className="grid grid-cols-2 gap-2">
              {quickInviteOptions.map((option) => (
                <Button
                  key={option.name}
                  variant="outline"
                  className="h-auto p-3 flex flex-col items-center gap-2"
                  onClick={option.action}
                >
                  <option.icon className={`w-5 h-5 ${option.color}`} />
                  <div className="text-center">
                    <div className="text-xs font-medium">{option.name}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Share Message Preview */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Message Preview</label>
            <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground border-l-2 border-primary/20">
              {shareText}
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Anyone with the link can view and join this game
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
