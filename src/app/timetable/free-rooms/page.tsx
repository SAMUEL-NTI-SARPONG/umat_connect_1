
'use client';

import { useState, useMemo } from 'react';
import { useUser, type TimetableEntry, type EmptySlot } from '@/app/providers/user-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { timeToMinutes } from '@/lib/time';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2 } from 'lucide-react';

function findEmptyClassroomsFromSchedule(schedule: TimetableEntry[] | null): EmptySlot[] {
    if (!schedule) return [];

    const allRooms = new Set<string>();
    schedule.forEach(entry => allRooms.add(entry.room));

    const parseTimeRange = (timeStr: string): { startMinutes: number; endMinutes: number } => {
        if (!timeStr || typeof timeStr !== 'string') return { startMinutes: -1, endMinutes: -1 };
        
        const cleanTime = timeStr.trim().toUpperCase();
        const parts = cleanTime.split(/\s*-\s*/);
        const startTimeStr = parts[0];
        const endTimeStr = parts.length > 1 ? parts[1] : null;

        const startMinutes = timeToMinutes(startTimeStr);
        let endMinutes;

        if (endTimeStr) {
            endMinutes = timeToMinutes(endTimeStr);
        } else {
            endMinutes = startMinutes !== -1 ? startMinutes + 60 : -1;
        }

        return { startMinutes, endMinutes };
    };

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const timeSlots = [
        '7:00 AM - 8:00 AM', 
        '8:00 AM - 9:00 AM', 
        '9:00 AM - 10:00 AM', 
        '10:00 AM - 11:00 AM', 
        '11:00 AM - 12:00 PM', 
        '12:00 PM - 1:00 PM', 
        '1:30 PM - 2:30 PM', 
        '2:30 PM - 3:30 PM', 
        '3:30 PM - 4:30 PM', 
        '4:30 PM - 5:30 PM', 
        '5:30 PM - 6:30 PM', 
        '6:30 PM - 7:30 PM'
    ];

    const finalEmptySlots: EmptySlot[] = [];

    days.forEach(day => {
        Array.from(allRooms).forEach(room => {
            timeSlots.forEach(timeSlot => {
                const { startMinutes: slotStartMinutes, endMinutes: slotEndMinutes } = parseTimeRange(timeSlot);

                if (slotStartMinutes === -1 || slotEndMinutes === -1) return;

                const isOccupied = schedule.some(entry => {
                    if (entry.day !== day || entry.room !== room) return false;
                    
                    const { startMinutes: entryStartMinutes, endMinutes: entryEndMinutes } = parseTimeRange(entry.time);
                    if (entryStartMinutes === -1 || entryEndMinutes === -1) return false;

                    return Math.max(entryStartMinutes, slotStartMinutes) < Math.min(entryEndMinutes, slotEndMinutes);
                });

                if (!isOccupied) {
                    finalEmptySlots.push({ day, location: room, time: timeSlot });
                }
            });
        });
    });

    return finalEmptySlots;
}


export default function FindFreeRoomsPage() {
    const { masterSchedule, staffSchedules, isClassTimetableDistributed, user } = useUser();
    const [activeDay, setActiveDay] = useState<string>(() => {
        const todayIndex = new Date().getDay();
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return days[todayIndex] || 'Monday';
    });
    
    const combinedSchedule = useMemo(() => {
        if (!isClassTimetableDistributed) return [];
        return [...(masterSchedule || []), ...staffSchedules];
    }, [masterSchedule, staffSchedules, isClassTimetableDistributed]);

    const emptySlots = useMemo(() => {
        return findEmptyClassroomsFromSchedule(combinedSchedule);
    }, [combinedSchedule]);

    const groupedSlots = useMemo(() => {
        return emptySlots.reduce((acc, slot) => {
            if (!acc[slot.day]) {
                acc[slot.day] = {};
            }
            if (!acc[slot.day][slot.location]) {
                acc[slot.day][slot.location] = [];
            }
            acc[slot.day][slot.location].push(slot.time);
            return acc;
        }, {} as Record<string, Record<string, string[]>>);
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
                <p className="text-muted-foreground">The class timetable has not been published yet. Please check back later.</p>
            </div>
        );
    }
    
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    return (
        <div className="max-w-7xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Find Free Classrooms</CardTitle>
                    <CardDescription>Select a day to see which classrooms are available and when.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue={activeDay} onValueChange={setActiveDay} className="w-full">
                        <TabsList className="grid w-full grid-cols-7">
                            {daysOfWeek.map(day => (
                                <TabsTrigger key={day} value={day} className="text-xs sm:text-sm">{day.substring(0,3)}</TabsTrigger>
                            ))}
                        </TabsList>

                        {daysOfWeek.map(day => (
                            <TabsContent key={day} value={day} className="mt-6">
                                {groupedSlots[day] ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {Object.entries(groupedSlots[day]).sort(([a], [b]) => a.localeCompare(b)).map(([room, times]) => (
                                            <Card key={room}>
                                                <CardHeader className="p-4">
                                                    <CardTitle className="text-base flex items-center gap-2">
                                                        <Building2 className="w-5 h-5 text-primary" />
                                                        {room}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-4 pt-0">
                                                    <ScrollArea className="h-48">
                                                        <div className="space-y-1 pr-4">
                                                            {times.map(time => (
                                                                <p key={time} className="text-sm text-muted-foreground">{time}</p>
                                                            ))}
                                                        </div>
                                                    </ScrollArea>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-muted-foreground py-12">
                                        <p>No free rooms found for {day}.</p>
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
