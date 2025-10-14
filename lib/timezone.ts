/**
 * Timezone utility functions for consistent time handling
 * across local and production environments
 */

export const TIMEZONE = "Asia/Jakarta";

/**
 * Get current time in WIB (Asia/Jakarta timezone)
 */
export function getCurrentTimeWIB(): Date {
  // Create a date object that represents the current time in Asia/Jakarta
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const jakartaOffset = 7 * 60 * 60000; // UTC+7 in milliseconds
  return new Date(utc + jakartaOffset);
}

/**
 * Format date to WIB string
 */
export function formatToWIB(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleString("id-ID", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Calculate time difference in milliseconds
 * Ensures consistent calculation regardless of timezone
 */
export function getTimeDifferenceMs(
  startTime: string | Date,
  endTime?: Date
): number {
  const start = typeof startTime === "string" ? new Date(startTime) : startTime;
  const end = endTime || new Date();

  return end.getTime() - start.getTime();
}

/**
 * Calculate remaining time for test timer
 */
export function calculateRemainingTime(
  startTime: string,
  durationMinutes: number
): number {
  // Base calculation using parsed date from server and client current time
  const startMs = new Date(startTime).getTime();
  const durationMs = Math.max(0, durationMinutes) * 60 * 1000;
  const now = Date.now();
  let remainingSec = Math.max(
    0,
    Math.floor((startMs + durationMs - now) / 1000)
  );

  // Guard against timezone skew when DB stores WIB (UTC+7) as timestamp without tz
  // but it gets serialized as UTC (adds +7h). In that case remaining > duration.
  const durationSec = Math.floor(durationMs / 1000);
  if (durationSec > 0 && remainingSec > durationSec) {
    // Adjust by subtracting WIB offset (7h) from start time if it brings remaining within duration
    const WIB_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7, no DST
    const adjustedRemaining = Math.max(
      0,
      Math.floor((startMs - WIB_OFFSET_MS + durationMs - now) / 1000)
    );
    if (adjustedRemaining <= durationSec) {
      remainingSec = adjustedRemaining;
    }
  }

  return remainingSec;
}

/**
 * Format seconds to readable time format
 */
export function formatTimeRemaining(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Check if current time is within test period
 */
export function isWithinTestPeriod(
  availableFrom: string | null,
  availableUntil: string | null
): boolean {
  const now = new Date();

  if (availableFrom && new Date(availableFrom) > now) {
    return false;
  }

  if (availableUntil && new Date(availableUntil) < now) {
    return false;
  }

  return true;
}
