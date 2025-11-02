import { Button } from '@/shared/components/ui/button';
import { CalendarPlus } from 'lucide-react';

interface SimpleCalendarButtonProps {
  game: any;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function SimpleCalendarButton({ 
  game, 
  variant = 'outline', 
  size = 'sm',
  className = '' 
}: SimpleCalendarButtonProps) {
  
  const handleAddToCalendar = () => {
    // Create event details
    const gameDateTime = new Date(`${game.date}T${game.time}`);
    const endDateTime = new Date(gameDateTime);
    endDateTime.setHours(endDateTime.getHours() + 2); // Default 2 hours
    
    const title = `${game.sport}: ${game.title}`;
    const description = `Join us for ${game.sport}!\n\n${game.description || ''}\n\nMax Players: ${game.maxPlayers || game.max_players}\nCost: ${game.cost || 'Free'}`;
    const location = game.location;
    
    // Format dates (YYYYMMDDTHHMMSSZ)
    const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    
    // Detect device and use appropriate calendar
    const userAgent = navigator.userAgent;
    
    if (/iPhone|iPad|iPod/.test(userAgent)) {
      // iOS - Create .ics file and try to open with Calendar app
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//TribeUp//TribeUp Social Sports//EN',
        'BEGIN:VEVENT',
        `UID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@tribeup.app`,
        `DTSTART:${formatDate(gameDateTime)}`,
        `DTEND:${formatDate(endDateTime)}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        `DTSTAMP:${formatDate(new Date())}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');
      
      const blob = new Blob([icsContent], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      
      // Try to open with Calendar app
      window.location.href = url;
      
      // Cleanup after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
    } else if (/Android/.test(userAgent)) {
      // Android - Use Google Calendar
      const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatDate(gameDateTime)}/${formatDate(endDateTime)}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
      window.open(googleUrl, '_blank');
      
    } else if (/Mac/.test(userAgent)) {
      // macOS - Create .ics file for Calendar app
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//TribeUp//TribeUp Social Sports//EN',
        'BEGIN:VEVENT',
        `UID:${Date.now()}-${Math.random().toString(36).substr(2, 9)}@tribeup.app`,
        `DTSTART:${formatDate(gameDateTime)}`,
        `DTEND:${formatDate(endDateTime)}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        `DTSTAMP:${formatDate(new Date())}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');
      
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } else {
      // Default - Google Calendar for all other devices
      const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatDate(gameDateTime)}/${formatDate(endDateTime)}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}`;
      window.open(googleUrl, '_blank');
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleAddToCalendar}
      className={className}
    >
      <CalendarPlus className="w-4 h-4" />
    </Button>
  );
}
