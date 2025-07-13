
'use server';

import * as XLSX from 'xlsx';

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

function parseUniversitySchedule(fileBuffer: Buffer) {
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const validSchedules = [];

  for (const day of days) {
    const sheet = workbook.Sheets[day];
    if (!sheet) continue;

    const merges = sheet['!merges'] || [];
    const mergeMap: { [key: string]: { s: any; e: any } } = {};
    for (const merge of merges) {
      for (let r = merge.s.r; r <= merge.e.r; r++) {
        for (let c = merge.s.c; c <= merge.e.c; c++) {
          mergeMap[`${r},${c}`] = merge;
        }
      }
    }

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false }) as (string | number)[][];
    if (rows.length < 5) continue;

    const timeHeaders = rows[4]?.slice(1).map(String) || [];
    const dataRows = rows.slice(5);

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const room = row[0]?.toString().trim();
      if (!room) continue;

      const rowIndexInSheet = i + 5;

      for (let j = 1; j < row.length; j++) {
        const cellValue = row[j]?.toString();
        if (!cellValue || cellValue.toUpperCase().includes('BREAK')) continue;

        const mergeInfo = mergeMap[`${rowIndexInSheet},${j}`];
        if (mergeInfo && (mergeInfo.s.c !== j || mergeInfo.s.r !== rowIndexInSheet)) {
          continue;
        }

        const endColIndex = mergeInfo ? mergeInfo.e.c : j;
        
        let time = "Unknown Time";
        const startTimeString = timeHeaders[j - 1];
        const endTimeString = timeHeaders[endColIndex - 1];

        if (startTimeString && endTimeString) {
          const startTime = startTimeString.split('-')[0]?.trim();
          const endTime = endTimeString.split('-')[1]?.trim();
          if (startTime && endTime) {
            time = `${startTime} - ${endTime}`;
          }
        }
        
        const lines = cellValue.split("\n").map(line => line.trim()).filter(Boolean);
        if (lines.length < 2) continue;

        const lecturerName = lines.pop() || '';
        const courseCode = lines.join(' ');
        
        // Extract departments from the course code string
        const courseParts = courseCode.trim().split(/\s+/);
        const courseNumPart = courseParts.pop() || '';
        const deptStr = courseParts.join(' ');
        const departments = deptStr.split(/[,/ ]+/).map(d => d.trim().replace(/[.-]/g, '')).filter(Boolean);
        if (departments.length === 0 && deptStr.length > 0) {
            departments.push(deptStr);
        }
        if (departments.length === 0) continue;

        // Calculate level: first digit of course number * 100
        const firstDigitMatch = courseCode.match(/\d/);
        const level = firstDigitMatch ? parseInt(firstDigitMatch[0], 10) * 100 : 0;

        validSchedules.push({
          day,
          time,
          room,
          departments,
          level,
          courseCode,
          lecturer: lecturerName
        });

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
