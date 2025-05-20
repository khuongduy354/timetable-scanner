import { createWorker, PSM } from "tesseract.js";

export interface TimeRange {
  day: string;
  start: string;
  end: string;
}
export interface ScanResult {
  timeRanges: TimeRange[] | null;
  cleanedOCR: string;
}
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

    // Add validation function
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
    const matches = cleanedText.matchAll(timePattern);

    // for (const m of Array.from(exactMatches)) {
    //   console.log(m);
    //   const index = remainingText.indexOf(m[0]);
    //   if (index !== -1) {
    //     remainingText =
    //       remainingText.substring(0, index) +
    //       remainingText.substring(index + m[0].length);
    //   }
    // }
    console.log(uncleandMatches);

    const dayMap: { [key: string]: string } = {
      T2: "Monday",
      T3: "Tuesday",
      T4: "Wednesday",
      T5: "Thursday",
      T6: "Friday",
      T7: "Saturday",
    };

    const filteredOutMatches: RegExpExecArray[] = [];
    const allMatches = Array.from(matches);
    console.log("Found matches:", allMatches.length);

    // Filter valid times only
    const validMatches = allMatches.filter((match) => {
      if (isValidTime(match[2]) && isValidTime(match[3])) return true;
      filteredOutMatches.push(match);
      return false;
    });

    console.log("Filtered out matches:", filteredOutMatches);

    // Add debug logging

    if (validMatches.length === 0) {
      console.warn("No valid time ranges found");
      return { timeRanges: null, cleanedOCR: cleanedText };
    }

    const results = validMatches.map((match) => {
      // Ensure time format is consistent (add leading zeros if needed)
      const formatTime = (time: string) => {
        const [hours, minutes] = time.split(":").map(Number);
        return `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`;
      };

      const dayKey = match[1] ? `T${match[1]}` : null;
      const timeRange = {
        day: dayKey && dayMap[dayKey] ? dayMap[dayKey] : "Unknown",
        start: formatTime(match[2]),
        end: formatTime(match[3]),
      };
      return timeRange;
    });

    // Before return, add visualization

    return {
      timeRanges: results,
      cleanedOCR: cleanedText,
    };
  } finally {
    await worker.terminate();
  }
}
