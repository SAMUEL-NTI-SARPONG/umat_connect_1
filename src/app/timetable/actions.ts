
'use server';

import * as XLSX from 'xlsx';

// This is a new, robust parser based entirely on the user-provided implementation.
// It correctly handles merged cells, multiple courses within a single cell, and complex formats.
function parseUniversitySchedule(fileBuffer: Buffer) {
  const finalSchedule: any[] = [];
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

  // Define time slots, excluding break column (1:00-1:30)
  const timeSlots = [
    '7:00-8:00', '8:00-9:00', '9:00-10:00', '10:00-11:00', '11:00-12:00',
    '12:00-1:00', '1:30-2:30', '2:30-3:30', '3:30-4:30', '4:30-5:30', '5:30-6:30', '6:30-7:30'
  ];
  
  // Helper function to combine time slots into a range
  function combineTimeSlots(startIndex: number, endIndex: number): string {
    startIndex = Math.max(0, startIndex);
    endIndex = Math.min(timeSlots.length - 1, endIndex);

    if (startIndex > endIndex) return timeSlots[startIndex] || '';
    if (startIndex === endIndex) return timeSlots[startIndex] || '';

    const startTime = (timeSlots[startIndex] || '').split('-')[0];
    const endTime = (timeSlots[endIndex] || '').split('-')[1];
    return `${startTime}-${endTime}`;
  }

  for (const day of workbook.SheetNames) {
    const sheet = workbook.Sheets[day];
    if (!sheet) continue;

    const merges = sheet['!merges'] || [];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, range: 5, defval: '' }) as (string | number)[][];
    
    // Process rows starting from the data content
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowIndexInData = i + 5; // XLSX row index (1-based) is different from array index
        const room = row[0]?.toString().trim();
        
        if (!room) continue; // Skip if room name is empty

        let lastCourseInfo: { courseCode: string; lecturer: string; startTimeIndex: number; span: number; } | null = null;

        // j represents the column in the excel sheet (0-indexed)
        // we start at 1 because column 0 is the room
        for (let j = 1; j <= 12; j++) {
            const isBreakColumn = j === 6;
            if (isBreakColumn) continue;

            const timeSlotIndex = j > 6 ? j - 2 : j - 1;

            let isStartOfMerge = false;
            let mergeSpan = 1;

            for (const merge of merges) {
                if (merge.s.r === rowIndexInData && merge.s.c === j) {
                    isStartOfMerge = true;
                    mergeSpan = merge.e.c - merge.s.c + 1;
                    break;
                }
            }

            const cellValue = sheet[XLSX.utils.encode_cell({ r: rowIndexInData, c: j })]?.v?.toString().trim() || '';

            if (cellValue) {
                // If there's a course being tracked, save it first.
                if (lastCourseInfo) {
                    const endTimeIndex = lastCourseInfo.startTimeIndex + lastCourseInfo.span - 1;
                    finalSchedule.push({
                        day,
                        room,
                        time: combineTimeSlots(lastCourseInfo.startTimeIndex, endTimeIndex),
                        courseCode: lastCourseInfo.courseCode,
                        lecturer: lastCourseInfo.lecturer,
                    });
                    lastCourseInfo = null;
                }

                const courseEntries = cellValue.split(/\n|,/).map(e => e.trim()).filter(Boolean);
                const lecturer = courseEntries.length > 1 ? courseEntries.pop()! : 'TBA';
                const courseCode = courseEntries.join(' ');
                
                lastCourseInfo = {
                    courseCode,
                    lecturer,
                    startTimeIndex: timeSlotIndex,
                    span: mergeSpan
                };
            } else if (lastCourseInfo && timeSlotIndex >= lastCourseInfo.startTimeIndex + lastCourseInfo.span) {
                 // End of a course block
                const endTimeIndex = lastCourseInfo.startTimeIndex + lastCourseInfo.span - 1;
                finalSchedule.push({
                    day,
                    room,
                    time: combineTimeSlots(lastCourseInfo.startTimeIndex, endTimeIndex),
                    courseCode: lastCourseInfo.courseCode,
                    lecturer: lastCourseInfo.lecturer,
                });
                lastCourseInfo = null;
            }
        }
        
        // Save any remaining course at the end of the row
        if (lastCourseInfo) {
            const endTimeIndex = lastCourseInfo.startTimeIndex + lastCourseInfo.span - 1;
            finalSchedule.push({
                day,
                room,
                time: combineTimeSlots(lastCourseInfo.startTimeIndex, endTimeIndex),
                courseCode: lastCourseInfo.courseCode,
                lecturer: lastCourseInfo.lecturer,
            });
        }
    }
  }

  // Post-process to add level and departments
  return finalSchedule.map(entry => {
    const courseNumMatch = entry.courseCode.match(/\d+/);
    const level = courseNumMatch ? (parseInt(courseNumMatch[0][0], 10) * 100 || 0) : 0;
    
    const courseParts = entry.courseCode.trim().split(/\s+/);
    let courseNum = courseParts.pop(); // Remove course number like "158" or "274"
    
    // Check if the removed part is actually the course number
    if (!/^\d{3}$/.test(courseNum ?? '')) {
       courseParts.push(courseNum ?? ''); // it wasn't a course number, put it back
       courseNum = ''; // no valid course number found
    }

    const deptStr = courseParts.join(' ');
    const departments = deptStr.split(/[,/ ]+/).map(d => d.trim().replace(/[.-]/g, '')).filter(Boolean);
    if (departments.length === 0 && deptStr.length > 0) {
        departments.push(deptStr);
    }

    return { ...entry, level, departments, courseCode: `${deptStr} ${courseNum}`.trim() };
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
