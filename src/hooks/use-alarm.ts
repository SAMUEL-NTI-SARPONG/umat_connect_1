
'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { useUser, type TimetableEntry, isLecturerMatchWithUsers } from '@/app/providers/user-provider';
import { timeToMinutes } from '@/lib/time';
import { useSearchParams, useRouter } from 'next/navigation';

const ALARM_LEAD_TIME_MINUTES = 30;
const ALARM_SOUND_SRC = '/sounds/alarm.mp3';

export function useAlarm() {
  const { user, masterSchedule, staffSchedules, isClassTimetableDistributed, playAlarm, stopAlarm, toast } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleTriggeredAlarm = useCallback((alarmId: string) => {
      stopAlarm(); // Stop any previous alarm
      playAlarm(ALARM_SOUND_SRC);
      
      toast({
          title: 'Class Reminder!',
          description: 'Your class is starting soon. Click anywhere to dismiss this alarm.',
          variant: 'default',
          duration: Infinity, // Keep toast visible until manually dismissed
      });

      // Remove the alarm_id from the URL
      const newUrl = window.location.pathname;
      router.replace(newUrl, { scroll: false });
  }, [playAlarm, stopAlarm, toast, router]);

  useEffect(() => {
    const alarmId = searchParams.get('alarm_id');
    if (alarmId) {
      handleTriggeredAlarm(alarmId);
    }
  }, [searchParams, handleTriggeredAlarm]);


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
    const scheduleAlarms = async () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        // Clear all previously scheduled notifications to avoid duplicates
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

          // If the event is today but the time has passed, schedule it for next week
          if (daysUntilEvent === 0 && eventDate.getTime() < now.getTime()) {
            eventDate.setDate(eventDate.getDate() + 7);
          }
          
          const alarmTime = new Date(eventDate.getTime() - ALARM_LEAD_TIME_MINUTES * 60 * 1000);

          if (alarmTime > now) {
              navigator.serviceWorker.controller?.postMessage({
                  type: 'SCHEDULE_NOTIFICATION',
                  payload: {
                      title: 'Upcoming Class Reminder',
                      options: {
                          body: `${event.courseCode} is starting in ${ALARM_LEAD_TIME_MINUTES} minutes at ${event.room}.`,
                          icon: '/icons/icon-192x192.png',
                          tag: `class-alarm-${event.id}-${alarmTime.getTime()}`,
                          timestamp: alarmTime.getTime(),
                          data: {
                              url: '/',
                          }
                      }
                  }
              });
          }
        });
      }
    }

    // Wait for the service worker to be ready
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(() => {
            scheduleAlarms();
        });
    }

  }, [userSchedule]);
}
