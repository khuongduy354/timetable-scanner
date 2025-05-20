import { useState, type Dispatch, type SetStateAction } from "react";
import {
  extractTimeRange,
  type TimeRange,
} from "../TesseractScanner/extractTimeRange";

interface TimeScannerProps {
  onTimeRangesUpdate: Dispatch<SetStateAction<TimeRange[]>>;
}

export const TimeScanner = ({ onTimeRangesUpdate }: TimeScannerProps) => {
  const [result, setResult] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setResult("Processing...");
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    try {
      const timeRange = await extractTimeRange(file);
      if (timeRange?.length) {
        setResult("Time ranges found");
        onTimeRangesUpdate(timeRange);
        console.log("Extracted time ranges:", timeRange);
      } else {
        setResult("No time range found");
        onTimeRangesUpdate([]);
      }
    } catch (error) {
      console.error("OCR failed:", error);
      setResult("Failed to process image");
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {previewUrl && (
        <div style={{ marginTop: "1rem" }}>
          <img
            src={previewUrl}
            alt="Preview"
            style={{ maxWidth: "100%", maxHeight: "300px" }}
          />
        </div>
      )}
      <p>{result}</p>
    </div>
  );
};
