
import { NextRequest, NextResponse } from 'next/server';
import { users, timetable as defaultTimetableData } from '@/lib/data'; // Assuming these are the base data sources
import { TimetableEntry, User } from '@/app/providers/user-provider';
import { getFromStorage, saveToStorage } from '@/lib/storage';

// In a real app, these would be in a shared utility or helper file.
const getApplicationState = () => {
    const allUsers = getFromStorage<User[]>('allUsers', users);
    const masterSchedule = getFromStorage<TimetableEntry[]>('masterSchedule', []);
    const lecturerSchedules = getFromStorage<TimetableEntry[]>('lecturerSchedules', []);
    const combinedSchedule = [...masterSchedule, ...lecturerSchedules];
    return { allUsers, combinedSchedule };
};

const setApplicationState = (schedule: TimetableEntry[]) => {
    // This is a simplified function. A real app would need a more robust way
    // to separate master and lecturer schedules before saving.
    // For this example, we assume all changes are applied to the master schedule.
    saveToStorage('masterSchedule', schedule);
}

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
    return []; // Admins don't have a personal schedule in this context
};

const formatEventForSms = (event: TimetableEntry) => {
    return `${event.time}: ${event.courseCode} at ${event.room} (${event.status})`;
};

const normalizeCourseCode = (code: string) => {
    return code.replace(/[^A-Z0-9]/gi, '').toLowerCase();
};

export async function POST(req: NextRequest) {
  const { allUsers, combinedSchedule } = getApplicationState();
  let updatedSchedule = [...combinedSchedule]; // Copy to modify

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
    const messageParts = message.split(/\s+/);

    // --- Lecturer Status Update Logic ---
    if (user.role === 'lecturer' && messageParts.length > 1) {
        const potentialStatus = messageParts[messageParts.length - 1].toLowerCase();
        if (potentialStatus === 'confirm' || potentialStatus === 'cancel') {
            const status = potentialStatus === 'confirm' ? 'confirmed' : 'canceled';
            const courseCodeQuery = messageParts.slice(0, -1).join(' ');

            const normalizedQuery = normalizeCourseCode(courseCodeQuery);
            
            let foundEntry: TimetableEntry | undefined;
            
            // Find the course in the lecturer's schedule for today
            const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const today = days[new Date().getDay()];

            const lecturerSchedule = getScheduleForUser(user, combinedSchedule);
            foundEntry = lecturerSchedule.find(entry => 
                entry.day === today && 
                normalizeCourseCode(entry.courseCode).includes(normalizedQuery)
            );

            if (foundEntry) {
                // Update the status
                updatedSchedule = updatedSchedule.map(e => e.id === foundEntry!.id ? { ...e, status: status } : e);
                setApplicationState(updatedSchedule);

                const response = `Status for ${foundEntry.courseCode} has been updated to ${status}.`;
                return new NextResponse(`<Response><Message>${response}</Message></Response>`, { headers: { 'Content-Type': 'text/xml' }});
            } else {
                const response = `Could not find a class matching "${courseCodeQuery}" in your schedule for today.`;
                return new NextResponse(`<Response><Message>${response}</Message></Response>`, { headers: { 'Content-Type': 'text/xml' }});
            }
        }
    }

    // --- Schedule Retrieval Logic ---
    const userSchedule = getScheduleForUser(user, combinedSchedule);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const today = days[new Date().getDay()];
    const todaySchedule = userSchedule.filter(e => e.day === today).sort((a, b) => a.time.localeCompare(b.time));

    let response = "Sorry, I didn't understand that. Try 'Today', 'Now', or 'Next'.";

    if (todaySchedule.length === 0) {
        response = `You have no classes scheduled for ${today}.`;
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
    const twimlError = `<Response><Message>Sorry, an error occurred. Please try again later.</Message></Response>`;
    return new NextResponse(twimlError, { status: 500, headers: { 'Content-Type': 'text/xml' } });
  }
}
