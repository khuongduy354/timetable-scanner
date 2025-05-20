import { createWorker } from "tesseract.js";

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
      tessedit_char_whitelist:
        "0123456789:-hH TtHBSCNa.ABCDEFGHIJKLMNOPQRSTUVWXYZ()I ",
    });

    const {
      data: { text },
    } = await worker.recognize(imageFile);

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

    // Updated pattern to be more permissive
    const timePattern =
      /(?:T)?([2-7])\s*(\d{1,2}[:.]?\d{2})[:.]?\s*[-]?\s*(\d{1,2}[:.]?\d{2})/gi;
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
    console.log(
      "Matches:",
      allMatches.map((m) => `${m[1] ? "T" + m[1] : ""} ${m[2]}-${m[3]}`)
    );

    return allMatches.map((match) => ({
      day: match[1]
        ? dayMap[`T${match[1].toUpperCase()}`] || `T${match[1]}`
        : "Unknown",
      start: match[2],
      end: match[3],
    }));
  } finally {
    await worker.terminate();
  }
}
