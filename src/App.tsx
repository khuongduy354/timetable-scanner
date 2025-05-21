import { useRef, useState, useEffect } from "react";
import DragDrop, { type DragDropHandle } from "./components/DragDrop/index";
import { TimeScanner } from "./components/TimeScanner";
import { type WeeklyCalendar } from "./types/Calendar";
import { type TimeRange } from "./TesseractScanner/extractTimeRange";
import { CalendarView } from "./components/CalendarView";
import { AppProvider, useApp } from "./context/AppContext";

function AppContent() {
  const dragDropRef = useRef<DragDropHandle>(null);
  const {
    timeRangesByLine,
    timeRanges,
    calendarData,
    setCalendarData,
    setAreas,
  } = useApp();
  const [shouldGenerateBoxes, setShouldGenerateBoxes] = useState(false);
  const [visibleSections, setVisibleSections] = useState({
    scanner: true,
    manager: true,
    calendar: true,
  });

  const restoreAllSections = () => {
    setVisibleSections({
      scanner: true,
      manager: true,
      calendar: true,
    });
  };

  useEffect(() => {
    if (shouldGenerateBoxes) {
      if (!dragDropRef.current || !timeRanges.length) {
        console.log("No time ranges or dragDropRef not available");
        setShouldGenerateBoxes(false);
        return;
      }

      try {
        // First, clear the Source area
        setAreas((prev) =>
          prev.map((area) =>
            area.id === "Source" ? { ...area, boxes: [] } : area
          )
        );

        // Then add new boxes
        for (const timeRange of timeRanges) {
          console.log("Adding box for timeRange:", timeRange);
          dragDropRef.current.addBoxToArea("Source", timeRange);
        }
      } catch (error) {
        console.error("Error generating boxes:", error);
      }
      setShouldGenerateBoxes(false);
    }
  }, [shouldGenerateBoxes]);

  const generateBoxes = (shouldSplit: boolean) => {
    if (!dragDropRef.current) return;

    if (!shouldSplit) {
      setShouldGenerateBoxes(true);
      return;
    }

    const namedArea: string[] = [];
    timeRangesByLine.forEach((line) => {
      let areaName = "Untitled";
      const areas = dragDropRef.current.getAreasState();
      let isNameExist =
        areas.find((area) => area.id === areaName) ||
        namedArea.includes(areaName);

      let count = 1;
      while (isNameExist) {
        areaName = `Untitled ${count}`;
        count++;
        isNameExist =
          areas.find((area) => area.id === areaName) ||
          namedArea.includes(areaName);
      }

      dragDropRef.current?.addArea(areaName);
      namedArea.push(areaName);

      for (const timeRange of line) {
        dragDropRef.current?.addBoxToArea(areaName, timeRange);
      }
    });
  };

  const resetCalendar = () => {
    setCalendarData(null);
  };

  const generateCalendar = () => {
    if (!dragDropRef.current) return;

    const areas = dragDropRef.current.getAreasState();
    const calendar: WeeklyCalendar = {
      Monday: { title: "Monday", dayName: "Monday", timeSlots: [] },
      Tuesday: { title: "Tuesday", dayName: "Tuesday", timeSlots: [] },
      Wednesday: { title: "Wednesday", dayName: "Wednesday", timeSlots: [] },
      Thursday: { title: "Thursday", dayName: "Thursday", timeSlots: [] },
      Friday: { title: "Friday", dayName: "Friday", timeSlots: [] },
      Saturday: { title: "Saturday", dayName: "Saturday", timeSlots: [] },
      Sunday: { title: "Sunday", dayName: "Sunday", timeSlots: [] },
    };

    areas.forEach((area) => {
      area.boxes.forEach((box) => {
        const timeRange = { ...box.content, title: area.id || "Untitled" };
        if (timeRange.day && timeRange.day in calendar) {
          calendar[timeRange.day].timeSlots.push(timeRange);
          calendar[timeRange.day].title = area.id || "Untitled"; // Set the title for the calendar
        }
      });
    });

    setCalendarData(calendar);
    return calendar;
  };

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        padding: "20px",
        boxSizing: "border-box",
        margin: 0,
        overflowX: "hidden",
      }}
    >
      <div
        style={{ maxWidth: "700px", margin: "0 auto", marginBottom: "20px" }}
      >
        <button onClick={restoreAllSections} style={{ padding: "5px 10px" }}>
          Restore All Sections
        </button>
      </div>
      <div
        style={{
          width: "100%",
          maxWidth: "700px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          margin: "0 auto",
        }}
      >
        {visibleSections.scanner && (
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              width: "100%",
              backgroundColor: "white",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "sticky",
                top: 0,
                backgroundColor: "white",
                padding: "15px",
                borderBottom: "1px solid #ddd",
                borderRadius: "8px 8px 0 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                zIndex: 1000,
              }}
            >
              <h2 style={{ margin: 0 }}>Image Scanner</h2>
              <button
                onClick={() =>
                  setVisibleSections((prev) => ({ ...prev, scanner: false }))
                }
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "20px",
                  padding: "5px",
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: "15px" }}>
              <TimeScanner generateBoxes={generateBoxes} />
            </div>
          </div>
        )}

        {visibleSections.manager && (
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              width: "100%",
              backgroundColor: "white",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "sticky",
                top: 0,
                backgroundColor: "white",
                padding: "15px",
                borderBottom: "1px solid #ddd",
                borderRadius: "8px 8px 0 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                zIndex: 1000,
              }}
            >
              <h2 style={{ margin: 0 }}>Time Slots Manager</h2>
              <button
                onClick={() =>
                  setVisibleSections((prev) => ({ ...prev, manager: false }))
                }
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "20px",
                  padding: "5px",
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: "15px" }}>
              <DragDrop ref={dragDropRef} />
              <button
                onClick={generateCalendar}
                style={{ width: "100%", marginTop: "10px" }}
              >
                Create Calendar from boxes
              </button>
            </div>
          </div>
        )}

        {calendarData && visibleSections.calendar && (
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              width: "100%",
              backgroundColor: "white",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "sticky",
                top: 0,
                backgroundColor: "white",
                padding: "15px",
                borderBottom: "1px solid #ddd",
                borderRadius: "8px 8px 0 0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                zIndex: 1000,
              }}
            >
              <h2 style={{ margin: 0 }}>Weekly Calendar</h2>
              <button
                onClick={() =>
                  setVisibleSections((prev) => ({ ...prev, calendar: false }))
                }
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "20px",
                  padding: "5px",
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: "15px" }}>
              <CalendarView calendar={calendarData} />
              <button
                onClick={resetCalendar}
                style={{ width: "100%", marginTop: "10px" }}
              >
                Reset Calendar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
