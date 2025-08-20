
'use client';

import { useState, useMemo } from 'react';
import { useUser, type TimetableEntry, type EmptySlot } from '@/app/providers/user-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { timeToMinutes } from '@/lib/time';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';


// A fixed, canonical list of all possible 1-hour time slots.
const ALL_POSSIBLE_SLOTS = [
    "7:00 AM - 8:00 AM", "8:00 AM - 9:00 AM", "9:00 AM - 10:00 AM", "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM", "12:00 PM - 1:00 PM", "1:30 PM - 2:30 PM", "2:30 PM - 3:30 PM",
    "3:30 PM - 4:30 PM", "4:30 PM - 5:30 PM", "5:30 PM - 6:30 PM", "6:30 PM - 7:30 PM"
];

function findFreeClassrooms(schedule: TimetableEntry[] | null): EmptySlot[] {
  if (!schedule || schedule.length === 0) return [];

  const allRooms = Array.from(new Set(schedule.map(entry => entry.room))).sort();
  const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  const emptySlots: EmptySlot[] = [];

  allDays.forEach(day => {
    allRooms.forEach(room => {
      // Get all classes scheduled for this specific room on this specific day
      const roomScheduleForDay = schedule.filter(e => e.day === day && e.room === room);
      
      // Check each possible 1-hour slot for overlaps
      ALL_POSSIBLE_SLOTS.forEach(slot => {
        const [slotStartStr, slotEndStr] = slot.split(' - ');
        const slotStart = timeToMinutes(slotStartStr);
        const slotEnd = timeToMinutes(slotEndStr);
        
        // A slot is free if no scheduled event overlaps with it
        const isOccupied = roomScheduleForDay.some(event => {
          const [eventStartStr, eventEndStr] = event.time.split(' - ');
          const eventStart = timeToMinutes(eventStartStr);
          const eventEnd = timeToMinutes(eventEndStr);

          // Overlap condition: (EventStart < SlotEnd) and (EventEnd > SlotStart)
          return eventStart < slotEnd && eventEnd > slotStart;
        });

        if (!isOccupied) {
          emptySlots.push({
            day,
            location: room,
            time: slot
          });
        }
      });
    });
  });

  return emptySlots;
}

export default function FindFreeRoomsPage() {
  const { 
    masterSchedule, 
    staffSchedules, 
    isClassTimetableDistributed, 
    user
  } = useUser();
  
  const [activeDay, setActiveDay] = useState<string>(() => {
    const todayIndex = new Date().getDay();
    // JS getDay(): Sunday is 0, Monday is 1...
    // Our array is Monday-first, so adjust index.
    return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][todayIndex] || 'Monday';
  });
  
  const combinedSchedule = useMemo(() => {
    if (!isClassTimetableDistributed) return [];
    return [...(masterSchedule || []), ...staffSchedules];
  }, [masterSchedule, staffSchedules, isClassTimetableDistributed]);

  const emptySlots = useMemo(() => {
    return findFreeClassrooms(combinedSchedule);
  }, [combinedSchedule]);

  const groupedSlots = useMemo(() => {
    const grouped = emptySlots.reduce((acc, slot) => {
      const day = slot.day;
      const room = slot.location;

      if (!acc[day]) {
        acc[day] = {};
      }
      if (!acc[day][room]) {
        acc[day][room] = [];
      }
      acc[day][room].push(slot.time);
      return acc;
    }, {} as Record<string, Record<string, string[]>>);

    // Sort room keys alphabetically within each day
    for (const day in grouped) {
        const sortedRooms = Object.keys(grouped[day]).sort((a, b) => a.localeCompare(b));
        const newDayData: Record<string, string[]> = {};
        for (const room of sortedRooms) {
            // Sort the time slots for each room chronologically
            newDayData[room] = grouped[day][room].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
        }
        grouped[day] = newDayData;
    }

    return grouped;
  }, [emptySlots]);

  if (user?.role !== 'student' && user?.role !== 'staff') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">This feature is only available for students and staff.</p>
      </div>
    );
  }

  if (!isClassTimetableDistributed || emptySlots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h1 className="text-2xl font-bold mb-2">No Data Available</h1>
        <p className="text-muted-foreground">
          {!isClassTimetableDistributed 
            ? "The class timetable has not been published yet. Please check back later."
            : "Could not determine free classrooms. The schedule may be full."
          }
        </p>
      </div>
    );
  }
  
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="max-w-7xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 /> Find Free Classrooms</CardTitle>
          <CardDescription>
            Select a day to see which classrooms are available and when. 
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={activeDay} onValueChange={setActiveDay} className="w-full">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-7">
              {daysOfWeek.map(day => (
                <TabsTrigger key={day} value={day} className="text-xs sm:text-sm">
                  {day.substring(0,3)}
                </TabsTrigger>
              ))}
            </TabsList>

            {daysOfWeek.map(day => (
              <TabsContent key={day} value={day} className="mt-6">
                {groupedSlots[day] && Object.keys(groupedSlots[day]).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Object.entries(groupedSlots[day])
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([room, times]) => (
                        <Card key={room} className="hover:shadow-md transition-shadow">
                          <CardHeader className="p-4">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Building2 className="w-5 h-5 text-primary" />
                              {room}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <ScrollArea className="h-48">
                              <div className="space-y-2 pr-4">
                                {times.map((time, index) => (
                                  <Badge key={index} variant="secondary" className="block text-center w-full justify-center text-sm font-normal py-1">
                                    {time}
                                  </Badge>
                                ))}
                              </div>
                            </ScrollArea>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No free rooms found</p>
                    <p className="text-sm">All classrooms appear to be occupied on {day}.</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
