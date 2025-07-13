
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

    // Create a map of merged cells for quick lookup
    const merges = sheet['!merges'] || [];
    const mergeMap: { [key: string]: { s: any; e: any } } = {};
    for (const merge of merges) {
      for (let r = merge.s.r; r <= merge.e.r; r++) {
        for (let c = merge.s.c; c <= merge.e.c; c++) {
          mergeMap[`${r},${c}`] = merge;
        }
      }
    }

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false }) as string[][];
    if (rows.length < 5) continue; 

    // Time slots are in row 5 (index 4) as per user instruction.
    const timeHeaders = rows[4]?.slice(1) || [];

    // Data starts from row 6 (index 5)
    const dataRows = rows.slice(5);

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const room = row[0]?.toString().trim();
      if (!room) continue;

      const rowIndexInSheet = i + 5; // Get the actual row index in the original sheet

      for (let j = 1; j < row.length; j++) {
        const cellValue = row[j];
        if (!cellValue || typeof cellValue !== 'string' || cellValue.toUpperCase().includes('BREAK')) continue;

        const mergeInfo = mergeMap[`${rowIndexInSheet},${j}`];

        // Skip if this cell is part of a merge but not the starting cell of the merge
        if (mergeInfo && (mergeInfo.s.c !== j || mergeInfo.s.r !== rowIndexInSheet)) {
          continue;
        }

        const endColIndex = mergeInfo ? mergeInfo.e.c : j;
        
        let time = "Unknown Time";
        const startTimeString = timeHeaders[j - 1]; // -1 to adjust for 0-based index
        const endTimeString = timeHeaders[endColIndex - 1];
        
        if (startTimeString && endTimeString) {
            const startTime = startTimeString.split('-')[0]?.trim();
            const endTime = endTimeString.split('-')[1]?.trim();
            if(startTime && endTime) {
                time = `${startTime} - ${endTime}`;
            }
        }
        
        const lines = cellValue.split("\n").map(line => line.trim()).filter(Boolean);
        if (lines.length < 2) continue;

        const courseLine = lines[0];
        const lecturerName = lines[lines.length - 1];
        
        // Use a more flexible regex to capture department codes that might have dots or hyphens
        const match = courseLine.match(/^([\w\s,.-]+?)\s+(\d{3})$/);
        if (!match) continue;

        const deptStr = match[1].trim();
        const courseNum = match[2].trim();

        // Validate departments against the known list
        const departments = deptStr.split(/[, ]+/)
          .map(d => d.trim().replace(/[.-]/g, '')) // Normalize by removing dots/hyphens for comparison
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

        // If part of a merge, skip the other columns covered by this merge
        if (mergeInfo) {
          j = mergeInfo.e.c;
        }
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
