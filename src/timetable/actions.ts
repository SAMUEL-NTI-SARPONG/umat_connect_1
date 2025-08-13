

'use server';

import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { initialDepartmentMap } from '@/lib/data';

// This is a new, robust parser based entirely on the user-provided implementation.
// It correctly handles merged cells, multiple courses within a single cell, and complex formats.
function parseUniversitySchedule(fileBuffer: Buffer) {
  const finalSchedule: any[] = [];
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

  // Define time slots, excluding break column (1:00-1:30)
  const timeSlots = [
    '7:00-8:00 AM', '8:00-9:00 AM', '9:00-10:00 AM', '10:00-11:00 AM', '11:00-12:00 PM',
    '12:00-1:00 PM', '1:30-2:30 PM', '2:30-3:30 PM', '3:30-4:30 PM', '4:30-5:30 PM', '5:30-6:30 PM', '6:30-7:30 PM'
  ];

    // Helper function to combine time slots into a range
  function combineTimeSlots(startIndex: number, endIndex: number): string {
    startIndex = Math.max(0, startIndex);
    endIndex = Math.min(timeSlots.length - 1, endIndex);

    if (startIndex > endIndex) return timeSlots[startIndex] || '';
    if (startIndex === endIndex) return timeSlots[startIndex] || '';

    const startTimeFull = timeSlots[startIndex] || '';
    const endTimeFull = timeSlots[endIndex] || '';
    
    const startTime = startTimeFull.split('-')[0].trim();
    const endTime = endTimeFull.split('-')[1].trim();

    return `${startTime} - ${endTime}`;
  }


  for (const day of workbook.SheetNames) {
    const sheet = workbook.Sheets[day];
    if (!sheet) continue;

    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' }) as (string | number)[][];
    const merges = sheet['!merges'] || [];
    
    // Process rows starting from the data content (row index 5, which is the 6th row)
    for (let i = 5; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || !row[0] || !String(row[0]).trim()) continue; // Skip if room name is empty

        const room = String(row[0]).trim();

        for (let j = 1; j < row.length; j++) {
            const cellValue = String(row[j] || '').trim();
            if (!cellValue || cellValue.toLowerCase().includes('break')) continue;
            
            // Find merge info for this cell
            let mergeSpan = 1;
            for (const merge of merges) {
                if (merge.s.r === i && merge.s.c === j) {
                    mergeSpan = merge.e.c - merge.s.c + 1;
                    break;
                }
            }

            const courseEntries = cellValue.split(/\n|,/).map(e => e.trim()).filter(Boolean);
            if (courseEntries.length === 0) continue;

            const lecturer = courseEntries.length > 1 ? courseEntries.pop()! : 'TBA';
            const courseCode = courseEntries.join(' ');
            
            // Adjust for 1-based indexing and break column when calculating time
            const timeSlotIndexStart = j - 1 + (j > 6 ? -1 : 0);
            const timeSlotIndexEnd = timeSlotIndexStart + mergeSpan -1;

            finalSchedule.push({
                day,
                room,
                time: combineTimeSlots(timeSlotIndexStart, timeSlotIndexEnd),
                courseCode,
                lecturer,
            });

            // Skip columns that are part of this merge
            if (mergeSpan > 1) {
                j += mergeSpan - 1;
            }
        }
    }
  }

  // Post-process to add level and departments
  return finalSchedule.map(entry => {
    const courseNumMatch = entry.courseCode.match(/\d+/);
    const level = courseNumMatch ? (parseInt(courseNumMatch[0][0], 10) * 100 || 0) : 0;
    
    const courseParts = entry.courseCode.trim().split(/\s+/);
    const courseNumParts: string[] = [];
    const deptInitialParts: string[] = [];

    courseParts.forEach(part => {
      if (/^\d/.test(part)) {
        courseNumParts.push(part);
      } else if (/[a-zA-Z]/.test(part)) {
        deptInitialParts.push(part.replace(/[.-]/g, ''));
      }
    });

    const uniqueDeptInitials = [...new Set(deptInitialParts)];

    const deptStr = uniqueDeptInitials.join(' ');
    const courseNumStr = courseNumParts.join(' ');

    const departments = uniqueDeptInitials
      .join(' ')
      .split(/[/ ]+/)
      .map(d => d.trim())
      .filter(Boolean)
      .map(initial => initialDepartmentMap.get(initial) || initial);
    
    const finalCourseCode = `${deptStr} ${courseNumStr}`.trim();

    return { ...entry, level, departments, courseCode: finalCourseCode };
  });
}


