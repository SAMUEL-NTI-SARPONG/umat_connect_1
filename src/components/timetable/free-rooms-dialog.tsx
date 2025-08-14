
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
import { Loader2, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// This is the full, self-contained logic to find empty classrooms.
// It will run on the client-side when the dialog is opened.
function findEmptyClassrooms(fileBuffer: Buffer | null) {
    if (!fileBuffer) return [];

    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    const allRooms = new Set<string>();
    const occupiedSlots: Record<string, Set<string>> = {};

    const timeSlots = [
        '7:00-8:00 AM', '8:00-9:00 AM', '9:00-10:00 AM', '10:00-11:00 AM', '11:00-12:00 PM',
        '12:00-1:00 PM', '1:30-2:30 PM', '2:30-3:30 PM', '3:30-4:30 PM', '4:30-5:30 PM', '5:30-6:30 PM', '6:30-7:30 PM'
    ];
    
    for (const sheetName of workbook.SheetNames) {
        const day = days.find(d => d.toUpperCase() === sheetName.toUpperCase());
        if (!day) continue;

        const sheet = workbook.Sheets[sheetName];
        if (!sheet) continue;

        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' }) as (string | number)[][];
        const merges = sheet['!merges'] || [];
        
        for (let i = 5; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || !row[0] || !String(row[0]).trim()) continue;

            const roomName = String(row[0]).trim();
            allRooms.add(roomName);

            if (!occupiedSlots[roomName]) {
                occupiedSlots[roomName] = new Set();
            }

            for (let j = 1; j < 14; j++) { // There are 13 columns for time slots + break
                const cellValue = String(row[j] || '').trim();
                if (!cellValue) continue;

                const isBreakColumn = j === 7;
                if (isBreakColumn) continue;

                const timeSlotIndex = j - 1 - (j > 7 ? 1 : 0);
                
                // Find if this cell is the start of a merge
                let mergeInfo = merges.find(m => m.s.r === i && m.s.c === j);

                if (mergeInfo) {
                    const mergeSpan = mergeInfo.e.c - mergeInfo.s.c + 1;
                    for (let k = 0; k < mergeSpan; k++) {
                        const currentCellIndex = j + k;
                        // Check if the current merged cell is the break column and skip if so
                        if (currentCellIndex !== 7 && timeSlots[timeSlotIndex + k]) {
                           occupiedSlots[roomName].add(`${day}__${timeSlots[timeSlotIndex + k]}`);
                        }
                    }
                } else {
                     // Check if this cell is *within* a merge started by a previous cell
                    let isPartOfMerge = merges.some(m => m.s.r === i && j > m.s.c && j <= m.e.c);
                    
                    // If it's a single, unmerged, occupied cell
                    if (!isPartOfMerge) {
                        occupiedSlots[roomName].add(`${day}__${timeSlots[timeSlotIndex]}`);
                    }
                }
            }
        }
    }

    const emptySlots: { day: string, location: string, time: string }[] = [];
    allRooms.forEach(room => {
        days.forEach(day => {
            timeSlots.forEach(time => {
                if (!occupiedSlots[room]?.has(`${day}__${time}`)) {
                    emptySlots.push({ day, location: room, time });
                }
            });
        });
    });

    return emptySlots;
}


// Helper functions for consolidating time ranges
function timeRangeToMinutes(timeRange: string): { start: number; end: number } {
  try {
    const [startTimeStr, endTimeStr] = timeRange.split('-');
    if (!startTimeStr || !endTimeStr) return { start: 0, end: 0 };

    const parseTime = (time: string) => {
      const trimmedTime = time.trim();
      const [hourMinute, modifier] = trimmedTime.split(' ');
      const [hoursStr, minutesStr] = hourMinute.split(':');
      let hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10) || 0;
      
      if (modifier && modifier.toUpperCase() === 'PM' && hours < 12) {
        hours += 12;
      }
      if (modifier && modifier.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }
      return hours * 60 + minutes;
    };
    
    return {
      start: parseTime(startTimeStr),
      end: parseTime(endTimeStr)
    };
  } catch (error) {
    console.error('Error parsing time range:', timeRange, error);
    return { start: 0, end: 0 };
  }
}

function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  return `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
}

export default function FreeRoomsDialog() {
  const { rawTimetableFile } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emptySlots, setEmptySlots] = useState<{ day: string, location: string, time: string }[]>([]);
  const [activeDay, setActiveDay] = useState(() => {
    const today = new Date().getDay();
    return days[today === 0 ? 6 : today - 1] || 'Monday';
  });
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if(open && rawTimetableFile && emptySlots.length === 0) {
        setIsLoading(true);
        // Using setTimeout to allow the dialog to render before heavy computation
        setTimeout(() => {
            try {
                const fileBuffer = Buffer.from(rawTimetableFile, 'base64');
                const slots = findEmptyClassrooms(fileBuffer);
                setEmptySlots(slots);
            } catch (e) {
                console.error("Error processing timetable file:", e);
            } finally {
                setIsLoading(false);
            }
        }, 50);
    }
  }

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
        .map(timeRange => timeRangeToMinutes(timeRange))
        .filter(range => range.start !== 0 || range.end !== 0)
        .sort((a, b) => a.start - b.start);
      
      if (timeRanges.length === 0) return null;
      
      const consolidatedRanges: string[] = [];
      let currentStart = timeRanges[0].start;
      let currentEnd = timeRanges[0].end;
  
      for (let i = 1; i < timeRanges.length; i++) {
        const range = timeRanges[i];
        if (range.start === currentEnd) {
          currentEnd = range.end;
        } else {
          consolidatedRanges.push(`${minutesToTimeString(currentStart)} - ${minutesToTimeString(currentEnd)}`);
          currentStart = range.start;
          currentEnd = range.end;
        }
      }
      consolidatedRanges.push(`${minutesToTimeString(currentStart)} - ${minutesToTimeString(currentEnd)}`);
      
      return { room, freeRanges: consolidatedRanges };
    }).filter(Boolean) as { room: string; freeRanges: string[] }[];
    
    return consolidatedRooms.sort((a, b) => a.room.localeCompare(b.room));
  }, [emptySlots, activeDay]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
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
              {isLoading ? (
                  <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
              ) : !rawTimetableFile ? (
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
