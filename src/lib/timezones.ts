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
