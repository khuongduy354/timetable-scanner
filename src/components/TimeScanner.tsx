import { useState, type Dispatch, type SetStateAction, useEffect } from "react";
import {
  extractTimeRange,
  type TimeRange,
} from "../TesseractScanner/extractTimeRange";

interface TimeScannerProps {
  timeRanges: TimeRange[];
  onTimeRangesUpdate: Dispatch<SetStateAction<TimeRange[]>>;
}

export const TimeScanner = ({
  timeRanges,
  onTimeRangesUpdate,
}: TimeScannerProps) => {
  const [result, setResult] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const [cleanedText, setCleanedText] = useState<string>("");

  const renderCleanedText = () => {
    return (
      <div>
        <h3>Cleaned OCR Result:</h3>
        {cleanedText.split("\n").map((line, index) => (
          <div key={index}>
            {/* if line contain one of element in time ranges, highlight it */}
            {timeRanges.some((range) => line.includes(range.start)) ? (
              <span style={{ backgroundColor: "yellow" }}>{line}</span>
            ) : (
              line
            )}
          </div>
        ))}
      </div>
    );
  };

  const processImage = async (file: File) => {
    setResult("Processing...");
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    try {
      const { timeRanges, cleanedOCR } = await extractTimeRange(file);
      setCleanedText(cleanedOCR);
      if (timeRanges?.length) {
        setResult("Time ranges found: " + timeRanges.length);
        onTimeRangesUpdate(timeRanges);
        console.log("Extracted time ranges:", timeRanges);
      } else {
        setResult("No time range found");
        onTimeRangesUpdate([]);
        setCleanedText("");
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
      {cleanedText && renderCleanedText()}
    </div>
  );
};
