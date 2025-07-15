
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUser, type TimetableEntry } from '@/app/providers/user-provider';
import { ScrollArea } from '../ui/scroll-area';
import { EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LecturerReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: TimetableEntry[];
}

export default function LecturerReviewModal({
  isOpen,
  onClose,
  courses,
}: LecturerReviewModalProps) {
  const { user, rejectScheduleEntry } = useUser();
  const [hiddenCourses, setHiddenCourses] = React.useState<number[]>([]);

  const handleHideCourse = (courseId: number) => {
    if (!user) return;
    rejectScheduleEntry(user.id, courseId);
    setHiddenCourses(prev => [...prev, courseId]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Confirm Your Semester Courses</DialogTitle>
          <DialogDescription>
            A new timetable has been uploaded. Please review the courses assigned to you.
            You can hide any that are incorrect. This can be changed later.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] my-4 pr-6">
          <div className="space-y-3 py-4">
            {courses.map(course => {
              const isHidden = hiddenCourses.includes(course.id);
              return (
                <div 
                  key={course.id} 
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border bg-card transition-opacity",
                    isHidden && "opacity-50"
                  )}
                >
                  <div>
                    <p className="font-semibold">{course.courseCode}</p>
                    <p className="text-sm text-muted-foreground">{course.departments.join(', ')} - Level {course.level}</p>
                  </div>
                  {!isHidden && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleHideCourse(course.id)}
                    >
                      <EyeOff className="w-4 h-4 mr-2" />
                      Hide
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Confirm My Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
