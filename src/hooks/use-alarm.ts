
'use client';

import { useEffect, useMemo } from 'react';
import { useUser, type TimetableEntry, isLecturerMatchWithUsers } from '@/app/providers/user-provider';
import { timeToMinutes } from '@/lib/time';

const ALARM_LEAD_TIME_MINUTES = 30;

export function useAlarm() {
  const { user, masterSchedule, staffSchedules, isClassTimetableDistributed } = useUser();

  const userSchedule = useMemo(() => {
    if (!isClassTimetableDistributed || !user) return [];
    
    const combinedSchedule = [...(masterSchedule || []), ...staffSchedules];

    if (user.role === 'student') {
      return combinedSchedule.filter(entry =>
        entry.level === user.level &&
        user.department &&
        (entry.departments || []).includes(user.department)
      );
    }
    if (user.role === 'staff') {
      return combinedSchedule.filter(entry => 
        isLecturerMatchWithUsers(entry.lecturer, user)
      );
    }
    return [];
  }, [user, masterSchedule, staffSchedules, isClassTimetableDistributed]);

  useEffect(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Clear existing notifications
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_NOTIFICATIONS' });
      
      const dayMap: { [key: string]: number } = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

      userSchedule.forEach(event => {
        const now = new Date();
        const currentDay = now.getDay();
        const eventDayIndex = dayMap[event.day];

        if (eventDayIndex === undefined) return;

        const eventTimeMinutes = timeToMinutes(event.time);
        if (isNaN(eventTimeMinutes)) return;

        const eventHour = Math.floor(eventTimeMinutes / 60);
        const eventMinute = eventTimeMinutes % 60;
        
        let daysUntilEvent = eventDayIndex - currentDay;
        if (daysUntilEvent < 0) {
          daysUntilEvent += 7;
        }
        
        const eventDate = new Date();
        eventDate.setDate(now.getDate() + daysUntilEvent);
        eventDate.setHours(eventHour, eventMinute, 0, 0);

        if (daysUntilEvent === 0 && eventDate.getTime() < now.getTime()) {
          eventDate.setDate(eventDate.getDate() + 7);
        }
        
        const alarmTime = new Date(eventDate.getTime() - ALARM_LEAD_TIME_MINUTES * 60 * 1000);

        if (alarmTime > now) {
            navigator.serviceWorker.controller?.postMessage({
                type: 'SCHEDULE_NOTIFICATION',
                payload: {
                    title: 'Upcoming Class',
                    options: {
                        body: `${event.courseCode} is starting in ${ALARM_LEAD_TIME_MINUTES} minutes at ${event.room}.`,
                        icon: '/icons/icon-192x192.png',
                        tag: `class-alarm-${event.id}-${alarmTime.getTime()}`,
                        timestamp: alarmTime.getTime(),
                        data: {
                            url: '/', // Open the app's home page on click
                        }
                    }
                }
            });
        }
      });
    }
  }, [userSchedule]);

  // No need for return cleanup as Service Worker handles it
}
