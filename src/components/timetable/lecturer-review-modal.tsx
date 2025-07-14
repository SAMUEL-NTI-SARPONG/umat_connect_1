
'use client';

import React, { useState } from 'react';
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
import { Trash2 } from 'lucide-react';

interface LecturerReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: TimetableEntry[];
}

export default function LecturerReviewModal({
  isOpen,
  onClose,
  courses: initialCourses,
}: LecturerReviewModalProps) {
  const { user, removeScheduleEntry, markScheduleAsReviewed } = useUser();
  const [courses, setCourses] = useState(initialCourses);

  const handleRemoveCourse = (courseId: number) => {
    removeScheduleEntry(courseId);
    setCourses(courses.filter(c => c.id !== courseId));
  };

  const handleConfirm = () => {
    if (user) {
      markScheduleAsReviewed(user.id);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirm Your Semester Courses</DialogTitle>
          <DialogDescription>
            A new timetable has been uploaded. Please review the courses assigned to you below.
            Remove any that are incorrect. This action cannot be undone for this timetable version.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] my-4 pr-6 border-b border-t">
          <div className="space-y-3 py-4">
            {courses.map(course => (
              <div key={course.id} className="flex items-center justify-between p-3 rounded-md border bg-muted/50">
                <div>
                  <p className="font-semibold">{course.courseCode}</p>
                  <p className="text-sm text-muted-foreground">{course.departments.join(', ')} - Level {course.level}</p>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRemoveCourse(course.id)}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="sr-only">Remove course</span>
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={handleConfirm} className="w-full">
            Confirm My Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
