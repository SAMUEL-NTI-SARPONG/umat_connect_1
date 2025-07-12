
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

// Main parser function
function parseUniversitySchedule(fileBuffer: Buffer) {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const validSchedules = [];

  for (const day of days) {
    const sheet = workbook.Sheets[day];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
    if (rows.length < 2) continue;

    const timeSlots = rows[0].slice(1); // Skip the "Room" header

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const room = row[0]?.toString().trim();
      if (!room) continue;

      for (let j = 1; j <= timeSlots.length; j++) {
        const cell = row[j];
        const time = timeSlots[j - 1]?.toString().trim();
        if (!cell || typeof cell !== 'string' || !time) continue;

        const lines = cell.split("\n").map(line => line.trim()).filter(Boolean);
        if (lines.length < 2) continue;

        const courseLine = lines[0];
        const lecturerName = lines[lines.length - 1]; // Assume lecturer is the last line

        const match = courseLine.match(/^([A-Z, ]+)\s+(\d{3})$/);
        if (!match) continue;

        const deptStr = match[1].trim();
        const courseNum = match[2].trim();

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
    return parsedData;
  } catch (error) {
    console.error("Parsing failed:", error);
    throw new Error("Failed to parse the Excel file. Please ensure it is in the correct format.");
  }
}
