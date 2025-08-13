
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser } from '@/app/providers/user-provider';
import { Search } from 'lucide-react';

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Helper function to parse time ranges like "7:00-8:00 AM" to start minutes
function timeRangeToMinutes(timeRange: string): { start: number; end: number } {
  try {
    const timePart = timeRange.split(' ')[0];
    const [startTimeStr, endTimeStr] = timePart.split('-');
    
    // Handle AM/PM from the original string
    const isPM = timeRange.toLowerCase().includes('pm');
    const isAM = timeRange.toLowerCase().includes('am');

    const parseTime = (time: string) => {
      let [hours, minutes] = time.split(':').map(Number);
      hours = hours || 0;
      minutes = minutes || 0;

      // Convert to 24-hour format logic
      if (isPM && hours < 12) {
        hours += 12;
      } else if (isAM && hours === 12) { // Midnight case
        hours = 0;
      }
      return hours * 60 + minutes;
    };
    
    // A more robust check for end time AM/PM switch
    const startMinutes = parseTime(startTimeStr);
    let endMinutes = parseTime(endTimeStr);

    // If start time is PM and end time is also PM but numerically smaller (e.g. 10:30-1:30 PM), it's wrong.
    // However, the provided timeslots are simple, so we can assume end time is after start time on the same day.
    // If end time is something like 1:00 and start time is 11:00, and it's PM, end time should be afternoon
    if (endMinutes < startMinutes) {
       // This case happens for times like "11:00-12:00 PM" where 12 is parsed as 12, not 24.
       // Or "12:00-1:00 PM", where 12 is 12 and 1 is 13.
       if (endTimeStr.startsWith('12')) {
         // it's correct
       } else if (isPM) {
         endMinutes += 12 * 60;
       }
    }


    return {
      start: startMinutes,
      end: endMinutes
    };
  } catch (error) {
    return { start: 0, end: 0 };
  }
}


// Helper function to convert minutes back to time string
function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHours = h === 0 ? 12 : h > 12 ? h - 12 : h;
  
  return `${displayHours}:${m.toString().padStart(2, '0')} ${period}`;
}

export default function FreeRoomsDialog() {
  const { emptySlots } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [activeDay, setActiveDay] = useState(() => {
    const today = new Date().getDay();
    return days[today === 0 ? 6 : today - 1] || 'Monday';
  });

  const freeRoomsForDay = useMemo(() => {
    if (!emptySlots || !Array.isArray(emptySlots)) {
      return [];
    }

    const daySlots = emptySlots.filter(slot => slot.day === activeDay);
    
    if (daySlots.length === 0) {
      return [];
    }

    // Group slots by room
    const rooms = daySlots.reduce((acc, slot) => {
      if (!acc[slot.location]) {
        acc[slot.location] = [];
      }
      acc[slot.location].push(slot.time);
      return acc;
    }, {} as Record<string, string[]>);


    const consolidatedRooms: { room: string; freeRanges: string[] }[] = [];
    
    for (const room in rooms) {
      const timeRanges = (rooms[room] || [])
        .map(timeRange => {
           // The time slots are single hours, e.g., "7:00-8:00 AM".
           const startMinutes = timeRangeToMinutes(timeRange).start;
           return startMinutes;
        })
        .filter(minutes => !isNaN(minutes))
        .sort((a, b) => a - b);
      
      if (timeRanges.length === 0) continue;
      
      const consolidatedRanges: string[] = [];
      let currentStart = timeRanges[0];
      let currentEnd = timeRanges[0];
  
      for (let i = 1; i < timeRanges.length; i++) {
        const time = timeRanges[i];
        
        // Check if this slot is consecutive (60 minutes apart)
        if (time === currentEnd + 60) {
          currentEnd = time; // Extend the current range
        } else {
          // Add the completed range (end time is start of next slot) and start a new one
          consolidatedRanges.push(`${minutesToTimeString(currentStart)} - ${minutesToTimeString(currentEnd + 60)}`);
          currentStart = time;
          currentEnd = time;
        }
      }
      
      // Add the last range
      consolidatedRanges.push(`${minutesToTimeString(currentStart)} - ${minutesToTimeString(currentEnd + 60)}`);
      
      consolidatedRooms.push({ room, freeRanges: consolidatedRanges });
    }

    return consolidatedRooms.sort((a, b) => a.room.localeCompare(b.room));
  }, [emptySlots, activeDay]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
        >
          <Search className="mr-2 h-4 w-4" />
          Find Free Rooms
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
          <DialogHeader>
              <DialogTitle>Find Free Classrooms</DialogTitle>
              <DialogDescription>
                Select a day to see all available classrooms and their free time slots.
              </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            <Select value={activeDay} onValueChange={setActiveDay}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent>
                    {days.map(day => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <ScrollArea className="max-h-[60vh] -mx-6 px-6">
              {!emptySlots || emptySlots.length === 0 ? (
                <div className="text-center p-12 text-muted-foreground">
                  <p>No timetable data available.</p>
                  <p className="text-sm">Please have an administrator upload a timetable file first.</p>
                </div>
              ) : freeRoomsForDay.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {freeRoomsForDay.map(({ room, freeRanges }) => (
                          <Card key={room}>
                              <CardHeader className="p-4">
                                  <CardTitle className="text-base">{room}</CardTitle>
                              </CardHeader>
                              <CardContent className="p-4 pt-0">
                                  <div className="flex flex-wrap gap-1">
                                      {freeRanges.map((range, idx) => (
                                         <Badge key={idx} variant="secondary" className="font-normal text-xs whitespace-nowrap">{range}</Badge>
                                      ))}
                                  </div>
                              </CardContent>
                          </Card>
                      ))}
                  </div>
              ) : (
                  <div className="text-center p-12 text-muted-foreground">
                      <p>No free classrooms found for {activeDay}.</p>
                      <p className="text-sm">All rooms may be occupied.</p>
                  </div>
              )}
          </ScrollArea>
          <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
