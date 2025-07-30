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
import { useUser, type Faculty } from '@/app/providers/user-provider';
import { useState, useEffect } from 'react';

interface FacultyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  faculty?: Faculty; // If provided, it's an edit
}

export function FacultyDialog({ isOpen, onClose, faculty }: FacultyDialogProps) {
  const { addFaculty, updateFaculty, toast } = useUser();
  const [name, setName] = useState('');

  useEffect(() => {
    if (faculty) {
      setName(faculty.name);
    } else {
      setName('');
    }
  }, [faculty, isOpen]);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Faculty name is required.',
        variant: 'destructive',
      });
      return;
    }

    if (faculty) {
      // Edit mode
      updateFaculty(faculty.name, name);
    } else {
      // Add mode
      addFaculty(name);
    }
    onClose();
  };

  const title = faculty ? 'Edit Faculty' : 'Add New Faculty';
  const description = faculty ? `Editing the name for the ${faculty.name}.` : 'Create a new faculty to organize departments.';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="faculty-name" className="text-right">
              Name
            </Label>
            <Input
              id="faculty-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Faculty of Engineering"
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
