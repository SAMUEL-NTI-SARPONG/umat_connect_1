
'use client';

import { useState, useMemo } from 'react';
import { useUser, type TimetableEntry, type EmptySlot } from '@/app/providers/user-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { timeToMinutes } from '@/lib/time';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';


function findFreeClassrooms(schedule: TimetableEntry[] | null): EmptySlot[] {
  if (!schedule || schedule.length === 0) return [];

  // 1. Get all unique rooms, time slots, and days from the schedule
  const allRooms = Array.from(new Set(schedule.map(entry => entry.room))).sort();
  const allTimeSlots = Array.from(new Set(schedule.map(entry => entry.time)));
  const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Sort time slots chronologically for predictable output
  const sortedTimeSlots = allTimeSlots.sort((a, b) => {
    const timeA = a.split(' - ')[0];
    const timeB = b.split(' - ')[0];
    return timeToMinutes(timeA) - timeToMinutes(timeB);
  });

  const emptySlots: EmptySlot[] = [];

  // 2. Create a lookup for occupied slots: "day|room|time"
  const occupiedSlots = new Set(
    schedule.map(entry => `${entry.day}|${entry.room}|${entry.time}`)
  );

  // 3. Iterate through every combination and find what's NOT occupied
  allDays.forEach(day => {
    allRooms.forEach(room => {
      sortedTimeSlots.forEach(time => {
        const slotKey = `${day}|${room}|${time}`;
        if (!occupiedSlots.has(slotKey)) {
          emptySlots.push({
            day,
            location: room,
            time
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
        newDayData[room] = grouped[day][room];
      }
      grouped[day] = newDayData;
    }

    return grouped;
  }, [emptySlots]);

  if (user?.role !== 'student') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">This feature is only available for students.</p>
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
                                  <div 
                                    key={index} 
                                    className="p-2 bg-green-50 dark:bg-green-950 rounded-md text-sm border border-green-200 dark:border-green-800"
                                  >
                                    <span className="text-green-700 dark:text-green-300 font-medium">
                                      {time}
                                    </span>
                                  </div>
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
