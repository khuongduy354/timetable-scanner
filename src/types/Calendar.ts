import { type TimeRange } from "../TesseractScanner/extractTimeRange";

export interface DaySchedule {
  dayName: string;
  timeSlots: TimeRange[];
}

export interface WeeklyCalendar {
  [key: string]: DaySchedule;
}
