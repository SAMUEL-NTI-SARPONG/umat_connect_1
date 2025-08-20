
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, type TimetableEntry, type EmptySlot } from '@/app/providers/user-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { minutesToTime, timeToMinutes } from '@/lib/time';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, PlusCircle, CalendarPlus, FilePenLine, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


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
      const roomScheduleForDay = schedule.filter(e => e.day === day && e.room === room);
      
      ALL_POSSIBLE_SLOTS.forEach(slot => {
        const [slotStartStr, slotEndStr] = slot.split(' - ');
        const slotStart = timeToMinutes(slotStartStr);
        const slotEnd = timeToMinutes(slotEndStr);
        
        const isOccupied = roomScheduleForDay.some(event => {
          const [eventStartStr, eventEndStr] = event.time.split(' - ');
          const eventStart = timeToMinutes(eventStartStr);
          const eventEnd = timeToMinutes(eventEndStr);

          // Check for any overlap
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
    user,
    masterSchedule, 
    staffSchedules, 
    isClassTimetableDistributed,
    addStaffSchedule, 
    toast,
  } = useUser();
  
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  const [activeDay, setActiveDay] = useState<string>(() => {
    const todayIndex = new Date().getDay();
    // JS Date: Sunday = 0, Monday = 1... Our array is 0-indexed from Monday
    return daysOfWeek[todayIndex === 0 ? 6 : todayIndex - 1] || 'Monday';
  });

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<Map<string, Set<string>>>(new Map());
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleType, setScheduleType] = useState<'class' | 'quiz' | null>(null);
  const [courseCode, setCourseCode] = useState('');
  const [scheduleDay, setScheduleDay] = useState(activeDay);
  const [roomSearchTerm, setRoomSearchTerm] = useState('');

  useEffect(() => {
    if (!isScheduleModalOpen) {
        setScheduleDay(activeDay);
    }
  }, [isScheduleModalOpen, activeDay]);
  
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

      if (!acc[day]) acc[day] = {};
      if (!acc[day][room]) acc[day][room] = [];

      acc[day][room].push(slot.time);
      return acc;
    }, {} as Record<string, Record<string, string[]>>);

    // Sort rooms within each day
    for (const day in grouped) {
        const sortedRooms = Object.keys(grouped[day]).sort((a, b) => a.localeCompare(b));
        const newDayData: Record<string, string[]> = {};
        for (const room of sortedRooms) {
            // Sort time slots for each room
            newDayData[room] = grouped[day][room].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
        }
        grouped[day] = newDayData;
    }

    return grouped;
  }, [emptySlots]);
  
  const filteredRoomsForDay = useMemo(() => {
    if (!groupedSlots[activeDay]) return [];
    const rooms = Object.entries(groupedSlots[activeDay]);
    if (!roomSearchTerm) return rooms;
    return rooms.filter(([roomName]) =>
      roomName.toLowerCase().includes(roomSearchTerm.toLowerCase())
    );
  }, [groupedSlots, activeDay, roomSearchTerm]);

  const handleSelectionToggle = () => {
    setIsSelectionMode(prev => !prev);
    setSelectedSlots(new Map()); // Reset selection when toggling
  };

  const handleSlotSelection = (room: string, time: string, isChecked: boolean) => {
    setSelectedSlots(prev => {
        const newMap = new Map(prev);
        if (isChecked) {
            // Can only select slots from one room at a time
            if (newMap.size > 0 && !newMap.has(room)) {
                toast({
                    title: 'Selection Error',
                    description: "You can only select time slots from one room at a time.",
                    variant: 'destructive',
                });
                return prev;
            }
            const roomSlots = newMap.get(room) || new Set();
            roomSlots.add(time);
            newMap.set(room, roomSlots);
        } else {
            const roomSlots = newMap.get(room);
            if (roomSlots) {
                roomSlots.delete(time);
                if (roomSlots.size === 0) {
                    newMap.delete(room);
                }
            }
        }
        return newMap;
    });
  };

  const hasSelection = useMemo(() => selectedSlots.size > 0, [selectedSlots]);
  const selectedRoom = useMemo(() => hasSelection ? selectedSlots.keys().next().value : null, [hasSelection, selectedSlots]);

  const openScheduleModal = (type: 'class' | 'quiz') => {
    setScheduleType(type);
    setIsScheduleModalOpen(true);
  };
  
  const handleScheduleSubmit = () => {
    if (!selectedRoom || !scheduleType || !courseCode.trim() || !masterSchedule) {
        toast({
            title: 'Missing Information',
            description: "Please provide a valid course code.",
            variant: 'destructive',
        });
        return;
    }

    // Find the course details from the master schedule
    const courseDetails = masterSchedule.find(entry => entry.courseCode.toLowerCase() === courseCode.trim().toLowerCase());

    if (!courseDetails) {
        toast({
            title: 'Invalid Course',
            description: `The course code "${courseCode}" was not found in the master timetable.`,
            variant: 'destructive',
        });
        return;
    }

    const times = Array.from(selectedSlots.get(selectedRoom)!).sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
    const startTimeStr = times[0].split(' - ')[0];
    const endTimeStr = times[times.length - 1].split(' - ')[1];
    
    addStaffSchedule({
        day: scheduleDay,
        time: `${startTimeStr} - ${endTimeStr}`,
        room: selectedRoom,
        departments: courseDetails.departments,
        level: courseDetails.level,
        courseCode: courseDetails.courseCode, // Use the canonical course code
        status: scheduleType === 'quiz' ? 'quiz' : 'confirmed',
    });
    
    // Reset state
    setIsScheduleModalOpen(false);
    setScheduleType(null);
    setIsSelectionMode(false);
    setSelectedSlots(new Map());
    setCourseCode('');
  };
  
  if (user?.role !== 'student' && user?.role !== 'staff') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">This feature is not available for your role.</p>
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
  
  return (
    <>
      <div className="max-w-7xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2"><Building2 /> Find Free Classrooms</CardTitle>
                <CardDescription>
                  {user.role === 'staff' && isSelectionMode ? "Select available time slots to schedule an event." : "Select a day to see which classrooms are available and when."}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search for a room..."
                      className="pl-10"
                      value={roomSearchTerm}
                      onChange={(e) => setRoomSearchTerm(e.target.value)}
                    />
                </div>
                {user.role === 'staff' && (
                  <>
                      <Button variant={isSelectionMode ? "destructive" : "outline"} onClick={handleSelectionToggle}>
                          {isSelectionMode ? "Cancel" : "Select"}
                      </Button>
                      {hasSelection && (
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button>Schedule</Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                  <DropdownMenuItem onSelect={() => openScheduleModal('class')}>
                                      <PlusCircle className="mr-2 h-4 w-4" /> New Class
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => openScheduleModal('quiz')}>
                                      <FilePenLine className="mr-2 h-4 w-4" /> New Quiz
                                  </DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
                      )}
                  </>
                )}
              </div>
            </div>
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

              <TabsContent value={activeDay} className="mt-6">
                {filteredRoomsForDay.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredRoomsForDay
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
                                {(times as string[]).map((time, index) => (
                                  user.role === 'staff' && isSelectionMode ? (
                                      <div key={index} className="flex items-center space-x-2 rounded-md border p-2">
                                          <Checkbox 
                                              id={`${room}-${time}`} 
                                              onCheckedChange={(checked) => handleSlotSelection(room, time, !!checked)}
                                              checked={selectedSlots.get(room)?.has(time) || false}
                                          />
                                          <label htmlFor={`${room}-${time}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer">
                                              {time}
                                          </label>
                                      </div>
                                  ) : (
                                      <Badge key={index} variant="secondary" className="block text-center w-full justify-center text-sm font-normal py-1">
                                        {time}
                                      </Badge>
                                  )
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
                    <p className="text-sm">
                      {roomSearchTerm 
                        ? `No rooms matching "${roomSearchTerm}" are free on ${activeDay}.`
                        : `All classrooms appear to be occupied on ${activeDay}.`
                      }
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Schedule New {scheduleType}</DialogTitle>
                <DialogDescription>
                    Fill in the details for your new event in <strong>{selectedRoom}</strong> on <strong>{scheduleDay}</strong>.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="scheduleDay">Day</Label>
                    <Select value={scheduleDay} onValueChange={setScheduleDay}>
                        <SelectTrigger id="scheduleDay">
                            <SelectValue placeholder="Select a day" />
                        </SelectTrigger>
                        <SelectContent>
                            {daysOfWeek.map(day => (
                                <SelectItem key={day} value={day}>{day}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="courseCode">Course</Label>
                    <Input 
                      id="courseCode" 
                      value={courseCode} 
                      onChange={(e) => setCourseCode(e.target.value)} 
                      placeholder="e.g., CE 151"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsScheduleModalOpen(false)}>Cancel</Button>
                <Button onClick={handleScheduleSubmit}>Confirm Schedule</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
