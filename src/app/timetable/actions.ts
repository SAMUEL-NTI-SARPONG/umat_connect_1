

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
        // Format as YYYY-MM-DD for reliable sorting
        dateStr = `${jsDate.y}-${String(jsDate.m).padStart(2, '0')}-${String(jsDate.d).padStart(2, '0')}`;
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

