import { useState, type Dispatch, type SetStateAction, useEffect } from "react";
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

  const processImage = async (file: File) => {
    setResult("Processing...");
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processImage(file);
  };

  const handlePaste = async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image")) {
        const file = item.getAsFile();
        if (file) {
          await processImage(file);
          break;
        }
      }
    }
  };

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      <p>Or paste an image (Ctrl+V)</p>
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
