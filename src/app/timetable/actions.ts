
'use server';

import * as XLSX from 'xlsx';

// Define expected days of the week
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Define department initials to validate department codes
const departmentInitials = [
  "MN", "MR", "MC", "EL", "RN", "TC", "PM",
  "CY", "CE", "IS", "SD", "LT", "EC",
  "GM", "GE", "SP", "ES", "LA",
  "PE", "NG", "PG", "RP", "CH"
];

// Main parser function based on the new algorithm
function parseUniversitySchedule(fileBuffer: Buffer) {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const validSchedules = [];

  for (const day of days) {
    const sheet = workbook.Sheets[day];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false }) as string[][];
    // As per the new algorithm, data starts from row 5 (index 4), headers are before that.
    if (rows.length < 5) continue; 

    // Time slots are in row 4 (index 3)
    const timeSlots = rows[3].slice(1);

    // Data starts from row 5 (index 4)
    const dataRows = rows.slice(4);

    for (const row of dataRows) {
      const room = row[0]?.toString().trim();
      if (!room) continue;

      for (let j = 0; j < timeSlots.length; j++) {
        const time = timeSlots[j]?.toString().trim();
        const cell = row[j + 1]; // cell data is offset by 1 because of the room column
        
        if (!cell || typeof cell !== 'string' || !time) continue;

        const lines = cell.split("\n").map(line => line.trim()).filter(Boolean);
        if (lines.length < 2) continue;

        const courseLine = lines[0];
        const lecturerName = lines[lines.length - 1]; // More robustly get lecturer name from last line
        
        // This regex is more flexible and handles various department code formats
        const match = courseLine.match(/^([\w\s,]+?)\s+(\d{3})$/);
        if (!match) continue;

        const deptStr = match[1].trim();
        const courseNum = match[2].trim();

        // This logic correctly splits by comma or space and filters against the valid list.
        const departments = deptStr.split(/[, ]+/)
          .map(d => d.trim())
          .filter(dep => departmentInitials.includes(dep));

        if (departments.length === 0) continue;

        const level = parseInt(courseNum[0], 10) * 100;

        validSchedules.push({
          day,
          time,
          room,
          departments,
          level,
          courseCode: `${deptStr} ${courseNum}`,
          lecturer: lecturerName
        });
      }
    }
  }
  return validSchedules;
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
