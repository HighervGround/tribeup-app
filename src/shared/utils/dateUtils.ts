// Utility functions for consistent event date/time formatting

function toLocalDate(date: Date) {
  // Normalize to local midnight for comparisons
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function safeParse(dateStr?: string, timeStr?: string): Date | null {
  if (!dateStr && !timeStr) return null;
  // Try ISO first
  if (dateStr && !timeStr) {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }
  if (!dateStr && timeStr) {
    const d = new Date(timeStr);
    return isNaN(d.getTime()) ? null : d;
  }
  // Combine date and time into local date
  try {
    // Support formats like 2025-08-28 and 8:30 PM
    const [y, m, d] = (dateStr as string).split('-').map(Number);
    if (!y || !m || !d) throw new Error('bad date');
    let hours = 0, minutes = 0;
    if (timeStr) {
      const match = (timeStr as string).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
      if (match) {
        hours = parseInt(match[1], 10);
        minutes = match[2] ? parseInt(match[2], 10) : 0;
        const meridiem = match[3]?.toUpperCase();
        if (meridiem) {
          if (meridiem === 'PM' && hours < 12) hours += 12;
          if (meridiem === 'AM' && hours === 12) hours = 0;
        }
      }
    }
    const dt = new Date(y, m - 1, d, hours, minutes);
    return isNaN(dt.getTime()) ? null : dt;
  } catch {
    return null;
  }
}

function formatTime(dt: Date, locale?: string) {
  return new Intl.DateTimeFormat(locale || undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(dt);
}

function formatMonthDay(dt: Date, locale?: string) {
  return new Intl.DateTimeFormat(locale || undefined, {
    month: 'short',
    day: 'numeric'
  }).format(dt);
}

export function formatEventHeader(dateStr?: string, timeStr?: string, locale?: string) {
  const currentTime = new Date();
  const parsed = safeParse(dateStr, timeStr);
  if (!parsed) {
    // Fallback to simple join if parsing fails
    const datePart = dateStr || '';
    const timePart = timeStr || '';
    return {
      label: [datePart, timePart].filter(Boolean).join(' · '),
      aria: `Event ${[datePart, timePart].filter(Boolean).join(' at ')}`,
      isPast: false,
      isToday: false,
      date: datePart,
      time: timePart,
    };
  }

  // Use local dates for comparison to avoid timezone issues
  const now = new Date();
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventLocal = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  
  // Calculate difference in days using local date comparison
  const diffMs = eventLocal.getTime() - todayLocal.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  console.log(`📅 Date Debug: Today=${todayLocal.toDateString()}, Event=${eventLocal.toDateString()}, Diff=${diffDays} days, Raw=${diffMs}ms`);

  const timeLabel = timeStr ? formatTimeString(timeStr) : '';
  let dateLabel = '';
  let isToday = false;

  if (diffDays === 0) {
    dateLabel = 'Today';
    isToday = true;
  } else if (diffDays === 1) {
    dateLabel = 'Tomorrow';
  } else {
    dateLabel = formatMonthDay(parsed, locale);
  }

  const label = [dateLabel, timeLabel].filter(Boolean).join(' · ');
  const aria = `Event ${dateLabel}${timeLabel ? ` at ${timeLabel}` : ''}`;
  const isPast = parsed.getTime() < currentTime.getTime();

  return {
    label,
    aria,
    isPast,
    isToday,
    date: dateLabel,
    time: timeLabel,
  };
}

export function formatCalendarInfo(dateStr?: string, timeStr?: string, locale?: string) {
  const parsed = safeParse(dateStr, timeStr);
  if (!parsed) {
    return { date: dateStr || '', time: timeStr || '' };
  }
  return {
    date: formatMonthDay(parsed, locale),
    time: formatTime(parsed, locale),
  };
}

// Format cost display - convert $0 to Free
export function formatCost(cost: string): string {
  if (!cost) return 'Free';
  if (cost === '$0' || cost === '0' || cost.toLowerCase() === 'free') return 'Free';
  return cost;
}

// Convert 24-hour time string to 12-hour format
export function formatTimeString(timeStr: string): string {
  if (!timeStr) return '';
  
  try {
    // Parse time string like "14:30" or "14:30:00"
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return timeStr;
    }
    
    // Manual conversion to avoid timezone issues
    let displayHour = hours;
    let period = 'AM';
    
    if (hours === 0) {
      // Midnight: 00:xx -> 12:xx AM
      displayHour = 12;
      period = 'AM';
    } else if (hours === 12) {
      // Noon: 12:xx -> 12:xx PM
      displayHour = 12;
      period = 'PM';
    } else if (hours > 12) {
      // Afternoon/Evening: 13:xx -> 1:xx PM
      displayHour = hours - 12;
      period = 'PM';
    } else {
      // Morning: 1:xx-11:xx -> 1:xx-11:xx AM
      displayHour = hours;
      period = 'AM';
    }
    
    const minuteStr = minutes.toString().padStart(2, '0');
    return `${displayHour}:${minuteStr} ${period}`;
  } catch {
    return timeStr; // Return original if parsing fails
  }
}

/**
 * Calculate game expiry time (end time + buffer for post-game interaction)
 * 
 * Business Rule: Games remain visible until their end time + 2 hour buffer.
 * This allows for:
 * - Post-game reviews and ratings
 * - Chat/photos sharing after completion
 * - Late arrivals to still see details
 * - Social interaction continuation
 * 
 * @param dateStr - Game date (YYYY-MM-DD format)
 * @param timeStr - Game time (HH:MM format, 24-hour)
 * @param durationMinutes - Game duration in minutes (default: 120)
 * @param bufferMinutes - Buffer time after game ends (default: 120 = 2 hours)
 * @returns Date object representing when game should be hidden, or null if invalid input
 */
export function calculateGameExpiryTime(
  dateStr: string,
  timeStr: string,
  durationMinutes: number = 120,
  bufferMinutes: number = 120
): Date | null {
  if (!dateStr || !timeStr) return null;
  
  try {
    const gameStartTime = new Date(`${dateStr}T${timeStr}`);
    if (isNaN(gameStartTime.getTime())) return null;
    
    const totalMinutes = durationMinutes + bufferMinutes;
    const expiryTime = new Date(gameStartTime.getTime() + totalMinutes * 60 * 1000);
    
    return expiryTime;
  } catch {
    return null;
  }
}

/**
 * Check if a game is still active (not yet expired)
 * @param dateStr - Game date
 * @param timeStr - Game time
 * @param durationMinutes - Game duration
 * @param bufferMinutes - Buffer time after game ends
 * @returns true if game should still be visible
 */
export function isGameActive(
  dateStr: string,
  timeStr: string,
  durationMinutes: number = 120,
  bufferMinutes: number = 120
): boolean {
  const expiryTime = calculateGameExpiryTime(dateStr, timeStr, durationMinutes, bufferMinutes);
  if (!expiryTime) return false;
  
  return expiryTime > new Date();
}

/**
 * Format date string to human-readable format (e.g., "Saturday, December 13th")
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Formatted date string or original if parsing fails
 */
export function formatDateForShare(dateStr: string): string {
  if (!dateStr) return dateStr;
  
  try {
    const date = new Date(dateStr + 'T00:00:00');
    if (isNaN(date.getTime())) return dateStr;
    
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate();
    
    // Add ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
    const getOrdinal = (n: number): string => {
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };
    
    return `${dayOfWeek}, ${month} ${getOrdinal(day)}`;
  } catch {
    return dateStr;
  }
}

