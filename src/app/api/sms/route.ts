
'use client'; // This directive is not strictly necessary but clarifies context

import { NextRequest, NextResponse } from 'next/server';

// Mocked in-memory data access. In a real application, this would be a database.
// The state is managed on the client with UserProvider and localStorage.
// This serverless function can't directly access that state.
// So, we will rely on default or mocked data for this simulation.
import { users, timetable as defaultTimetableData } from '@/lib/data';
import type { TimetableEntry, User } from '@/app/providers/user-provider';

// NOTE: This is a simplified simulation. The serverless function
// does not have access to the client's localStorage. State changes made
// by the user in the UI won't be reflected here. This handler will
// process logic based on the initial default data.

const findUserByPhone = (phone: string, allUsers: User[]): User | undefined => {
  return allUsers.find(u => u.phone === phone);
};

const getScheduleForUser = (user: User, schedule: TimetableEntry[]) => {
    if (user.role === 'student') {
        return schedule.filter(entry => 
            entry.level === user.level && 
            entry.departments.includes(user.department)
        );
    }
    if (user.role === 'lecturer') {
        const lecturerNameParts = user.name.toLowerCase().split(' ').filter(p => p.length > 2);
        return schedule.filter(entry => 
            lecturerNameParts.some(part => entry.lecturer.toLowerCase().includes(part))
        );
    }
    return []; // Admins don't have a personal schedule
};

const formatEventForSms = (event: TimetableEntry) => {
    return `${event.time}: ${event.courseCode} at ${event.room} (${event.status})`;
};

const normalizeCourseCode = (code: string) => {
    return code.replace(/[^A-Z0-9]/gi, '').toLowerCase();
};

export async function POST(req: NextRequest) {
  // Since we can't access client-side localStorage, we use the default static data.
  const allUsers = defaultUsers;
  // This simulation won't have the uploaded timetable. It will be empty.
  const combinedSchedule: TimetableEntry[] = []; 

  try {
    const formData = await req.formData();
    const from = formData.get('From') as string;
    const message = (formData.get('Body') as string)?.trim() ?? '';

    if (!from || !message) {
      return new NextResponse('<Response><Message>Missing "From" or "Body" in request</Message></Response>', { status: 400, headers: { 'Content-Type': 'text/xml' }});
    }

    const user = findUserByPhone(from, allUsers);

    if (!user) {
      const response = "Sorry, your phone number is not registered in UMaT Connect. Please log in to the app to register.";
      return new NextResponse(`<Response><Message>${response}</Message></Response>`, { headers: { 'Content-Type': 'text/xml' }});
    }

    const messageLower = message.toLowerCase();

    // --- Lecturer Status Update Logic (Simulated) ---
    if (user.role === 'lecturer' && messageLower.match(/(confirm|cancel)$/)) {
        const response = `Lecturer features like status updates are not fully supported in this simulation. Please use the main Timetable interface.`;
        return new NextResponse(`<Response><Message>${response}</Message></Response>`, { headers: { 'Content-Type': 'text/xml' }});
    }

    // --- Schedule Retrieval Logic ---
    const userSchedule = getScheduleForUser(user, combinedSchedule);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = days[new Date().getDay()];
    const todaySchedule = userSchedule.filter(e => e.day === today).sort((a, b) => a.time.localeCompare(b.time));

    let response = `Sorry, I didn't understand that. Try 'Today', 'Now', or 'Next'. The SMS service works best after an admin has uploaded a timetable.`;

    if (todaySchedule.length === 0) {
        response = `You have no classes scheduled for ${today}. Note: The SMS service may not have the latest timetable data.`;
    } else {
        if (messageLower === 'today') {
            response = `Your schedule for ${today}:\n` + todaySchedule.map(formatEventForSms).join('\n');
        } else if (messageLower === 'now' || messageLower === 'next') {
            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();

            const nextEvent = todaySchedule.find(event => {
                const [startTimeStr] = event.time.split(' - ');
                const [time, modifier] = startTimeStr.split(' ');
                let [hours, minutes] = time.split(':').map(Number);
                if (modifier === 'PM' && hours < 12) hours += 12;
                if (modifier === 'AM' && hours === 12) hours = 0;
                const eventStartTime = hours * 60 + (minutes || 0);
                return eventStartTime >= currentTime;
            });
            
            if (nextEvent) {
                response = `Next up: ${formatEventForSms(nextEvent)}`;
            } else {
                response = `You have no more classes scheduled for today.`;
            }
        }
    }

    const twiml = `<Response><Message>${response}</Message></Response>`;
    return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' }});

  } catch (error) {
    console.error('Error in SMS webhook:', error);
    const twimlError = `<Response><Message>Sorry, an error occurred. The SMS service might be unavailable.</Message></Response>`;
    return new NextResponse(twimlError, { status: 500, headers: { 'Content-Type': 'text/xml' } });
  }
}
