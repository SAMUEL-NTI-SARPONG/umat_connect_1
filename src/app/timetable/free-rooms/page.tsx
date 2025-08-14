
'use client';

import { useState, useMemo } from 'react';
import { useUser, type TimetableEntry, type EmptySlot } from '@/app/providers/user-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { timeToMinutes } from '@/lib/time';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2 } from 'lucide-react';

/**
 * Improved function to find empty classrooms from the actual timetable structure
 * This should be used when you have the complete timetable metadata
 */
function findEmptyClassroomsFromActualStructure(
  schedule: TimetableEntry[] | null,
  timetableMetadata?: {
    allRooms: string[];
    allTimeSlots: string[];
    allDays: string[];
  }
): EmptySlot[] {
  if (!schedule || !timetableMetadata) return [];

  const { allRooms, allTimeSlots, allDays } = timetableMetadata;
  const emptySlots: EmptySlot[] = [];

  // Create a lookup set for occupied slots for O(1) lookup time
  const occupiedSlots = new Set(
    schedule.map(entry => `${entry.day}|${entry.time}|${entry.room}`)
  );

  // Check every possible combination of day, time, and room
  allDays.forEach(day => {
    allTimeSlots.forEach(time => {
      allRooms.forEach(room => {
        const slotKey = `${day}|${time}|${room}`;
        
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

/**
 * Fallback function for when metadata is not available
 * This reconstructs the possible slots from the existing schedule
 */
function findEmptyClassroomsFromExistingSchedule(schedule: TimetableEntry[] | null): EmptySlot[] {
  if (!schedule || schedule.length === 0) return [];

  // Extract unique rooms, times, and days from the schedule
  const allRooms = Array.from(new Set(schedule.map(entry => entry.room)));
  const allTimeSlots = Array.from(new Set(schedule.map(entry => entry.time)));
  const allDays = Array.from(new Set(schedule.map(entry => entry.day)));

  // Sort time slots chronologically
  const sortedTimeSlots = allTimeSlots.sort((a, b) => {
    const timeA = extractStartTime(a);
    const timeB = extractStartTime(b);
    return timeToMinutes(timeA) - timeToMinutes(timeB);
  });

  // Ensure days are in proper order
  const orderedDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    .filter(day => allDays.includes(day));

  const emptySlots: EmptySlot[] = [];

  // Create a lookup set for occupied slots
  const occupiedSlots = new Set(
    schedule.map(entry => `${entry.day}|${entry.time}|${entry.room}`)
  );

  // Check every possible combination
  orderedDays.forEach(day => {
    sortedTimeSlots.forEach(time => {
      allRooms.forEach(room => {
        const slotKey = `${day}|${time}|${room}`;
        
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

/**
 * Helper function to extract start time from time range strings
 */
function extractStartTime(timeRange: string): string {
  if (!timeRange) return '';
  
  // Handle different time formats
  if (timeRange.includes(' - ')) {
    return timeRange.split(' - ')[0].trim();
  }
  
  if (timeRange.includes('-')) {
    return timeRange.split('-')[0].trim();
  }
  
  return timeRange.trim();
}

/**
 * Helper function to group consecutive time slots for better display
 */
function groupConsecutiveTimeSlots(timeSlots: string[]): string[] {
  if (timeSlots.length === 0) return [];

  const sorted = timeSlots.sort((a, b) => {
    const timeA = extractStartTime(a);
    const timeB = extractStartTime(b);
    return timeToMinutes(timeA) - timeToMinutes(timeB);
  });

  const grouped: string[] = [];
  let currentGroup = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prevEndTime = extractEndTime(sorted[i - 1]);
    const currentStartTime = extractStartTime(sorted[i]);
    
    // Check if current slot is consecutive to the previous one
    if (areTimeSlotsConsecutive(prevEndTime, currentStartTime)) {
      currentGroup.push(sorted[i]);
    } else {
      // Finalize current group and start a new one
      if (currentGroup.length > 1) {
        const groupStart = extractStartTime(currentGroup[0]);
        const groupEnd = extractEndTime(currentGroup[currentGroup.length - 1]);
        grouped.push(`${groupStart} - ${groupEnd}`);
      } else {
        grouped.push(currentGroup[0]);
      }
      currentGroup = [sorted[i]];
    }
  }

  // Handle the last group
  if (currentGroup.length > 1) {
    const groupStart = extractStartTime(currentGroup[0]);
    const groupEnd = extractEndTime(currentGroup[currentGroup.length - 1]);
    grouped.push(`${groupStart} - ${groupEnd}`);
  } else if (currentGroup.length === 1) {
    grouped.push(currentGroup[0]);
  }

  return grouped;
}

function extractEndTime(timeRange: string): string {
  if (!timeRange) return '';
  
  if (timeRange.includes(' - ')) {
    return timeRange.split(' - ')[1].trim();
  }
  
  if (timeRange.includes('-')) {
    return timeRange.split('-')[1].trim();
  }
  
  // If no end time, assume 1 hour duration
  const startTime = timeRange.trim();
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + 60;
  
  // Convert back to time string - you may need to implement this function
  return minutesToTime(endMinutes);
}

function areTimeSlotsConsecutive(endTime1: string, startTime2: string): boolean {
  const end1Minutes = timeToMinutes(endTime1);
  const start2Minutes = timeToMinutes(startTime2);
  
  // Allow for small gaps (up to 30 minutes) to be considered consecutive
  return Math.abs(start2Minutes - end1Minutes) <= 30;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
}

export default function FindFreeRoomsPage() {
  const { 
    masterSchedule, 
    staffSchedules, 
    isClassTimetableDistributed, 
    user,
    timetableMetadata // Assume this contains allRooms, allTimeSlots, allDays
  } = useUser();
  
  const [activeDay, setActiveDay] = useState<string>(() => {
    const todayIndex = new Date().getDay();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[todayIndex === 0 ? 6 : todayIndex - 1] || 'Monday';
  });
  
  const combinedSchedule = useMemo(() => {
    if (!isClassTimetableDistributed) return [];
    return [...(masterSchedule || []), ...staffSchedules];
  }, [masterSchedule, staffSchedules, isClassTimetableDistributed]);

  const emptySlots = useMemo(() => {
    // Use the improved algorithm with metadata if available
    if (timetableMetadata) {
      return findEmptyClassroomsFromActualStructure(combinedSchedule, timetableMetadata);
    }
    
    // Fallback to reconstructing from existing schedule
    return findEmptyClassroomsFromExistingSchedule(combinedSchedule);
  }, [combinedSchedule, timetableMetadata]);

  const groupedSlots = useMemo(() => {
    const grouped = emptySlots.reduce((acc, slot) => {
      if (!acc[slot.day]) {
        acc[slot.day] = {};
      }
      if (!acc[slot.day][slot.location]) {
        acc[slot.day][slot.location] = [];
      }
      acc[slot.day][slot.location].push(slot.time);
      return acc;
    }, {} as Record<string, Record<string, string[]>>);

    // Group consecutive time slots for each room
    Object.keys(grouped).forEach(day => {
      Object.keys(grouped[day]).forEach(room => {
        grouped[day][room] = groupConsecutiveTimeSlots(grouped[day][room]);
      });
    });

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
            : "No empty classrooms found. All rooms appear to be occupied."
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
          <CardTitle>Find Free Classrooms</CardTitle>
          <CardDescription>
            Select a day to see which classrooms are available and when. 
            Time slots are grouped for easier viewing.
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
                            <CardDescription className="text-sm">
                              {times.length} time slot{times.length > 1 ? 's' : ''} available
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <ScrollArea className="h-48">
                              <div className="space-y-2 pr-4">
                                {times.map((time, index) => (
                                  <div 
                                    key={index} 
                                    className="p-2 bg-green-50 dark:bg-green-950 rounded text-sm border border-green-200 dark:border-green-800"
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
                    <p className="text-sm">All classrooms are occupied on {day}.</p>
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
