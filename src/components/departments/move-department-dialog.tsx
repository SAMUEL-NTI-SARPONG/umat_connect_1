'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useUser, type Department } from '@/app/providers/user-provider';
import { useState } from 'react';

interface MoveDepartmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  department: Department;
  currentFacultyName: string;
}

export function MoveDepartmentDialog({
  isOpen,
  onClose,
  department,
  currentFacultyName,
}: MoveDepartmentDialogProps) {
  const { faculties, moveDepartment, toast } = useUser();
  const [targetFaculty, setTargetFaculty] = useState('');

  const availableFaculties = faculties.filter((f) => f.name !== currentFacultyName);

  const handleMove = () => {
    if (!targetFaculty) {
      toast({
        title: 'No Selection',
        description: 'Please select a destination faculty.',
        variant: 'destructive',
      });
      return;
    }
    moveDepartment({ departmentName: department.name, newFacultyName: targetFaculty });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move Department</DialogTitle>
          <DialogDescription>
            Move <strong>{department.name}</strong> from{' '}
            <strong>{currentFacultyName}</strong> to another faculty.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="faculty-select" className="text-right">
              Move to
            </Label>
            <Select onValueChange={setTargetFaculty} value={targetFaculty}>
              <SelectTrigger id="faculty-select" className="col-span-3">
                <SelectValue placeholder="Select new faculty..." />
              </SelectTrigger>
              <SelectContent>
                {availableFaculties.map((f) => (
                  <SelectItem key={f.name} value={f.name}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={!targetFaculty}>
            Confirm Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
