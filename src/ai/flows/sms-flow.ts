
'use server';
/**
 * @fileOverview An SMS processing AI agent.
 *
 * - processSms - A function that handles incoming SMS messages and generates a response.
 * - ProcessSmsInput - The input type for the processSms function.
 * - ProcessSmsOutput - The return type for the processSms function.
 */

import { ai } from '@/ai/genkit';
import { User, users } from '@/lib/data';
import { TimetableEntry, EmptySlot } from '@/app/providers/user-provider';
import { z } from 'zod';

const ProcessSmsInputSchema = z.object({
  from: z.string().describe('The phone number of the user sending the message.'),
  message: z.string().describe('The content of the SMS message.'),
  allUsers: z.array(z.any()).describe('A list of all users in the system.'),
  masterSchedule: z.array(z.any()).describe('The master timetable for all courses.'),
  lecturerSchedules: z.array(z.any()).describe('Schedules added by lecturers.'),
  emptySlots: z.array(z.any()).describe('A list of all empty classrooms and their times.'),
});
export type ProcessSmsInput = z.infer<typeof ProcessSmsInputSchema>;

const ProcessSmsOutputSchema = z.object({
  response: z.string().describe('The text response to be sent back to the user.'),
});
export type ProcessSmsOutput = z.infer<typeof ProcessSmsOutputSchema>;

export async function processSms(input: ProcessSmsInput): Promise<ProcessSmsOutput> {
  return processSmsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smsPrompt',
  input: { schema: ProcessSmsInputSchema },
  output: { schema: ProcessSmsOutputSchema },
  prompt: `You are an intelligent SMS assistant for a university app called UMaT Connect.
Your goal is to provide concise and helpful information to users (students and lecturers) based on their text messages.

A user with the phone number {{from}} has sent the following message:
"{{message}}"

Here is the data you have access to. You must use this data to answer the user's query.
- All Users: {{{json allUsers}}}
- Master Timetable: {{{json masterSchedule}}}
- Lecturer-added Schedules: {{{json lecturerSchedules}}}
- Free Classrooms: {{{json emptySlots}}}

First, identify the user sending the message by matching their 'from' number with the 'phone' field in the user list. If you cannot find the user, respond with: "Sorry, your phone number is not registered in UMaT Connect. Please log in to the app to register."

Once the user is identified, determine their intent. Supported queries include:
- My timetable for a specific day (e.g., "my schedule for monday").
- Finding free classrooms on a specific day (e.g., "any free rooms on tuesday?").
- General information about their own profile (e.g., "what's my level?").

Based on the user's role (student or lecturer) and their query, find the relevant information from the provided data.

- For timetable requests, filter the combined master and lecturer schedules based on the user's level, department (for students), or name (for lecturers) for the requested day. Format the response clearly, like:
"Your schedule for Monday:
- 8:00 AM - 10:00 AM: CE 101 (Room A101)
- 2:30 PM - 4:30 PM: MA 102 (Room B203)"

- For free room requests, filter the emptySlots for the requested day and summarize the available rooms and times. If there are many, list a few and mention there are more.
"Free rooms on Tuesday:
- A101: 9-11 AM, 2-4 PM
- B203: 8-10 AM
- C105: All day"

- For profile information, just pull the data from the user's record.

- If the user's request is unclear or unsupported, respond with: "Sorry, I didn't understand that. You can ask me for 'my timetable for [day]' or 'free rooms on [day]'."

IMPORTANT: Keep your responses short and to the point, suitable for an SMS message. Do not add conversational filler unless necessary.
`,
});

const processSmsFlow = ai.defineFlow(
  {
    name: 'processSmsFlow',
    inputSchema: ProcessSmsInputSchema,
    outputSchema: ProcessSmsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
