import { useState } from 'react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Calendar, CalendarPlus, Download, ExternalLink, Smartphone } from 'lucide-react';
import { CalendarService } from '../lib/calendarService';
import { toast } from 'sonner';

interface CalendarIntegrationProps {
  game: any;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  showText?: boolean;
  className?: string;
}

export function CalendarIntegration({ 
  game, 
  variant = 'outline', 
  size = 'default', 
  showText = true,
  className = '' 
}: CalendarIntegrationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleGoogleCalendar = () => {
    try {
      const event = CalendarService.createEventFromGame(game);
      CalendarService.openGoogleCalendar(event);
      toast.success('Opening Google Calendar...');
      setIsOpen(false);
    } catch (error) {
      console.error('Error opening Google Calendar:', error);
      toast.error('Failed to open Google Calendar');
    }
  };

  const handleDownloadICS = () => {
    try {
      const event = CalendarService.createEventFromGame(game);
      CalendarService.downloadICSFile(event);
      toast.success('Calendar file downloaded!');
      setIsOpen(false);
    } catch (error) {
      console.error('Error downloading calendar file:', error);
      toast.error('Failed to download calendar file');
    }
  };

  const handleAppleCalendar = () => {
    // For iOS devices, we can try to open the calendar app directly
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      try {
        const event = CalendarService.createEventFromGame(game);
        const icsContent = CalendarService.generateICSFile(event);
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        
        // Try to open with calendar app
        window.location.href = url;
        toast.success('Opening Calendar app...');
        setIsOpen(false);
        
        // Cleanup
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (error) {
        console.error('Error opening Apple Calendar:', error);
        handleDownloadICS(); // Fallback to download
      }
    } else {
      handleDownloadICS(); // Fallback for non-iOS devices
    }
  };

  const handleOutlookCalendar = () => {
    try {
      const event = CalendarService.createEventFromGame(game);
      const outlookUrl = generateOutlookUrl(event);
      window.open(outlookUrl, '_blank');
      toast.success('Opening Outlook Calendar...');
      setIsOpen(false);
    } catch (error) {
      console.error('Error opening Outlook Calendar:', error);
      toast.error('Failed to open Outlook Calendar');
    }
  };

  // Generate Outlook calendar URL
  const generateOutlookUrl = (event: any) => {
    const baseUrl = 'https://outlook.live.com/calendar/0/deeplink/compose';
    const params = new URLSearchParams({
      subject: event.title,
      startdt: event.startDate.toISOString(),
      enddt: event.endDate.toISOString(),
      body: event.description + (event.url ? `\n\nGame Link: ${event.url}` : ''),
      location: event.location
    });
    return `${baseUrl}?${params.toString()}`;
  };

  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <CalendarPlus className="w-4 h-4" />
          {showText && <span className="ml-2">Add to Calendar</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleGoogleCalendar} className="cursor-pointer">
          <ExternalLink className="w-4 h-4 mr-2" />
          <div className="flex flex-col">
            <span>Google Calendar</span>
            <span className="text-xs text-muted-foreground">Opens in browser</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleAppleCalendar} className="cursor-pointer">
          <Smartphone className="w-4 h-4 mr-2" />
          <div className="flex flex-col">
            <span>Apple Calendar</span>
            <span className="text-xs text-muted-foreground">
              {/iPhone|iPad|iPod/.test(navigator.userAgent) ? 'Opens Calendar app' : 'Downloads .ics file'}
            </span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleOutlookCalendar} className="cursor-pointer">
          <Calendar className="w-4 h-4 mr-2" />
          <div className="flex flex-col">
            <span>Outlook Calendar</span>
            <span className="text-xs text-muted-foreground">Opens in browser</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleDownloadICS} className="cursor-pointer">
          <Download className="w-4 h-4 mr-2" />
          <div className="flex flex-col">
            <span>Download .ics file</span>
            <span className="text-xs text-muted-foreground">Works with any calendar app</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simplified version for mobile or compact layouts
export function CalendarButton({ game, className = '' }: { game: any; className?: string }) {
  const handleQuickAdd = () => {
    try {
      const event = CalendarService.createEventFromGame(game);
      
      // Smart detection of best calendar option
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        // iOS - try to open Calendar app
        const icsContent = CalendarService.generateICSFile(event);
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        window.location.href = url;
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast.success('Opening Calendar app...');
      } else if (/Android/.test(navigator.userAgent)) {
        // Android - open Google Calendar
        CalendarService.openGoogleCalendar(event);
        toast.success('Opening Google Calendar...');
      } else {
        // Desktop - download ICS file
        CalendarService.downloadICSFile(event);
        toast.success('Calendar file downloaded!');
      }
    } catch (error) {
      console.error('Error adding to calendar:', error);
      toast.error('Failed to add to calendar');
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleQuickAdd}
      className={className}
    >
      <CalendarPlus className="w-4 h-4 mr-2" />
      Add to Calendar
    </Button>
  );
}
