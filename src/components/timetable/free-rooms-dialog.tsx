

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
import { minutesToTime, timeToMinutes } from '@/lib/time';
import { Search } from 'lucide-react';

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function FreeRoomsDialog() {
  const { emptySlots } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [activeDay, setActiveDay] = useState(() => {
    const today = new Date().getDay();
    return days[today === 0 ? 6 : today - 1] || 'Monday';
  });

  const freeRoomsForDay = useMemo(() => {
    const daySlots = emptySlots.filter(slot => slot.day === activeDay);
    if (daySlots.length === 0) return [];

    const rooms = daySlots.reduce((acc, slot) => {
      if (!acc[slot.location]) {
        acc[slot.location] = [];
      }
      acc[slot.location].push(slot.time);
      return acc;
    }, {} as Record<string, string[]>);

    const consolidatedRooms: { room: string; freeRanges: string[] }[] = [];
    
    for (const room in rooms) {
      const slots = (rooms[room] || [])
        .map(time => ({ start: timeToMinutes(time), end: timeToMinutes(time) + 60 }))
        .sort((a, b) => a.start - b.start);
      
      if (slots.length === 0) continue;
      
      const ranges: string[] = [];
      let currentRangeStart = slots[0].start;
      let currentRangeEnd = slots[0].end;
  
      for (let i = 1; i < slots.length; i++) {
        if (slots[i].start === currentRangeEnd) {
          currentRangeEnd = slots[i].end;
        } else {
          ranges.push(`${minutesToTime(currentRangeStart)} - ${minutesToTime(currentRangeEnd)}`);
          currentRangeStart = slots[i].start;
          currentRangeEnd = slots[i].end;
        }
      }
      ranges.push(`${minutesToTime(currentRangeStart)} - ${minutesToTime(currentRangeEnd)}`);
      consolidatedRooms.push({ room, freeRanges: ranges });
    }

    return consolidatedRooms.sort((a, b) => a.room.localeCompare(b.room));
  }, [emptySlots, activeDay]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="success">
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
              {freeRoomsForDay.length > 0 ? (
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
