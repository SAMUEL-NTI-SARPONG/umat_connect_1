
'use server';

import * as XLSX from 'xlsx';

// This is a new, robust parser based entirely on the user-provided implementation.
// It correctly handles merged cells and complex course formats.
function parseUniversitySchedule(fileBuffer: Buffer) {
  const finalSchedule = [];
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  
  const timeSlots = [
    '7:00-8:00', '8:00-9:00', '9:00-10:00', '10:00-11:00', '11:00-12:00',
    '12:00-1:00', '1:30-2:30', '2:30-3:30', '3:30-4:30', '4:30-5:30', '5:30-6:30', '6:30-7:30'
  ];

  // Helper function to combine time slots into a range
  function combineTimeSlots(startIndex: number, endIndex: number): string {
    startIndex = Math.max(0, startIndex);
    endIndex = Math.min(timeSlots.length - 1, endIndex);

    if (startIndex > endIndex) return timeSlots[startIndex];
    if (startIndex === endIndex) return timeSlots[startIndex];

    const startTime = timeSlots[startIndex].split('-')[0];
    const endTime = timeSlots[endIndex].split('-')[1];
    return `${startTime} - ${endTime}`;
  }

  for (const day of workbook.SheetNames) {
    const sheet = workbook.Sheets[day];
    if (!sheet) continue;

    const merges = sheet['!merges'] || [];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, range: 5, defval: '' }) as (string | number)[][];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowIndexInData = i + 5; 
        const room = row[0]?.toString().trim();
        
        if (!room) continue;

        // j represents the column in the excel sheet (0-indexed)
        // we start at 1 because column 0 is the room
        for (let j = 1; j <= 12; j++) {
            const isBreakColumn = j === 6; 
            if (isBreakColumn) continue;

            const timeSlotIndex = j > 6 ? j - 2 : j - 1;

            const cellAddress = { r: rowIndexInData, c: j };
            const cellRef = XLSX.utils.encode_cell(cellAddress);
            const currentCell = sheet[cellRef];
            const cellValue = currentCell ? currentCell.v?.toString().trim() : '';
            
            if (!cellValue) continue;

            let mergeInfo = merges.find(m => m.s.r === cellAddress.r && m.s.c === cellAddress.c);
            
            // This is the start of a potential course entry
            const courseEntries = cellValue.split('\n').map(entry => entry.trim()).filter(Boolean);
            if (courseEntries.length === 0) continue;

            const lecturer = courseEntries.length > 1 ? courseEntries.pop()! : 'TBA';
            const courseCode = courseEntries.join(' ');
            
            let colSpan = 1;
            if (mergeInfo) {
              colSpan = mergeInfo.e.c - mergeInfo.s.c + 1;
            }

            const startTimeIndex = timeSlotIndex;
            const endTimeIndex = startTimeIndex + colSpan - 1;
            
            finalSchedule.push({
                day,
                room,
                time: combineTimeSlots(startTimeIndex, endTimeIndex),
                courseCode,
                lecturer,
            });

            if (colSpan > 1) {
              j += colSpan - 1; // Skip the merged cells
            }
        }
    }
  }

  // Post-process to add level and departments
  return finalSchedule.map(entry => {
    const courseNumMatch = entry.courseCode.match(/\d+/);
    const level = courseNumMatch ? (parseInt(courseNumMatch[0][0], 10) * 100 || 0) : 0;
    
    const courseParts = entry.courseCode.trim().split(/\s+/);
    const courseNum = courseParts.pop(); // Remove course number like "158" or "274"
    
    // Check if the removed part is actually the course number
    if (!/^\d{3}$/.test(courseNum ?? '')) {
       courseParts.push(courseNum ?? ''); // it wasn't a course number, put it back
    }

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
