
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
    let courseNum = courseParts.pop(); // Remove course number like "158" or "274"
    
    // Check if the removed part is actually the course number
    if (!/^\d{3}$/.test(courseNum ?? '')) {
       courseParts.push(courseNum ?? ''); // it wasn't a course number, put it back
       courseNum = ''; // no valid course number found
    }

    const deptStr = courseParts.join(' ');
    const deptInitials = deptStr.split(/[,/ ]+/).map(d => d.trim().replace(/[.-]/g, '')).filter(Boolean);
    const departments = deptInitials.map(initial => departmentMap.get(initial) || initial);

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
