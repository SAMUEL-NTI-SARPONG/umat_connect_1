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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser, type Department } from '@/app/providers/user-provider';
import { useState, useEffect } from 'react';

interface DepartmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  department?: Department; // If provided, it's an edit
  facultyName: string;
}

export function DepartmentDialog({ isOpen, onClose, department, facultyName }: DepartmentDialogProps) {
  const { addDepartment, updateDepartment, toast } = useUser();
  const [name, setName] = useState('');
  const [initial, setInitial] = useState('');

  useEffect(() => {
    if (department) {
      setName(department.name);
      setInitial(department.initial);
    } else {
      setName('');
      setInitial('');
    }
  }, [department, isOpen]);

  const handleSubmit = () => {
    if (!name.trim() || !initial.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Department name and initial are required.',
        variant: 'destructive',
      });
      return;
    }

    if (department) {
      // Edit mode
      updateDepartment({
        oldName: department.name,
        newName: name,
        newInitial: initial.toUpperCase(),
      });
    } else {
      // Add mode
      addDepartment({ name, initial: initial.toUpperCase(), facultyName });
    }
    onClose();
  };

  const title = department ? 'Edit Department' : 'Add New Department';
  const description = department
    ? `Editing the details for the ${department.name} department.`
    : `Adding a new department to the ${facultyName} faculty.`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dept-name" className="text-right">
              Name
            </Label>
            <Input
              id="dept-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Computer Science And Engineering"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dept-initial" className="text-right">
              Initial
            </Label>
            <Input
              id="dept-initial"
              value={initial}
              onChange={(e) => setInitial(e.target.value)}
              className="col-span-3"
              placeholder="e.g., CE"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
