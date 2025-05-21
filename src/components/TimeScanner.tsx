import { useState, useEffect } from "react";
import {
  extractTimeRange,
  type TimeRange,
} from "../TesseractScanner/extractTimeRange";
import { ImagePreview } from "./ImagePreview";
import { useApp } from "../context/AppContext";

type TimeScannerProps = {
  generateBoxes: (shouldSplitIntoArea: boolean) => void;
};

export const TimeScanner = ({ generateBoxes }: TimeScannerProps) => {
  const {
    timeRanges,
    setTimeRanges,
    cleanedText,
    setCleanedText,
    setTimeRangesByLine,
  } = useApp();
  const [result, setResult] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [shouldSplitIntoArea, setShouldSplitIntoArea] = useState(false);

  const renderCleanedText = () => {
    const scannedCount = timeRanges.length;

    return (
      <div>
        <h3>Cleaned OCR Result:</h3>
        {cleanedText.split("\n").map((line, index) => (
          <div key={index}>
            {timeRanges.some((range) =>
              line.includes(range.start + "-" + range.end)
            ) ? (
              <span style={{ backgroundColor: "yellow" }}>{line}</span>
            ) : (
              line
            )}
          </div>
        ))}
        <div
          style={{
            marginTop: "10px",
            padding: "10px",
            backgroundColor: "#f5f5f5",
            borderRadius: "4px",
          }}
        >
          <p>
            ✅ Successfully scanned {scannedCount} time slots (highlighted in
            yellow)
          </p>
          {scannedCount > 0 && (
            <p>
              ℹ️ Non-highlighted lines might contain times in different formats.
              Consider checking them manually.
            </p>
          )}
        </div>
      </div>
    );
  };

  const processImage = async (file: File) => {
    setResult("Processing...");
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    try {
      const {
        timeRanges: newRanges,
        cleanedOCR,
        timeRangesByLine,
      } = await extractTimeRange(file);
      console.log(timeRangesByLine);
      setCleanedText(cleanedOCR);
      if (newRanges?.length) {
        console.log("Scan successful, found ranges:", newRanges);
        setResult(`✅ Found ${newRanges.length} time slots!`);
        setTimeRanges(newRanges);
        setTimeRangesByLine(timeRangesByLine);
      } else {
        console.log("No time ranges found in scan");
        setResult("❌ No time range found");
        setTimeRanges([]);
        setCleanedText("");
      }
    } catch (error) {
      console.error("OCR failed:", error);
      setResult("❌ Failed to process image");
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
        width: "100%",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "15px",
          marginBottom: "20px",
        }}
      >
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        <p>Or paste an image (Ctrl+V)</p>
      </div>
      <ImagePreview previewUrl={previewUrl} result={result} />
      {cleanedText && (
        <>
          {renderCleanedText()}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginTop: "10px",
            }}
          >
            <input
              type="checkbox"
              id="splitAreas"
              checked={shouldSplitIntoArea}
              onChange={(e) => setShouldSplitIntoArea(e.target.checked)}
            />
            <label htmlFor="splitAreas">Split into separate areas</label>
          </div>
          <button
            onClick={() => generateBoxes(shouldSplitIntoArea)}
            style={{ width: "100%", marginTop: "20px" }}
          >
            Create boxes from scanned OCR
          </button>
        </>
      )}
    </div>
  );
};
