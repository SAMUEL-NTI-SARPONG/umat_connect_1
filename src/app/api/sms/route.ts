
import { NextRequest, NextResponse } from 'next/server';
import { processSms, ProcessSmsInput } from '@/ai/flows/sms-flow';
import { users, timetable } from '@/lib/data'; // Assuming these are the base data sources

// This is a simplified example of how you might fetch your application's data.
// In a real-world scenario, you would fetch this from your database or state management solution.
const getApplicationData = async () => {
  // For this example, we'll use the static data.
  // In a real app, you would have functions to get this from a live database.
  const allUsers = users;
  const masterSchedule = timetable.administrator; // Example data
  const lecturerSchedules = timetable.lecturer; // Example data
  const emptySlots: any[] = []; // You'd have a function to calculate this.

  return { allUsers, masterSchedule, lecturerSchedules, emptySlots };
};


export async function POST(req: NextRequest) {
  try {
    // SMS providers like Twilio send data in a specific format.
    // This example assumes a form-urlencoded body, which is common.
    const formData = await req.formData();
    const from = formData.get('From') as string; // Sender's phone number
    const message = formData.get('Body') as string; // The SMS message content

    if (!from || !message) {
      return NextResponse.json({ error: 'Missing "From" or "Body" in request' }, { status: 400 });
    }

    // 1. Fetch the necessary data for the AI flow
    const { allUsers, masterSchedule, lecturerSchedules, emptySlots } = await getApplicationData();

    // 2. Prepare the input for our existing AI flow
    const smsInput: ProcessSmsInput = {
      from: from,
      message: message,
      allUsers,
      masterSchedule: masterSchedule || [],
      lecturerSchedules,
      emptySlots,
    };

    // 3. Call the AI flow to get the response
    const result = await processSms(smsInput);

    // 4. Send the response back in the format the SMS provider expects.
    // Twilio, for example, uses TwiML (a form of XML) to send a reply.
    const twiml = `
<Response>
  <Message>${result.response}</Message>
</Response>
    `.trim();

    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'text/xml',
      },
    });

  } catch (error) {
    console.error('Error in SMS webhook:', error);
    // Return a generic error message if something goes wrong
     const twimlError = `
<Response>
  <Message>Sorry, an error occurred. Please try again later.</Message>
</Response>
    `.trim();

    return new NextResponse(twimlError, {
        status: 500,
        headers: {
            'Content-Type': 'text/xml',
        },
    });
  }
}
