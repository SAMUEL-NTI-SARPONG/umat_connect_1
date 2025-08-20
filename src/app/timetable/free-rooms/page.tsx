
'use client';

import { useState, useMemo } from 'react';
import { useUser, type TimetableEntry, type EmptySlot } from '@/app/providers/user-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { minutesToTime, timeToMinutes } from '@/lib/time';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, PlusCircle, CalendarPlus, FilePenLine } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelectCombobox } from '@/components/ui/combobox';


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
    allDepartments,
    addStaffSchedule, 
  } = useUser();
  
  const [activeDay, setActiveDay] = useState<string>(() => {
    const todayIndex = new Date().getDay();
    return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][todayIndex] || 'Monday';
  });

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<Map<string, Set<string>>>(new Map());
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleType, setScheduleType] = useState<'class' | 'quiz' | null>(null);
  const [formData, setFormData] = useState({
    courseCode: '',
    level: 100,
    departments: [] as string[],
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

      if (!acc[day]) acc[day] = {};
      if (!acc[day][room]) acc[day][room] = [];

      acc[day][room].push(slot.time);
      return acc;
    }, {} as Record<string, Record<string, string[]>>);

    for (const day in grouped) {
        const sortedRooms = Object.keys(grouped[day]).sort((a, b) => a.localeCompare(b));
        const newDayData: Record<string, string[]> = {};
        for (const room of sortedRooms) {
            newDayData[room] = grouped[day][room].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
        }
        grouped[day] = newDayData;
    }

    return grouped;
  }, [emptySlots]);

  const handleSelectionToggle = () => {
    setIsSelectionMode(prev => !prev);
    setSelectedSlots(new Map());
  };

  const handleSlotSelection = (room: string, time: string, isChecked: boolean) => {
    setSelectedSlots(prev => {
        const newMap = new Map(prev);
        if (isChecked) {
            // Can only select slots from one room at a time
            if (newMap.size > 0 && !newMap.has(room)) {
                alert("You can only select time slots from one room at a time.");
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
  
  const handleFormChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const handleScheduleSubmit = () => {
    if (!selectedRoom || !scheduleType) return;
    const times = Array.from(selectedSlots.get(selectedRoom)!).sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
    const startTimeStr = times[0].split(' - ')[0];
    const endTimeStr = times[times.length - 1].split(' - ')[1];
    
    addStaffSchedule({
        day: activeDay,
        time: `${startTimeStr} - ${endTimeStr}`,
        room: selectedRoom,
        departments: formData.departments,
        level: formData.level,
        courseCode: formData.courseCode,
        status: scheduleType === 'quiz' ? 'quiz' : 'confirmed',
    });
    
    // Reset state
    setIsScheduleModalOpen(false);
    setScheduleType(null);
    setIsSelectionMode(false);
    setSelectedSlots(new Map());
    setFormData({ courseCode: '', level: 100, departments: [] });
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
  
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const departmentOptions = allDepartments.map(d => ({ value: d, label: d }));

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2"><Building2 /> Find Free Classrooms</CardTitle>
                <CardDescription>
                  {isSelectionMode ? "Select available time slots to schedule an event." : "Select a day to see which classrooms are available and when."}
                </CardDescription>
              </div>
              {user.role === 'staff' && (
                <div className="flex items-center gap-2">
                    <Button variant={isSelectionMode ? "destructive" : "outline"} onClick={handleSelectionToggle}>
                        {isSelectionMode ? "Cancel Selection" : "Select Times"}
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
                </div>
              )}
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
                                    isSelectionMode ? (
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
                      <p className="text-sm">All classrooms appear to be occupied on {day}.</p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Schedule New {scheduleType}</DialogTitle>
                <DialogDescription>
                    Fill in the details for your new event in <strong>{selectedRoom}</strong> on <strong>{activeDay}</strong>.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="courseCode">Course</Label>
                    <Input id="courseCode" value={formData.courseCode} onChange={(e) => handleFormChange('courseCode', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="level">Level</Label>
                    <Select value={String(formData.level)} onValueChange={(value) => handleFormChange('level', Number(value))}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="100">100</SelectItem>
                            <SelectItem value="200">200</SelectItem>
                            <SelectItem value="300">300</SelectItem>
                            <SelectItem value="400">400</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="departments">Departments</Label>
                    <MultiSelectCombobox
                        options={departmentOptions}
                        selected={formData.departments}
                        onChange={(selected) => handleFormChange('departments', selected)}
                        placeholder="Select departments..."
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
