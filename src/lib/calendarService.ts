export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  url?: string;
}

export class CalendarService {
  // Generate Google Calendar URL
  static generateGoogleCalendarUrl(event: CalendarEvent): string {
    const baseUrl = 'https://calendar.google.com/calendar/render';
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${this.formatDateForGoogle(event.startDate)}/${this.formatDateForGoogle(event.endDate)}`,
      details: event.description + (event.url ? `\n\nGame Link: ${event.url}` : ''),
      location: event.location,
      trp: 'false'
    });

    return `${baseUrl}?${params.toString()}`;
  }

  // Generate Apple Calendar (ICS) file
  static generateICSFile(event: CalendarEvent): string {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TribeUp//TribeUp Social Sports//EN',
      'BEGIN:VEVENT',
      `UID:${this.generateUID()}`,
      `DTSTART:${this.formatDateForICS(event.startDate)}`,
      `DTEND:${this.formatDateForICS(event.endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description}${event.url ? '\\n\\nGame Link: ' + event.url : ''}`,
      `LOCATION:${event.location}`,
      `DTSTAMP:${this.formatDateForICS(new Date())}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return icsContent;
  }

  // Download ICS file
  static downloadICSFile(event: CalendarEvent, filename?: string): void {
    const icsContent = this.generateICSFile(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Open Google Calendar in new tab
  static openGoogleCalendar(event: CalendarEvent): void {
    const url = this.generateGoogleCalendarUrl(event);
    window.open(url, '_blank');
  }

  // Create calendar event from game data
  static createEventFromGame(game: any): CalendarEvent {
    const gameDateTime = new Date(`${game.date}T${game.time}`);
    const endDateTime = new Date(gameDateTime);
    
    // Default to 2 hours if no duration specified
    const durationHours = game.duration ? parseInt(game.duration) : 2;
    endDateTime.setHours(endDateTime.getHours() + durationHours);

    return {
      title: `${game.sport}: ${game.title}`,
      description: `Join us for ${game.sport}!\n\n${game.description}\n\nMax Players: ${game.max_players}\nCost: ${game.cost ? `$${game.cost}` : 'Free'}`,
      location: game.location,
      startDate: gameDateTime,
      endDate: endDateTime,
      url: `${window.location.origin}/game/${game.id}`
    };
  }

  // Format date for Google Calendar (YYYYMMDDTHHMMSSZ)
  private static formatDateForGoogle(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  // Format date for ICS file (YYYYMMDDTHHMMSSZ)
  private static formatDateForICS(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  // Generate unique ID for calendar event
  private static generateUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@tribeup.app`;
  }

  // Check if device supports calendar integration
  static isCalendarSupported(): boolean {
    return typeof window !== 'undefined' && (
      /iPhone|iPad|iPod/.test(navigator.userAgent) || // iOS
      /Android/.test(navigator.userAgent) || // Android
      navigator.userAgent.includes('Mac') // macOS
    );
  }

  // Get appropriate calendar action text based on device
  static getCalendarActionText(): string {
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      return 'Add to Calendar';
    } else if (/Android/.test(navigator.userAgent)) {
      return 'Add to Google Calendar';
    } else if (navigator.userAgent.includes('Mac')) {
      return 'Add to Calendar';
    }
    return 'Add to Calendar';
  }
}
