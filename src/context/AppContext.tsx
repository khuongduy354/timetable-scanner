import { createContext, useContext, useState, useEffect } from "react";
import type { Dispatch, ReactNode } from "react";
import { type TimeRange } from "../TesseractScanner/extractTimeRange";
import { type WeeklyCalendar } from "../types/Calendar";
import { type Area } from "../types/DragDrop";

interface AppContextType {
  timeRanges: TimeRange[];
  setTimeRanges: (ranges: TimeRange[]) => void;
  activeTab: "scanner" | "manager";
  setActiveTab: (tab: "scanner" | "manager") => void;
  calendarData: WeeklyCalendar | null;
  setCalendarData: (data: WeeklyCalendar | null) => void;
  areas: Area[];
  setAreas: Dispatch<React.SetStateAction<Area[]>>;
  cleanedText: string;
  setCleanedText: (text: string) => void;
  timeRangesByLine: TimeRange[][];
  setTimeRangesByLine: (ranges: TimeRange[][]) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};

const saveToStorage = <T,>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>(() =>
    loadFromStorage("timeRanges", [])
  );
  const [timeRangesByLine, setTimeRangesByLine] = useState<TimeRange[][]>(() =>
    loadFromStorage("timeRangesByLine", [])
  );
  const [activeTab, setActiveTab] = useState<"scanner" | "manager">(() =>
    loadFromStorage("activeTab", "manager")
  );
  const [calendarData, setCalendarData] = useState<WeeklyCalendar | null>(() =>
    loadFromStorage("calendarData", null)
  );
  const [areas, setAreas] = useState<Area[]>(() =>
    loadFromStorage("areas", [
      {
        id: "Source",
        boxes: [],
      },
    ])
  );
  const [cleanedText, setCleanedText] = useState("");

  // Persist state changes to localStorage
  useEffect(() => {
    saveToStorage("timeRanges", timeRanges);
  }, [timeRanges]);

  useEffect(() => {
    saveToStorage("activeTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    saveToStorage("calendarData", calendarData);
  }, [calendarData]);

  useEffect(() => {
    saveToStorage("areas", areas);
  }, [areas]);

  return (
    <AppContext.Provider
      value={{
        timeRanges,
        setTimeRanges,
        activeTab,
        setActiveTab,
        calendarData,
        setCalendarData,
        areas,
        setAreas,
        cleanedText,
        setCleanedText,
        setTimeRangesByLine,
        timeRangesByLine,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
