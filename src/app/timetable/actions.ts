
'use server';

import * as XLSX from 'xlsx';

// This is a new, robust parser based entirely on the user-provided implementation.
// It correctly handles merged cells and complex course formats.

// Define time slots, excluding break column (1:00-1:30)
const timeSlots = [
  '7:00-8:00', '8:00-9:00', '9:00-10:00', '10:00-11:00', '11:00-12:00',
  '12:00-1:00', '1:30-2:30', '2:30-3:30', '3:30-4:30', '4:30-5:30', '5:30-6:30', '6:30-7:30'
];

// Helper function to combine time slots into a range
function combineTimeSlots(startIndex: number, endIndex: number): string {
  // Ensure indices are within bounds
  startIndex = Math.max(0, startIndex);
  endIndex = Math.min(timeSlots.length - 1, endIndex);

  if (startIndex > endIndex) {
    // This can happen with single-cell entries where logic might subtract 1.
    // Default to the start index's slot.
    return timeSlots[startIndex];
  }
    
  if (startIndex === endIndex) {
    return timeSlots[startIndex];
  }
  const startTime = timeSlots[startIndex].split('-')[0];
  const endTime = timeSlots[endIndex].split('-')[1];
  return `${startTime} - ${endTime}`;
}


// The new parsing function, adapted from the user's provided code.
function parseUniversitySchedule(fileBuffer: Buffer) {
  const finalSchedule = [];
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  
  for (const day of workbook.SheetNames) {
    const sheet = workbook.Sheets[day];
    if (!sheet) continue;

    const merges = sheet['!merges'] || [];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, range: 5, defval: '' }) as (string | number)[][];

    // Create a map for faster lookup of merged cells
    const mergeMap = new Map<string, { s: any, e: any }>();
    for (const merge of merges) {
      for (let r = merge.s.r; r <= merge.e.r; r++) {
        for (let c = merge.s.c; c <= merge.e.c; c++) {
          mergeMap.set(`${r},${c}`, merge);
        }
      }
    }

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowIndexInData = i + 5; // The actual row number in the excel sheet
        const room = row[0]?.toString().trim();
        
        if (!room) continue;

        let lastCourseInfo: { courseCode: string; lecturer: string } | null = null;
        let startTimeIndex: number | null = null;
        let colSpan = 1;

        // Iterate through the time slot columns (1 to 12)
        // j represents the column in the excel sheet (0-indexed)
        // we start at 1 because column 0 is the room
        for (let j = 1; j <= 12; j++) {
            const isBreakColumn = j === 6; // Excel column 'G' is index 6
            if (isBreakColumn) {
                // If there was a course being tracked before the break, end it.
                if (lastCourseInfo && startTimeIndex !== null) {
                    const endTimeIndex = startTimeIndex + colSpan - 1;
                    finalSchedule.push({
                        day,
                        room,
                        time: combineTimeSlots(startTimeIndex, endTimeIndex),
                        ...lastCourseInfo,
                    });
                    lastCourseInfo = null;
                    startTimeIndex = null;
                    colSpan = 1;
                }
                continue; // Skip the break column itself
            }
            
            // This is the current cell being processed
            const timeSlotIndex = j > 6 ? j - 1 : j; // Map excel column to 0-11 time slot index
            const excelColIndex = timeSlotIndex + 1; // Map back to 1-based excel column for data access

            const cellValue = row[excelColIndex]?.toString().trim();
            
            // Check if the current cell is the start of a new merge
            const mergeInfo = mergeMap.get(`${rowIndexInData},${excelColIndex}`);
            const isNewMergeStart = mergeInfo && mergeInfo.s.c === excelColIndex;

            if (cellValue) {
                // A new course has started. First, save the previous one.
                if (lastCourseInfo && startTimeIndex !== null) {
                    const endTimeIndex = startTimeIndex + colSpan - 1;
                    finalSchedule.push({
                        day,
                        room,
                        time: combineTimeSlots(startTimeIndex, endTimeIndex),
                        ...lastCourseInfo,
                    });
                }

                // Start tracking the new course.
                const lines = cellValue.split('\n').map(line => line.trim()).filter(Boolean);
                const lecturer = lines.length > 1 ? lines.pop()! : 'TBA';
                const courseCode = lines.join(' ');

                lastCourseInfo = { courseCode, lecturer };
                startTimeIndex = timeSlotIndex;
                colSpan = isNewMergeStart ? mergeInfo.e.c - mergeInfo.s.c + 1 : 1;
            
            } else if (!cellValue && lastCourseInfo) {
              // This is an empty cell. If it's not part of the current course's span, end the course.
              if (timeSlotIndex >= startTimeIndex! + colSpan) {
                 const endTimeIndex = startTimeIndex! + colSpan - 1;
                  finalSchedule.push({
                      day,
                      room,
                      time: combineTimeSlots(startTimeIndex!, endTimeIndex),
                      ...lastCourseInfo,
                  });
                  lastCourseInfo = null;
                  startTimeIndex = null;
                  colSpan = 1;
              }
            }
        }

        // After the loop, handle any course that extends to the end of the row.
        if (lastCourseInfo && startTimeIndex !== null) {
            const endTimeIndex = startTimeIndex + colSpan - 1;
             finalSchedule.push({
                day,
                room,
                time: combineTimeSlots(startTimeIndex, endTimeIndex),
                ...lastCourseInfo,
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
