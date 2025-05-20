import { useRef, useState } from "react";
import DragDrop, { type DragDropHandle } from "./components/DragDrop";
import { TimeScanner } from "./components/TimeScanner";
import { type WeeklyCalendar } from "./types/Calendar";
import { type TimeRange } from "./TesseractScanner/extractTimeRange";
import { CalendarView } from "./components/CalendarView";

function App() {
  const dragDropRef = useRef<DragDropHandle>(null);
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([]);
  const [calendarData, setCalendarData] = useState<WeeklyCalendar | null>(null);

  const addNewBox = (source: string, content: TimeRange) => {
    if (dragDropRef.current) {
      dragDropRef.current.addBoxToArea(source, content);
    } else {
      console.error("DragDrop ref is not set");
    }
  };

  const generateCalendar = () => {
    if (!dragDropRef.current) return;

    const areas = dragDropRef.current.getAreasState();
    const calendar: WeeklyCalendar = {
      Monday: { dayName: "Monday", timeSlots: [] },
      Tuesday: { dayName: "Tuesday", timeSlots: [] },
      Wednesday: { dayName: "Wednesday", timeSlots: [] },
      Thursday: { dayName: "Thursday", timeSlots: [] },
      Friday: { dayName: "Friday", timeSlots: [] },
      Saturday: { dayName: "Saturday", timeSlots: [] },
      Sunday: { dayName: "Sunday", timeSlots: [] },
    };

    areas.forEach((area) => {
      area.boxes.forEach((box) => {
        const timeRange = box.content;
        if (timeRange.day && timeRange.day in calendar) {
          calendar[timeRange.day].timeSlots.push(timeRange);
        }
      });
    });

    setCalendarData(calendar);
    return calendar;
  };

  const generateBoxes = () => {
    for (const timeRange of timeRanges) {
      addNewBox("Source", timeRange);
    }
    console.log("Boxes generated from scanned OCR");
  };

  return (
    <div>
      <TimeScanner onTimeRangesUpdate={setTimeRanges} timeRanges={timeRanges} />
      <button onClick={generateBoxes}>Create boxes from scanned OCR</button>
      <p>Drag and drop functionality will be implemented here.</p>
      <DragDrop ref={dragDropRef} />
      <button onClick={generateCalendar}>Create Calendar from boxes</button>
      {calendarData && <CalendarView calendar={calendarData} />}
    </div>
  );
}

export default App;
