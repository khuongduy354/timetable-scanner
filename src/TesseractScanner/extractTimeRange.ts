import { createWorker, PSM } from "tesseract.js";

export interface TimeRange {
  day: string;
  start: string;
  end: string;
}
export interface ScanResult {
  timeRanges: TimeRange[];
  cleanedOCR: string;
  timeRangesByLine: TimeRange[][];
}

const isValidTime = (time: string): boolean => {
  const [hours, minutes] = time.split(":").map(Number);
  return (
    !isNaN(hours) &&
    !isNaN(minutes) &&
    hours >= 0 &&
    hours <= 23 &&
    minutes >= 0 &&
    minutes <= 59
  );
};

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
};

export const dayMap: { [key: string]: string } = {
  T2: "Monday",
  T3: "Tuesday",
  T4: "Wednesday",
  T5: "Thursday",
  T6: "Friday",
  T7: "Saturday",
};

export async function extractTimeRange(imageFile: File): Promise<ScanResult> {
  const worker = await createWorker("eng");

  try {
    // Configure tesseract to look for numbers, letters, and common time separators
    await worker.setParameters({
      tessedit_char_whitelist: "0123456789T:-", // Only essential characters
      tessjs_create_pdf: "0",
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK, // Back to simple block mode
      tessedit_ocr_engine_mode: "3",
      preserve_interword_spaces: "1",
    });

    const {
      data: { text },
    } = await worker.recognize(imageFile, {});

    // Clean up text by removing unwanted spaces and normalizing time formats
    const cleanedText = text
      // Preserve newlines by temporarily replacing them
      .replace(/\n/g, "{{NEWLINE}}")
      .replace(/\s+/g, " ")
      .replace(/(\d)(?=[A-Z])/g, "$1 ")
      .replace(/[hH]/g, ":")
      // Convert any sequence of : or . to a single :
      .replace(/[:\.]+/g, ":")
      // First split potential time ranges (153017:10 -> 15:30-17:10)
      .replace(/(\d{2})(\d{2})(\d{2})[:]?(\d{2})/g, "$1:$2-$3:$4")
      // Then handle single times (1530 -> 15:30)
      .replace(/(\d{2})(\d{2}(?!\d))/g, "$1:$2")
      // Finally separate day markers
      .replace(/([T][2-7])(\d)/g, "$1 $2")
      // Restore newlines
      .replace(/{{NEWLINE}}/g, "\n");

    console.log("Original OCR Result:", text);
    console.log("Cleaned OCR Result:", cleanedText);

    // Updated pattern to make day part optional
    const timePattern =
      /(?:T([2-7]))?\s*(\d{1,2}[:.]?\d{2})[:.]?\s*[-]?\s*(\d{1,2}[:.]?\d{2})/gi;
    const uncleandMatches = Array.from(text.matchAll(timePattern));
    const matchesByLine = cleanedText
      .split("\n")
      .map((line) => Array.from(line.matchAll(timePattern)));

    console.log(uncleandMatches);

    const filteredOutMatches: RegExpExecArray[] = [];
    let validMatchesByLine = matchesByLine.map((lineMatches) => {
      const arr = lineMatches.filter((match) => {
        if (isValidTime(match[2]) && isValidTime(match[3])) return true;
        filteredOutMatches.push(match);
        return false;
      });
      if (arr.length === 0) return undefined;
      return arr;
    });
    validMatchesByLine = validMatchesByLine.filter(
      (line) => line !== undefined
    );

    const validMatches = validMatchesByLine.flat();
    console.log("Found matches:", validMatches.length);
    console.log("Filtered out matches:", filteredOutMatches);

    if (validMatches.length === 0) {
      console.warn("No valid time ranges found");
      return {
        timeRanges: [],
        cleanedOCR: cleanedText,
        timeRangesByLine: [],
      };
    }

    const results = validMatches.map((match) => {
      const dayKey = match[1] ? `T${match[1]}` : null;
      const timeRange = {
        day: dayKey && dayMap[dayKey] ? dayMap[dayKey] : "Unknown",
        start: formatTime(match[2]),
        end: formatTime(match[3]),
      };
      return timeRange;
    });

    const timeRangesByLine = validMatchesByLine.map((lineMatches) =>
      lineMatches.map((match) => {
        const dayKey = match[1] ? `T${match[1]}` : null;
        const timeRange = {
          day: dayKey && dayMap[dayKey] ? dayMap[dayKey] : "Unknown",
          start: formatTime(match[2]),
          end: formatTime(match[3]),
        };
        return timeRange;
      })
    );

    // Before return, add visualization

    return {
      timeRanges: results,
      cleanedOCR: cleanedText,
      timeRangesByLine,
    };
  } finally {
    await worker.terminate();
  }
}
