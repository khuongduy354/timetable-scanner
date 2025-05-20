import { Calendar, dateFnsLocalizer, type Event } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { type WeeklyCalendar } from "../types/Calendar";
import { type TimeRange } from "../TesseractScanner/extractTimeRange";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarViewProps {
  calendar: WeeklyCalendar;
}

interface CalendarEvent extends Event {
  title: string;
  start: Date;
  end: Date;
}

export const CalendarView = ({ calendar }: CalendarViewProps) => {
  const convertToCalendarEvents = (
    calendar: WeeklyCalendar
  ): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    const currentDate = new Date();
    const currentDay = currentDate.getDay();

    Object.entries(calendar).forEach(([day, data]) => {
      data.timeSlots.forEach((slot: TimeRange) => {
        const dayOffset = getDayOffset(slot.day);
        const eventDate = new Date(currentDate);
        eventDate.setDate(currentDate.getDate() - currentDay + dayOffset);

        const [startHour, startMinute] = slot.start.split(":").map(Number);
        const [endHour, endMinute] = slot.end.split(":").map(Number);

        const start = new Date(eventDate);
        start.setHours(startHour, startMinute);

        const end = new Date(eventDate);
        end.setHours(endHour, endMinute);

        events.push({
          title: "Class",
          start,
          end,
        });
      });
    });
    return events;
  };

  const getDayOffset = (day: string): number => {
    const days = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };
    return days[day as keyof typeof days];
  };

  return (
    <div style={{ height: "500px", margin: "20px" }}>
      <Calendar
        localizer={localizer}
        events={convertToCalendarEvents(calendar)}
        startAccessor="start"
        endAccessor="end"
        defaultView="week"
      />
    </div>
  );
};
