
'use server';

import * as XLSX from 'xlsx';
import Papa from 'papaparse';

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

  const departmentMap = new Map([
    // Faculty of mining and minerals
    ['MN', 'Mining Engineering'],
    ['MR', 'Minerals Engineering'],
    // Faculty of Engineering
    ['MC', 'Mechanical Engineering'],
    ['EL', 'Electrical and Electronic Engineering'],
    ['RN', 'Renewable Energy Engineering'],
    ['TC', 'Telecommunication Engineering'],
    ['PM', 'Plant and Maintenance Engineering'],
    // Faculty of computing and mathematical sciences
    ['CY', 'Cyber Security'],
    ['CE', 'Computer Science And Engineering'],
    ['IS', 'Information Systems and Technology'],
    ['MA', 'Mathematics'],
    ['SD', 'Statistical Data Science'],
    // Faculty of integrate management studies
    ['LT', 'Logistics and Transport Management'],
    ['EC', 'Economics and Industrial Organisation'],
    // Faculty of geosciences and environmental studies
    ['GM', 'Geomatic Engineering'],
    ['GL', 'Geological Engineering'],
    ['SP', 'Spatial Planning'],
    ['ES', 'Environmental and Safety Engineering'],
    ['LA', 'Land Administration and Information Systems'],
    // School of Petroleum studies
    ['PE', 'Petroleum Engineering'],
    ['NG', 'Natural Gas Engineering'],
    ['PG', 'Petroleum Geosciences and Engineering'],
    ['RP', 'Petroleum Refining and Petrochemical Engineering'],
    ['CH', 'Chemical Engineering'],
  ]);


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
      .map(initial => departmentMap.get(initial) || initial);
    
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
  const result: { day: string; location: string; time: string }[] = [];

  // Define time slots, excluding break column (1:00-1:30)
  const timeSlots = [
    '7:00-8:00 AM', '8:00-9:00 AM', '9:00-10:00 AM', '10:00-11:00 AM', '11:00-12:00 PM',
    '12:00-1:00 PM', '1:30-2:30 PM', '2:30-3:30 PM', '3:30-4:30 PM', '4:30-5:30 PM', '5:30-6:30 PM', '6:30-7:30 PM'
  ];
  
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetNames = workbook.SheetNames;

  // Process each sheet
  sheetNames.forEach(sheetName => {
    const day = sheetName;
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;

    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' }) as (string | number)[][];
    
    // Process rows starting from the data content (row index 5)
    for (let i = 5; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || !row[0] || !String(row[0]).trim()) continue;

      const location = String(row[0]).trim();
      const occupiedSlots = new Set<number>();

      // Pre-process to mark all occupied slots
      for (let j = 1; j < row.length; j++) {
        const cellValue = String(row[j] || '').trim();
         if (cellValue && !cellValue.toLowerCase().includes('break')) {
             const timeSlotIndex = j - 1 + (j > 6 ? -1 : 0);
             if (timeSlotIndex >= 0 && timeSlotIndex < timeSlots.length) {
                occupiedSlots.add(timeSlotIndex);
             }
         }
      }

      // Find empty slots
      for (let k = 0; k < timeSlots.length; k++) {
          if (!occupiedSlots.has(k)) {
              result.push({
                  day: day,
                  location: location,
                  time: timeSlots[k]
              });
          }
      }
    }
  });

  return result;
}

// Special Resit upload handler
export async function handleSpecialResitUpload(fileData: string) {
    const fileBuffer = Buffer.from(fileData, 'base64');

    function parseCSVLine(line: string) {
        const regex = /("([^"]*)"|([^,]*))(,|$)/g;
        const columns: string[] = [];
        let match;
        while ((match = regex.exec(line)) !== null) {
            const value = match[2] !== undefined ? match[2] : match[3];
            columns.push(value.trim());
        }
        return columns;
    }

    function extractTimetableData(excelData: string) {
        const timetable: any[] = [];
        const errors: string[] = [];
        
        const headers = ['DATE', 'COURSE NO.', 'COURSE NAME', 'DEPARTMENT', 'NUMBER', 'ROOM', 'EXAMINER', 'SESSION (M/A)'];
        
        const rows = excelData.split('\n').filter(row => row.trim() !== '' && !row.includes('VENUE:') && !row.includes('FOR ANY ISSUES') && !row.includes('MORNING PAPERS') && !row.includes('GM MSC CLASSROOM'));
        
        const headerRowIndex = rows.findIndex(row => row.includes('DATE,COURSE NO.,COURSE NAME'));
        if (headerRowIndex === -1) {
            return { timetable: [], errors: ['Header row not found. Please ensure the file contains the correct headers.'] };
        }
        
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 1;
            
            const columns = parseCSVLine(row);
            
            if (columns.length < headers.length) {
                errors.push(`Row ${rowNumber}: Insufficient columns (expected ${headers.length}, got ${columns.length}).`);
                continue;
            }
            
            const entry: any = {};
            let isValid = true;
            
            headers.forEach((header, index) => {
                let value: string | number = columns[index] || '';
                
                if (header === 'NUMBER') {
                    value = parseInt(value as string, 10);
                    if (isNaN(value) || value <= 0) {
                        errors.push(`Row ${rowNumber}: Invalid NUMBER value (${columns[index]}). Must be a positive integer.`);
                        isValid = false;
                    }
                } else if (header === 'COURSE NO.') {
                    value = value.trim().toUpperCase();
                    if (!/^[A-Z]{2}\s\d{3}$/.test(value)) {
                        errors.push(`Row ${rowNumber}: Invalid COURSE NO. format (${value}). Expected format like "ES 142".`);
                        isValid = false;
                    }
                } else if (header === 'SESSION (M/A)') {
                    value = value.trim().toUpperCase();
                    if (!['M', 'A'].includes(value)) {
                        errors.push(`Row ${rowNumber}: Invalid SESSION value (${value}). Must be 'M' or 'A'.`);
                        isValid = false;
                    }
                } else if (header === 'DATE') {
                    value = value.replace(/th|st/, '').trim();
                    if (!/^\d{1,2}-[A-Z]{3}-\d{4}$/.test(value)) {
                        errors.push(`Row ${rowNumber}: Invalid DATE format (${value}). Expected format like "24-JUL-2025".`);
                        isValid = false;
                    }
                } else {
                    value = value.trim();
                    if (!value && header !== 'EXAMINER') {
                        errors.push(`Row ${rowNumber}: Missing value for ${header}.`);
                        isValid = false;
                    }
                }
                
                entry[header.toLowerCase().replace(/ \(m\/a\)/, '').replace(/ /g, '_')] = value;
            });
            
            if (isValid && entry.course_no && entry.session) {
                timetable.push(entry);
            }
        }
        
        return { timetable, errors: errors.length > 0 ? errors : [] };
    }

    try {
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
            throw new Error("The Excel file is empty or does not contain any sheets.");
        }
        const sheet = workbook.Sheets[firstSheetName];
        const csvData = XLSX.utils.sheet_to_csv(sheet);

        const parsedData = extractTimetableData(csvData);

        if (parsedData.errors.length > 0) {
             throw new Error("Parsing failed with errors: " + parsedData.errors.join('; '));
        }
        
        return parsedData.timetable;

    } catch (error) {
        console.error("Special Resit Parsing failed:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Failed to parse the special resit Excel file.");
    }
}
