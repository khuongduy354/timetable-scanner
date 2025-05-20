import { createWorker, PSM } from "tesseract.js";

export interface TimeRange {
  day: string;
  start: string;
  end: string;
}

export async function extractTimeRange(
  imageFile: File
): Promise<TimeRange[] | null> {
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
    } = await worker.recognize(imageFile);

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
      .replace(/([T][2-7])(\d)/g, "$1 $2");

    console.log("Cleaned OCR Result:", cleanedText);

    // Updated pattern to make day part optional
    const timePattern =
      /(?:T([2-7]))?\s*(\d{1,2}[:.]?\d{2})[:.]?\s*[-]?\s*(\d{1,2}[:.]?\d{2})/gi;
    const matches = cleanedText.matchAll(timePattern);

    const dayMap: { [key: string]: string } = {
      T2: "Monday",
      T3: "Tuesday",
      T4: "Wednesday",
      T5: "Thursday",
      T6: "Friday",
      T7: "Saturday",
    };

    const allMatches = Array.from(matches);
    console.log("Found matches:", allMatches.length);

    // Filter valid times only
    const validMatches = allMatches.filter(
      (match) => isValidTime(match[2]) && isValidTime(match[3])
    );

    // Add debug logging
    console.log("Valid matches raw:", validMatches);

    if (validMatches.length === 0) {
      console.warn("No valid time ranges found");
      return null;
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
      console.log("Processed time range:", timeRange);
      return timeRange;
    });

    console.log("Final results:", results);
    return results;
  } finally {
    await worker.terminate();
  }
}
