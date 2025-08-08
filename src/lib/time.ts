
import { formatDistanceToNow } from 'date-fns';

export function formatRelativeTime(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

// Helper function to convert time string (e.g., "7:00 AM" or "7:00-8:00 AM") to minutes from midnight
export const timeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const timePart = timeStr.split('-')[0].trim();
    const match = timePart.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    
    // Handle format like "7 AM"
    if (!match) {
      const singleMatch = timePart.match(/(\d{1,2})\s*(AM|PM)/i);
      if (singleMatch) {
        let [_, hoursStr, modifier] = singleMatch;
        let hours = parseInt(hoursStr, 10);
        if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
        return hours * 60;
      }
      return 0; // Return 0 if format is unrecognized
    }

    let [_, hoursStr, minutesStr, modifier] = match;
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    
    if (modifier.toUpperCase() === 'PM' && hours < 12) {
      hours += 12;
    }
    if (modifier.toUpperCase() === 'AM' && hours === 12) {
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