export async function handleFileUpload(fileData: string) {
  const fileBuffer = Buffer.from(fileData, 'base64');
  try {
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

export async function findEmptyClassrooms(fileData: string) {
  const fileBuffer = Buffer.from(fileData, 'base64');
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  
  // Define time slots, excluding break column (1:00-1:30)
  const timeSlots = [
    '7:00-8:00 AM', '8:00-9:00 AM', '9:00-10:00 AM', '10:00-11:00 AM', '11:00-12:00 PM',
    '12:00-1:00 PM', '1:30-2:30 PM', '2:30-3:30 PM', '3:30-4:30 PM', '4:30-5:30 PM', '5:30-6:30 PM', '6:30-7:30 PM'
  ];

  const emptySlots: { day: string; location: string; time: string }[] = [];

  // Process each day (sheet)
  for (const day of workbook.SheetNames) {
    const sheet = workbook.Sheets[day];
    if (!sheet) continue;

    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' }) as (string | number)[][];
    const merges = sheet['!merges'] || [];
    
    // Track occupied time slots for each room
    const roomOccupancy = new Map<string, Set<number>>();

    // Process rows starting from the data content (row index 5, which is the 6th row)
    for (let i = 5; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || !row[0] || !String(row[0]).trim()) continue; // Skip if room name is empty

      const room = String(row[0]).trim();
      
      // Initialize occupancy tracking for this room
      if (!roomOccupancy.has(room)) {
        roomOccupancy.set(room, new Set<number>());
      }
      const occupiedSlots = roomOccupancy.get(room)!;

      // Process each cell in the row (same logic as parseUniversitySchedule)
      for (let j = 1; j < row.length; j++) {
        const cellValue = String(row[j] || '').trim();
        if (!cellValue || cellValue.toLowerCase().includes('break')) continue;
        
        // Find merge info for this cell (same as parseUniversitySchedule)
        let mergeSpan = 1;
        for (const merge of merges) {
          if (merge.s.r === i && merge.s.c === j) {
            mergeSpan = merge.e.c - merge.s.c + 1;
            break;
          }
        }

        // Check if cell actually contains course data (same validation as parseUniversitySchedule)
        const courseEntries = cellValue.split(/\n|,/).map(e => e.trim()).filter(Boolean);
        if (courseEntries.length === 0) continue;

        // Calculate time slot indices (same logic as parseUniversitySchedule)
        const timeSlotIndexStart = j - 1 + (j > 6 ? -1 : 0);
        const timeSlotIndexEnd = timeSlotIndexStart + mergeSpan - 1;

        // Mark all time slots covered by this course as occupied
        for (let slotIndex = timeSlotIndexStart; slotIndex <= timeSlotIndexEnd; slotIndex++) {
          if (slotIndex >= 0 && slotIndex < timeSlots.length) {
            occupiedSlots.add(slotIndex);
          }
        }

        // Skip columns that are part of this merge (same as parseUniversitySchedule)
        if (mergeSpan > 1) {
          j += mergeSpan - 1;
        }
      }
    }

    // Now find empty slots for each room
    roomOccupancy.forEach((occupiedSlots, room) => {
      for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
        if (!occupiedSlots.has(slotIndex)) {
          emptySlots.push({
            day: day,
            location: room,
            time: timeSlots[slotIndex]
          });
        }
      }
    });
  }

  return emptySlots;
}

