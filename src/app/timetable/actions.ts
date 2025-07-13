
'use server';

import * as XLSX from 'xlsx';

// This new parser is a direct adaptation of the user-provided logic,
// ensuring it correctly handles the specific format of the timetable Excel file.

// Based on the user-provided logic, using a fixed time slot array is more reliable.
const timeSlots = [
  '7:00-8:00', '8:00-9:00', '9:00-10:00', '10:00-11:00', '11:00-12:00', 
  '12:00-1:00', '1:30-2:30', '2:30-3:30', '3:30-4:30', '4:30-5:30', '5:30-6:30', '6:30-7:30'
];

// Time slot for the break, which corresponds to column index 6
const breakColumnIndex = 6; 

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Helper function to combine time slots into a range, inspired by user's code.
function combineTimeSlots(startIndex: number, endIndex: number) {
  if (startIndex < 0 || endIndex >= timeSlots.length || startIndex > endIndex) {
    return 'Unknown Time';
  }
  const startTime = timeSlots[startIndex].split('-')[0];
  const endTime = timeSlots[endIndex].split('-')[1];
  return `${startTime} - ${endTime}`;
}


// New parsing function implementing the user's provided algorithm.
function parseUniversitySchedule(fileBuffer: Buffer) {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const finalSchedule = [];

  for (const day of days) {
    const sheet = workbook.Sheets[day];
    if (!sheet) continue;

    // Convert sheet to JSON, starting from the data rows.
    // `range: 5` tells sheet_to_json to start from the 6th row (index 5)
    // header: 1 turns rows into arrays of strings
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, range: 5 }) as (string | number)[][];

    for (const row of rows) {
        const room = row[0]?.toString().trim();
        // Skip rows that are not valid rooms.
        if (!room || room.toUpperCase().includes('VLE') || room.toUpperCase().includes('FIELD WORK') || room.toUpperCase().includes('LAB')) {
            continue;
        }

        let lastCourseInfo: { courseCode: string; lecturer: string } | null = null;
        let startTimeIndex: number | null = null;

        // Iterate through the time slot columns (1 to 12)
        for (let j = 1; j <= 12; j++) {
            // Adjust index for break column
            const timeSlotIndex = j > breakColumnIndex ? j - 2 : j - 1;
            const cellValue = row[j]?.toString().trim();

            const isNewCourse = cellValue && cellValue.toUpperCase() !== 'B R E A K';

            if (isNewCourse) {
                // A new course has started. First, save the previous one if it exists.
                if (lastCourseInfo && startTimeIndex !== null) {
                    const endTimeIndex = timeSlotIndex - 1;
                    finalSchedule.push({
                        day,
                        room,
                        time: combineTimeSlots(startTimeIndex, endTimeIndex),
                        ...lastCourseInfo,
                        departments: [], // Re-add if needed
                        level: 0,
                    });
                }

                // Start tracking the new course.
                const lines = cellValue.split('\n').map(line => line.trim()).filter(Boolean);
                const lecturer = lines.length > 1 ? lines.pop()! : 'TBA';
                const courseCode = lines.join(' ');
                
                lastCourseInfo = { courseCode, lecturer };
                startTimeIndex = timeSlotIndex;

            } else if (!cellValue && lastCourseInfo) {
                // This is an empty cell, indicating the previous course continues.
                // Do nothing and let it extend.
            } else {
                // This is a break, an empty cell at the start of a row, or the end of a course.
                // Save the tracked course.
                if (lastCourseInfo && startTimeIndex !== null) {
                    const endTimeIndex = timeSlotIndex - 1;
                    finalSchedule.push({
                        day,
                        room,
                        time: combineTimeSlots(startTimeIndex, endTimeIndex),
                        ...lastCourseInfo,
                        departments: [], // Re-add if needed
                        level: 0,
                    });
                }
                // Reset tracker
                lastCourseInfo = null;
                startTimeIndex = null;
            }
        }

        // After the loop, handle any course that extends to the end of the row.
        if (lastCourseInfo && startTimeIndex !== null) {
             finalSchedule.push({
                day,
                room,
                time: combineTimeSlots(startTimeIndex, timeSlots.length - 1),
                ...lastCourseInfo,
                departments: [], // Re-add if needed
                level: 0,
            });
        }
    }
  }

  // Post-process to add level and departments
  return finalSchedule.map(entry => {
    const firstDigitMatch = entry.courseCode.match(/\d/);
    const level = firstDigitMatch ? (parseInt(firstDigitMatch[0], 10) * 100 || 0) : 0;
    
    const courseParts = entry.courseCode.trim().split(/\s+/);
    courseParts.pop(); // Remove course number
    const deptStr = courseParts.join(' ');
    const departments = deptStr.split(/[,/ ]+/).map(d => d.trim().replace(/[.-]/g, '')).filter(Boolean);
    if (departments.length === 0 && deptStr.length > 0) {
        departments.push(deptStr);
    }

    return { ...entry, level, departments };
  });
}


export async function handleFileUpload(file: File) {
  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const parsedData = parseUniversitySchedule(fileBuffer);
    
    if (!parsedData || parsedData.length === 0) {
      throw new Error("The uploaded file could not be parsed or contains no valid schedule data. Please check the file format.");
    }
    return parsedData;
  } catch (error) {
    console.error("Parsing failed:", error);
    if (error instanceof Error && error.message.includes("contains no valid schedule data")) {
        throw error;
    }
    throw new Error("Failed to parse the Excel file. Please ensure it is in the correct format.");
  }
}
