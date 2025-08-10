
'use client';

import { useEffect, useMemo } from 'react';
import { useUser, type TimetableEntry, isLecturerMatchWithUsers } from '@/app/providers/user-provider';
import { timeToMinutes } from '@/lib/time';

const ALARM_LEAD_TIME_MINUTES = 30;
// A free, public domain alarm sound
const ALARM_SOUND_URL = 'https://www.soundjay.com/buttons/beep-07.mp3';

export function useAlarm() {
  const { user, masterSchedule, staffSchedules, isClassTimetableDistributed, playAlarm, stopAlarm } = useUser();

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
    const dayMap: { [key: string]: number } = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

    const timeouts = userSchedule.map(event => {
      const now = new Date();
      const currentDay = now.getDay();
      const eventDayIndex = dayMap[event.day];

      if (eventDayIndex === undefined) return null;

      const eventTimeMinutes = timeToMinutes(event.time);
      const eventHour = Math.floor(eventTimeMinutes / 60);
      const eventMinute = eventTimeMinutes % 60;
      
      // Calculate the next occurrence of the event's day
      let daysUntilEvent = eventDayIndex - currentDay;
      if (daysUntilEvent < 0) {
        daysUntilEvent += 7; // It's next week
      }
      
      const eventDate = new Date();
      eventDate.setDate(now.getDate() + daysUntilEvent);
      eventDate.setHours(eventHour, eventMinute, 0, 0);

      // If the calculated event time is in the past for today, schedule it for next week instead
      if (daysUntilEvent === 0 && eventDate.getTime() < now.getTime()) {
        eventDate.setDate(eventDate.getDate() + 7);
      }
      
      const alarmTime = new Date(eventDate.getTime() - ALARM_LEAD_TIME_MINUTES * 60 * 1000);

      if (alarmTime > now) {
        const timeoutMs = alarmTime.getTime() - now.getTime();
        
        const timeoutId = setTimeout(() => {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              playAlarm(ALARM_SOUND_URL);

              const notification = new Notification('Upcoming Class', {
                body: `${event.courseCode} is starting in 30 minutes at ${event.room}.`,
                icon: '/icons/icon-192x192.png',
              });

              notification.onclick = () => {
                stopAlarm();
                notification.close();
              };
              
              notification.onclose = () => {
                stopAlarm();
              };
            }
          });
        }, timeoutMs);

        return timeoutId;
      }
      return null;
    });

    return () => {
      timeouts.forEach(timeoutId => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      });
      stopAlarm(); // Stop any active alarm on component unmount/re-render
    };
  }, [userSchedule, playAlarm, stopAlarm]);
}
