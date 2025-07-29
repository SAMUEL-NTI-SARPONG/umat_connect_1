

'use server';

import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { departmentMap } from '@/lib/data';

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

// Function to normalize and tokenize a name
function normalizeAndTokenizeName(name: string | null) {
    if (!name || typeof name !== 'string' || name.trim().toLowerCase() === 'department, gm') {
      return null; // Skip invalid names
    }
  
    // Normalize: lowercase, remove extra spaces, remove punctuation
    let normalized = name.trim().toLowerCase().replace(/[\.,]/g, '').replace(/\s+/g, ' ');
    
    // Tokenize: split by spaces or commas
    let tokens = normalized.split(/[\s,]+/).filter(token => token.length > 0);
    
    // Handle formats: "surname, firstname [initials]" or "firstname surname"
    let surname = '', firstName = '', middleInitials: string[] = [];
    if (name.includes(',')) {
      // Format: "surname, firstname [initials]"
      surname = tokens[0] || '';
      firstName = tokens[1] || '';
      middleInitials = tokens.slice(2);
    } else {
      // Format: "firstname surname" or "surname initials"
      surname = tokens[tokens.length - 1] || '';
      firstName = tokens[0] || '';
      middleInitials = tokens.slice(1, -1);
    }
  
    // Determine if tokens are full names or initials
    const components: { type: 'name' | 'initial', value: string }[] = [];
    if (surname.length > 1) components.push({ type: 'name', value: surname });
    if (firstName.length > 1) components.push({ type: 'name', value: firstName });
    middleInitials.forEach(initial => {
      if (initial.length === 1) components.push({ type: 'initial', value: initial });
      else if (initial.length > 1) components.push({ type: 'name', value: initial });
    });
  
    return {
      original: name,
      normalized: normalized.replace(/\s/g, ''),
      surname,
      firstName,
      middleInitials,
      components,
      variants: [
        normalized.replace(/\s/g, ''), // e.g., "dumenyajamesk"
        `${surname}${firstName}`.replace(/\s/g, ''), // e.g., "dumenyajames"
        ...middleInitials.map(initial => `${surname}${initial}`.replace(/\s/g, '')) // e.g., "dumenyak"
      ].filter(v => v.length > 0)
    };
  }
  
  // Function to check if two names match based on the "two names or name and initial" rule
  function namesMatch(nameData1: any, nameData2: any) {
    if (!nameData1 || !nameData2) return false;
  
    const components1 = nameData1.components;
    const components2 = nameData2.components;
  
    // Count matching components (full names or initials)
    let matches = 0;
    const matchedValues = new Set();
  
    for (const comp1 of components1) {
      for (const comp2 of components2) {
        if (matchedValues.has(comp1.value) || matchedValues.has(comp2.value)) continue;
  
        if (comp1.type === 'name' && comp2.type === 'name' && comp1.value === comp2.value) {
          matches++;
          matchedValues.add(comp1.value);
        } else if (
          (comp1.type === 'name' && comp2.type === 'initial' && comp1.value.startsWith(comp2.value)) ||
          (comp2.type === 'name' && comp1.type === 'initial' && comp2.value.startsWith(comp1.value))
        ) {
          matches++;
          matchedValues.add(comp1.value);
          matchedValues.add(comp2.value);
        }
      }
    }
  
    // Require at least two full names or one full name and one initial
    return matches >= 2 || (matches === 1 && components1.some((c: any) => c.type === 'name') && components2.some((c: any) => c.type === 'name'));
  }
  
  // Function to distribute courses to lecturers
  function distributeCourses(entries: any[]) {
    const nameIndex = new Map();
    const lecturerCourses = new Map();
  
    for (const entry of entries) {
      const nameData = normalizeAndTokenizeName(entry.examiner);
  
      if (!nameData) {
        // Handle invalid examiners by using their original name as the key
        const originalExaminer = entry.examiner || 'Unassigned';
        if (!lecturerCourses.has(originalExaminer)) {
          lecturerCourses.set(originalExaminer, {
            lecturer: originalExaminer,
            courses: [],
          });
        }
        lecturerCourses.get(originalExaminer).courses.push({ ...entry, examiner: entry.examiner });
        continue;
      }
  
      // Try to find a matching lecturer
      let matchedName = null;
      for (const variant of nameData.variants) {
        if (nameIndex.has(variant)) {
          const existingData = nameIndex.get(variant);
          if (namesMatch(nameData, existingData)) {
            matchedName = existingData.normalized;
            break;
          }
        }
      }
  
      // If no direct match, check all indexed names
      if (!matchedName) {
        for (const [existingVariant, existingData] of nameIndex) {
          if (namesMatch(nameData, existingData)) {
            matchedName = existingData.normalized;
            break;
          }
        }
      }
  
      // If still no match, add as new lecturer
      if (!matchedName) {
        matchedName = nameData.normalized;
        nameData.variants.forEach(variant => {
          nameIndex.set(variant, nameData);
        });
      }
  
      // Initialize lecturer's course array if not exists
      if (!lecturerCourses.has(matchedName)) {
        lecturerCourses.set(matchedName, {
          lecturer: nameData.original,
          courses: []
        });
      }
      
      // Add course to lecturer's courses
      lecturerCourses.get(matchedName).courses.push({ ...entry, examiner: entry.examiner });
    }
  
    // Convert to array for output
    const result = Array.from(lecturerCourses.values());
  
    // Sort lecturers alphabetically
    result.sort((a, b) => a.lecturer.localeCompare(b.lecturer));
  
    return result;
  }
  
/**
 * Extracts timetable data from an Excel file with a structure similar to the provided example.
 * @param {Buffer} fileBuffer - The uploaded Excel file buffer.
 * @returns {Object} - Structured JSON object containing timetable data.
 */
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
      // Basic validation: ensure at least the first cell (date) is not empty.
      if (!row[0] || (typeof row[0] === 'string' && row[0].trim() === '') || (typeof row[0] === 'string' && row[0].toUpperCase().includes('FOR ANY ISSUES'))) {
        continue;
      }

      let dateStr;
      if(typeof row[0] === 'number') {
        const jsDate = XLSX.SSF.parse_date_code(row[0]);
        // Format as DD-MM-YYYY for reliable matching
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
        session: row[7] || null
      };

      // Push even if some fields are null, as distribution will handle it
      entries.push(entry);
    }

    const distributedData = distributeCourses(entries);

    return {
      venue,
      isDistributed: false,
      sheets: [{
          sheetName: "Distributed",
          entries: distributedData
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
      .map(initial => departmentMap.get(initial) || initial)
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
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const timetableData: any[] = [];
    let idCounter = 10000; // Start with a high number to avoid ID collision
  
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
