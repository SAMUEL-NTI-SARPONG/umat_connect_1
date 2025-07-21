
'use client';

import { useUser } from '@/app/providers/user-provider';
import { SidebarContent, SidebarHeader } from '../ui/sidebar';
import { CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { useMemo } from 'react';
import { ProfileAvatar } from '../ui/profile-avatar';
import { ScrollArea } from '../ui/scroll-area';

export default function AdminStats() {
    const { allUsers, reviewedSchedules, masterSchedule } = useUser();

    const staffMembers = useMemo(() => allUsers.filter(u => u.role === 'staff'), [allUsers]);
    const reviewedCount = reviewedSchedules.length;
    const totalStaff = staffMembers.length;
    const progressPercentage = totalStaff > 0 ? (reviewedCount / totalStaff) * 100 : 0;
    
    const reviewedStaff = useMemo(() => {
        return staffMembers.filter(l => reviewedSchedules.includes(l.id));
    }, [staffMembers, reviewedSchedules]);

    const unreviewedStaff = useMemo(() => {
        return staffMembers.filter(l => !reviewedSchedules.includes(l.id));
    }, [staffMembers, reviewedSchedules]);

    if (!masterSchedule) {
        return (
             <div className="hidden md:flex flex-col h-full">
                <SidebarHeader>
                    <CardTitle className="text-lg font-semibold">Admin Dashboard</CardTitle>
                </SidebarHeader>
                <SidebarContent className="p-4 flex items-center justify-center">
                    <p className="text-sm text-center text-muted-foreground">No timetable has been uploaded yet.</p>
                </SidebarContent>
             </div>
        )
    }

    return (
        <div className="hidden md:flex flex-col h-full">
            <SidebarHeader>
                <CardTitle className="text-lg font-semibold">Review Progress</CardTitle>
            </SidebarHeader>
            <SidebarContent className="p-4 space-y-4">
                <div>
                    <div className="flex justify-between items-center mb-1 text-sm">
                        <span className="font-medium">Confirmation Status</span>
                        <span className="text-muted-foreground">{reviewedCount} / {totalStaff}</span>
                    </div>
                    <Progress value={progressPercentage} />
                </div>
                
                <ScrollArea className="flex-grow h-0">
                    <div className='pr-4'>
                        {unreviewedStaff.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold mb-2">Pending Review</h3>
                                <div className="space-y-2">
                                    {unreviewedStaff.map(staff => (
                                        <div key={staff.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                                            <ProfileAvatar src={staff.profileImage} fallback={staff.name.charAt(0)} className="w-8 h-8"/>
                                            <span className="text-sm">{staff.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {reviewedStaff.length > 0 && (
                            <div className="mt-4">
                                <h3 className="text-sm font-semibold mb-2">Confirmed</h3>
                                 <div className="space-y-2">
                                    {reviewedStaff.map(staff => (
                                        <div key={staff.id} className="flex items-center gap-2 p-2 rounded-md border">
                                            <ProfileAvatar src={staff.profileImage} fallback={staff.name.charAt(0)} className="w-8 h-8"/>
                                            <span className="text-sm">{staff.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </SidebarContent>
        </div>
    )
}
