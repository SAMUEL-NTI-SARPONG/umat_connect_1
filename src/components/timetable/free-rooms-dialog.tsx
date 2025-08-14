
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
import { useUser, type EmptySlot } from '@/app/providers/user-provider';
import { Loader2, Search } from 'lucide-react';
import { timeToMinutes } from '@/lib/time';

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Helper function to consolidate time ranges
function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  let displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  if(displayHours === 0) displayHours = 12;

  const startTime = `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
  
  const endHours = Math.floor((minutes + 60) / 60);
  const endMins = (minutes + 60) % 60;
  const endPeriod = endHours >= 12 ? 'PM' : 'AM';
  let endDisplayHours = endHours === 0 ? 12 : endHours > 12 ? endHours - 12 : endHours;
  if(endDisplayHours === 0) endDisplayHours = 12;

  const endTime = `${endDisplayHours}:${endMins.toString().padStart(2, '0')} ${endPeriod}`;

  return `${startTime} - ${endTime}`;
}


export default function FreeRoomsDialog() {
  const { emptySlots } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  
  const [activeDay, setActiveDay] = useState(() => {
    const today = new Date().getDay();
    return days[today === 0 ? 6 : today - 1] || 'Monday';
  });
  
  const freeRoomsForDay = useMemo(() => {
    if (emptySlots.length === 0) return [];
    
    const daySlots = emptySlots.filter(slot => slot.day === activeDay);
    if (daySlots.length === 0) return [];

    const rooms = daySlots.reduce((acc, slot) => {
      if (!acc[slot.location]) {
        acc[slot.location] = [];
      }
      acc[slot.location].push(slot.time);
      return acc;
    }, {} as Record<string, string[]>);
    
    const consolidatedRooms = Object.keys(rooms).map(room => {
      const timeRanges = rooms[room]
        .map(timeRange => timeToMinutes(timeRange.split('-')[0].trim()))
        .sort((a, b) => a - b);
      
      if (timeRanges.length === 0) return null;
      
      const consolidatedRanges: string[] = [];
      let currentStart = timeRanges[0];
      let currentEnd = timeRanges[0] + 60;
  
      for (let i = 1; i < timeRanges.length; i++) {
        const rangeStart = timeRanges[i];
        if (rangeStart === currentEnd) {
          currentEnd = rangeStart + 60;
        } else {
          consolidatedRanges.push(minutesToTimeString(currentStart));
          currentStart = rangeStart;
          currentEnd = rangeStart + 60;
        }
      }
      consolidatedRanges.push(minutesToTimeString(currentStart));
      
      return { room, freeRanges: consolidatedRanges };
    }).filter(Boolean) as { room: string; freeRanges: string[] }[];
    
    return consolidatedRooms.sort((a, b) => a.room.localeCompare(b.room));
  }, [emptySlots, activeDay]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
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
              {emptySlots.length === 0 ? (
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