function extractTimetableData(fileBuffer: Buffer) {
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      
      const resitSheet = workbook.Sheets['SPECIAL RESIT'];
      if (!resitSheet) {
          throw new Error("Sheet 'SPECIAL RESIT' not found in the Excel file.");
      }
  
      const sheetData = XLSX.utils.sheet_to_json(resitSheet, { header: 1, raw: false, blankrows: false }) as any[][];
      
      let venue = 'Not specified';
      for(let i = 0; i < sheetData.length; i++) {
          const row = sheetData[i];
          if (row[0] && typeof row[0] === 'string' && row[0].toUpperCase().includes('VENUE')) {
              venue = row[0].replace(/VENUE:/i, '').trim();
              break;
          }
      }
  
      let headerRowIndex = -1;
      const expectedHeaders = ['DATE', 'COURSE NO.', 'COURSE NAME', 'DEPARTMENT', 'NUMBER', 'ROOM', 'EXAMINER', 'SESSION (M/A)'];
      
      for (let i = 0; i < sheetData.length; i++) {
        const row = sheetData[i];
        if (row.length >= expectedHeaders.length && row.slice(0, expectedHeaders.length).every((cell, idx) => 
          cell && typeof cell === 'string' && cell.trim().toUpperCase().replace(/\s/g, '') === expectedHeaders[idx].replace(/\s/g, '')
        )) {
          headerRowIndex = i;
          break;
        }
      }
  
      if (headerRowIndex === -1) {
        throw new Error(`No valid header row found in sheet "SPECIAL RESIT".`);
      }
  
      const entries = [];
      let entryIdCounter = 0;
      for (let i = headerRowIndex + 1; i < sheetData.length; i++) {
        const row = sheetData[i];
        if (!row[0] || (typeof row[0] === 'string' && row[0].trim() === '') || (typeof row[0] === 'string' && row[0].toUpperCase().includes('FOR ANY ISSUES'))) {
          continue;
        }
  
        let dateStr;
        if(typeof row[0] === 'number') {
          const jsDate = XLSX.SSF.parse_date_code(row[0]);
          dateStr = `${String(jsDate.d).padStart(2, '0')}-${String(jsDate.m).padStart(2, '0')}-${jsDate.y}`;
        } else {
          dateStr = row[0] || null;
        }
  
        const entry = {
          id: entryIdCounter++,
          date: dateStr,
          courseCode: row[1] || null,
          courseName: row[2] || null,
          department: row[3] || null,
          numberOfStudents: parseInt(row[4], 10) || 0,
          room: row[5] || null,
          examiner: row[6] || null,
          session: row[7] || null,
        };
  
        entries.push(entry);
      }
  
      // Simple structure without distribution.
      // The data is just a flat list of courses for the "Distributed" sheet.
      // The view components will need to handle this.
      const lecturerEntries = [{
        lecturer: "All Courses", // Placeholder lecturer
        courses: entries,
      }];
  
      return {
        venue,
        isDistributed: false,
        sheets: [{
            sheetName: "Distributed",
            entries: lecturerEntries,
        }]
      };
  
    } catch (error) {
      console.error('Error processing Excel file:', error);
      throw new Error('Failed to extract timetable data. Please ensure the file is a valid Excel file with the correct format.');
    }
  }

export async function handleSpecialResitUpload(fileData: string) {
  const fileBuffer = Buffer.from(fileData, 'base64');
  try {
    const parsedData = extractTimetableData(fileBuffer);
    
    if (!parsedData || parsedData.sheets.length === 0) {
      throw new Error("The uploaded file could not be parsed or contains no valid resit data. Please check the file format.");
    }
    return parsedData;
  } catch (error) {
    console.error("Resit parsing failed:", error);
    if (error instanceof Error && error.message.includes("contains no valid resit data")) {
        throw error;
    }
    throw new Error("Failed to parse the special resit Excel file. Please ensure it is in the correct format.");
  }
}

function excelDateToJSDate(serial: number) {
    if (typeof serial !== 'number') return serial;
    const utc_days = Math.floor(serial - 25569); // Excel epoch starts at Jan 1, 1900
    const date = new Date(utc_days * 86400 * 1000);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
}
  
function mapPeriod(period: string) {
    if (!period) return 'Unknown';
    switch (period.toUpperCase()) {
        case 'M': return 'Morning';
        case 'A': return 'Afternoon';
        case 'E': return 'Evening';
        default: return period || 'Unknown';
    }
}

function cleanName(name: string | null) {
    if (!name) return '';
    return name.trim().replace(/\s+/g, ' ');
}

function addDistributionFields(entry: any) {
    const courseNumMatch = entry.courseCode.match(/\d+/);
    const level = courseNumMatch ? (parseInt(courseNumMatch[0][0], 10) * 100 || 0) : 0;
    
    const courseParts = entry.courseCode.trim().split(/\s+/);
    const deptInitialParts: string[] = [];
  
    courseParts.forEach(part => {
      if (/[a-zA-Z]/.test(part) && !/^\d/.test(part)) {
        deptInitialParts.push(part.replace(/[.-]/g, ''));
      }
    });
  
    const uniqueDeptInitials = [...new Set(deptInitialParts)];
  
    const departments = uniqueDeptInitials
      .map(initial => initialDepartmentMap.get(initial) || initial)
      .filter(Boolean);
  
    return { ...entry, level, departments };
  }

