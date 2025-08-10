
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
      const eventDayIndex = dayMap[event.day];
      if (eventDayIndex === undefined) return null;

      const eventTimeMinutes = timeToMinutes(event.time);
      const eventHour = Math.floor(eventTimeMinutes / 60);
      const eventMinute = eventTimeMinutes % 60;

      const eventDate = new Date();
      eventDate.setDate(now.getDate() - now.getDay() + eventDayIndex);
      eventDate.setHours(eventHour, eventMinute, 0, 0);
      
      const alarmTime = new Date(eventDate.getTime() - ALARM_LEAD_TIME_MINUTES * 60 * 1000);

      if (alarmTime > now) {
        const timeoutMs = alarmTime.getTime() - now.getTime();
        
        const timeoutId = setTimeout(() => {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              const sound = playAlarm(ALARM_SOUND_URL);

              const notification = new Notification('Upcoming Class', {
                body: `${event.courseCode} is starting in 30 minutes at ${event.room}.`,
                icon: '/icons/icon-192x192.png',
                actions: [{ action: 'stop_alarm', title: 'Stop Alarm' }]
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
    };
  }, [userSchedule, playAlarm, stopAlarm]);
}
