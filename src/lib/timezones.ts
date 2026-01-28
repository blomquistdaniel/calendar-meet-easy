export const TIMEZONES = [
  { value: "Pacific/Honolulu", label: "Hawaii (HST)", offset: "-10:00" },
  { value: "America/Anchorage", label: "Alaska (AKST)", offset: "-09:00" },
  { value: "America/Los_Angeles", label: "Pacific Time (PST)", offset: "-08:00" },
  { value: "America/Denver", label: "Mountain Time (MST)", offset: "-07:00" },
  { value: "America/Chicago", label: "Central Time (CST)", offset: "-06:00" },
  { value: "America/New_York", label: "Eastern Time (EST)", offset: "-05:00" },
  { value: "America/Sao_Paulo", label: "São Paulo (BRT)", offset: "-03:00" },
  { value: "Atlantic/Azores", label: "Azores (AZOT)", offset: "-01:00" },
  { value: "UTC", label: "UTC", offset: "+00:00" },
  { value: "Europe/London", label: "London (GMT)", offset: "+00:00" },
  { value: "Europe/Paris", label: "Paris (CET)", offset: "+01:00" },
  { value: "Europe/Berlin", label: "Berlin (CET)", offset: "+01:00" },
  { value: "Europe/Stockholm", label: "Stockholm (CET)", offset: "+01:00" },
  { value: "Europe/Helsinki", label: "Helsinki (EET)", offset: "+02:00" },
  { value: "Europe/Moscow", label: "Moscow (MSK)", offset: "+03:00" },
  { value: "Asia/Dubai", label: "Dubai (GST)", offset: "+04:00" },
  { value: "Asia/Kolkata", label: "India (IST)", offset: "+05:30" },
  { value: "Asia/Bangkok", label: "Bangkok (ICT)", offset: "+07:00" },
  { value: "Asia/Singapore", label: "Singapore (SGT)", offset: "+08:00" },
  { value: "Asia/Shanghai", label: "China (CST)", offset: "+08:00" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)", offset: "+09:00" },
  { value: "Australia/Sydney", label: "Sydney (AEST)", offset: "+10:00" },
  { value: "Pacific/Auckland", label: "Auckland (NZST)", offset: "+12:00" },
] as const;

export function getTimezoneLabel(value: string): string {
  const tz = TIMEZONES.find((t) => t.value === value);
  return tz ? tz.label : value;
}

export function getBrowserTimezone(): string {
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const match = TIMEZONES.find((t) => t.value === browserTz);
  return match ? match.value : "UTC";
}

/**
 * Parse a 12-hour time string like "10:00 AM" into hours and minutes
 */
function parse12HourTime(timeStr: string): { hours: number; minutes: number } {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return { hours: 0, minutes: 0 };
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  
  return { hours, minutes };
}

/**
 * Format hours and minutes to 12-hour time string
 */
function format12HourTime(hours: number, minutes: number): string {
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Convert a time slot like "10:00 AM - 11:30 AM" from one timezone to another
 */
export function convertTimeSlot(
  timeSlot: string,
  date: string,
  fromTimezone: string,
  toTimezone: string
): string {
  if (fromTimezone === toTimezone) return timeSlot;
  
  // Parse the time slot "10:00 AM - 11:30 AM"
  const parts = timeSlot.split(" - ");
  if (parts.length !== 2) return timeSlot;
  
  const convertTime = (timeStr: string): string => {
    const { hours, minutes } = parse12HourTime(timeStr.trim());
    
    // Create a date in the source timezone
    const dateObj = new Date(`${date}T${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`);
    
    // Get the time string in source timezone
    const sourceFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: fromTimezone,
      hour: "numeric",
      minute: "2-digit",
      hour12: false,
    });
    
    // Get the time string in target timezone
    const targetFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: toTimezone,
      hour: "numeric",
      minute: "2-digit",
      hour12: false,
    });
    
    // Calculate offset difference
    const sourceTime = sourceFormatter.format(dateObj);
    const targetTime = targetFormatter.format(dateObj);
    
    const [sourceH] = sourceTime.split(":").map(Number);
    const [targetH, targetM] = targetTime.split(":").map(Number);
    
    // Adjust by the difference
    const offsetDiff = targetH - sourceH;
    let newHours = hours + offsetDiff;
    
    // Handle day wrap
    if (newHours < 0) newHours += 24;
    if (newHours >= 24) newHours -= 24;
    
    return format12HourTime(newHours, minutes);
  };
  
  try {
    const startConverted = convertTime(parts[0]);
    const endConverted = convertTime(parts[1]);
    return `${startConverted} - ${endConverted}`;
  } catch {
    return timeSlot;
  }
}