export async function handleExamsUpload(fileData: string) {
    const fileBuffer = Buffer.from(fileData, 'base64');
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const examsData: any[] = [];
    const practicalsData: any[] = [];
    let idCounter = 0;

    // Process general exams
    const examSheets = ['CLASS', 'GENERAL'];
    for (const sheetName of examSheets) {
        if (!workbook.SheetNames.includes(sheetName)) continue;

        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        let dataStartIndex = -1;
        for (let i = 0; i < jsonData.length; i++) {
            const row: any = jsonData[i];
            if (row && String(row[0]).trim().toUpperCase() === 'DATE' && String(row[1]).trim().toUpperCase().includes('COURSE')) {
                dataStartIndex = i + 1;
                break;
            }
        }
        if (dataStartIndex === -1) continue;

        const rows = XLSX.utils.sheet_to_json(sheet, { range: dataStartIndex -1 });
        
        rows.forEach((row: any) => {
            if (row.DATE && (row['COURSE NO'] || row['COURSE NO.'])) {
                const examEntry = {
                    id: idCounter++,
                    date: row.DATE,
                    dateStr: excelDateToJSDate(row.DATE),
                    day: new Date(excelDateToJSDate(row.DATE).split('-').reverse().join('-')).toLocaleDateString('en-US', { weekday: 'long' }),
                    courseCode: row['COURSE NO'] || row['COURSE NO.'],
                    courseName: row['COURSE NAME'],
                    class: row.CLASS,
                    lecturer: cleanName(row.LECTURER),
                    room: row['LECTURE HALL'],
                    invigilator: cleanName(row.INVIGILATOR),
                    period: mapPeriod(row.PERIOD),
                };
                examsData.push(addDistributionFields(examEntry));
            }
        });
    }

    // Process practicals
    const practicalsSheetName = 'PRACTICAL';
    if (workbook.SheetNames.includes(practicalsSheetName)) {
        const sheet = workbook.Sheets[practicalsSheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        let dataStartIndex = -1;
        for (let i = 0; i < jsonData.length; i++) {
            const row: any = jsonData[i];
            if (row && String(row[0]).trim().toUpperCase() === 'DATE' && String(row[1]).trim().toUpperCase() === 'CRS NO.') {
                dataStartIndex = i + 1;
                break;
            }
        }
    
        if (dataStartIndex !== -1) {
            const rows = XLSX.utils.sheet_to_json(sheet, { range: dataStartIndex - 1 });
            rows.forEach((row: any) => {
                if (row['DATE'] && row['CRS NO.']) {
                    const practicalEntry = {
                        id: idCounter++,
                        date: row['DATE'],
                        dateStr: excelDateToJSDate(row['DATE']),
                        day: new Date(excelDateToJSDate(row['DATE']).split('-').reverse().join('-')).toLocaleDateString('en-US', { weekday: 'long' }),
                        courseCode: row['CRS NO.'],
                        courseName: row['COURSE TITLE'],
                        class: row['CLASS'],
                        lecturer: cleanName(row['EXAMINER']),
                        room: row['ROOM'],
                        invigilator: cleanName(row['INVIGILATOR']),
                        period: mapPeriod(row['MORN/NOON']),
                        is_practical: true,
                    };
                    practicalsData.push(addDistributionFields(practicalEntry));
                }
            });
        }
    }

    if (examsData.length === 0 && practicalsData.length === 0) {
        throw new Error("No valid exam or practical data found in the file.");
    }

    // Sort by date
    examsData.sort((a, b) => a.date - b.date);
    practicalsData.sort((a, b) => a.date - b.date);

    return { exams: examsData, practicals: practicalsData };
}

// New function to handle practicals specifically
export async function handlePracticalsUpload(fileData: string) {
    const fileBuffer = Buffer.from(fileData, 'base64');
    const timetableData: any[] = [];
    let idCounter = 10000; // Start with a high number to avoid ID collision
  
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = 'PRACTICAL';
    if (!workbook.SheetNames.includes(sheetName)) {
      return []; // No practicals sheet found
    }
  
    const sheet = workbook.Sheets[sheetName];
  
    // Helper to normalize row data for practicals
    function normalizePracticalRow(row: any) {
      return {
        id: idCounter++,
        date: row['DATE'],
        dateStr: typeof row['DATE'] === 'number' ? excelDateToJSDate(row['DATE']) : row['DATE'],
        day: new Date(excelDateToJSDate(row['DATE']).split('-').reverse().join('-')).toLocaleDateString('en-US', { weekday: 'long' }),
        courseCode: row['CRS NO.'],
        courseName: row['COURSE TITLE'],
        class: row['CLASS'],
        lecturer: cleanName(row['EXAMINER']),
        room: row['ROOM'],
        invigilator: cleanName(row['INVIGILATOR']),
        period: mapPeriod(row['MORN/NOON']),
        is_practical: true,
      };
    }
  
    // Find the starting row of actual data
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    let dataStartIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      const row: any = rows[i];
      if (row && String(row[0]).trim().toUpperCase() === 'DATE' && String(row[1]).trim().toUpperCase() === 'CRS NO.') {
        dataStartIndex = i + 1;
        break;
      }
    }
  
    if (dataStartIndex === -1) {
        throw new Error("Could not find the header row in the PRACTICAL sheet.");
    }
  
    const sheetRows = XLSX.utils.sheet_to_json(sheet, { range: dataStartIndex -1 });
  
    sheetRows.forEach((row: any) => {
        if (row['DATE'] && row['CRS NO.']) {
            timetableData.push(normalizePracticalRow(row));
        }
    });

    timetableData.sort((a, b) => a.date - b.date);
  
    return timetableData;
}
