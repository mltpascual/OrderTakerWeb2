/**
 * Global date format utility
 * Formats dates as "Sun, Feb 22 at 2:30 PM"
 */

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Formats a date string (YYYY-MM-DD) and optional time string (HH:mm)
 * into the global display format: "Sun, Feb 22 at 2:30 PM"
 * If no time is provided, returns just "Sun, Feb 22"
 */
export function formatDisplayDate(dateStr: string, timeStr?: string): string {
  if (!dateStr) return "";

  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  const dayOfWeek = DAY_NAMES[date.getDay()];
  const monthName = MONTH_NAMES[date.getMonth()];
  const dayNum = date.getDate();

  let result = `${dayOfWeek}, ${monthName} ${dayNum}`;

  if (timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    result += ` at ${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  }

  return result;
}
