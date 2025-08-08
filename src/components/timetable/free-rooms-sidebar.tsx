
'use client';

import { useUser } from '@/app/providers/user-provider';
import { useMemo, useState } from 'react';
import { SidebarContent, SidebarHeader } from '../ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { timeToMinutes, minutesToTime } from '@/lib/time';

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function FreeRoomsSidebar() {
    const { emptySlots } = useUser();
    const [activeDay, setActiveDay] = useState(() => {
        const today = new Date().getDay();
        return days[today >= 1 && today <= 5 ? today - 1 : 0] || 'Monday';
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
        <div className="flex flex-col h-full">
            <SidebarHeader>
                <CardTitle className="text-lg font-semibold">Free Classrooms</CardTitle>
            </SidebarHeader>
            <SidebarContent className="p-4 flex flex-col gap-4">
                 <Tabs defaultValue={activeDay} onValueChange={setActiveDay} className="w-full">
                    <TabsList className="grid w-full grid-cols-5 h-12">
                        {days.map(day => (
                        <TabsTrigger key={day} value={day} className="text-xs sm:text-sm">{day.substring(0, 3)}</TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
                <ScrollArea className="flex-grow h-0">
                    <div className='pr-4 space-y-3'>
                        {freeRoomsForDay.length > 0 ? (
                           freeRoomsForDay.map(({ room, freeRanges }) => (
                                <Card key={room}>
                                    <CardHeader className="p-3">
                                        <CardTitle className="text-sm">{room}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-3 pt-0">
                                        <div className="flex flex-wrap gap-1">
                                            {freeRanges.map((range, idx) => (
                                            <Badge key={idx} variant="secondary" className="font-normal text-xs whitespace-nowrap">{range}</Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>No free classrooms found for {activeDay}.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </SidebarContent>
        </div>
    )
}
