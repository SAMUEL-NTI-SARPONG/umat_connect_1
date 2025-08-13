
import { formatDistanceToNow } from 'date-fns';

export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

// Helper function to convert time string (e.g., "7:00 AM" or "7:00-8:00 AM") to minutes from midnight
export const timeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    // Always take the first part of a time range string like "7:00-8:00 AM"
    const timePart = timeStr.split('-')[0].trim();
    
    // Regex to match "7:00 AM", "12:30 PM", etc.
    const match = timePart.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)/i);

    if (!match) {
        return 0; // Return 0 if format is unrecognized
    }
    
    // We may not have minutes, so default to 0
    let [_, hoursStr, minutesStr, modifier] = match;
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10) || 0;
    
    if (modifier.toUpperCase() === 'PM' && hours < 12) {
      hours += 12;
    }
    if (modifier.toUpperCase() === 'AM' && hours === 12) { // Handle 12:00 AM (midnight)
      hours = 0;
    }
    
    return hours * 60 + minutes;
};

// Helper function to convert minutes from midnight back to a time string (e.g., "7:00 AM")
export const minutesToTime = (minutes: number): string => {
    let hours = Math.floor(minutes / 60);
    const mins = String(minutes % 60).padStart(2, '0');
    const modifier = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${hours}:${mins} ${modifier}`;
};
