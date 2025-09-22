/**
 * Timezone utility functions for consistent time handling
 * across local and production environments
 */

export const TIMEZONE = 'Asia/Jakarta';

/**
 * Get current time in WIB timezone
 */
export function getCurrentTimeWIB(): Date {
  return new Date();
}

/**
 * Format date to WIB string
 */
export function formatToWIB(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('id-ID', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Calculate time difference in milliseconds
 * Ensures consistent calculation regardless of timezone
 */
export function getTimeDifferenceMs(startTime: string | Date, endTime?: Date): number {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = endTime || new Date();
  
  return end.getTime() - start.getTime();
}

/**
 * Calculate remaining time for test timer
 */
export function calculateRemainingTime(startTime: string, durationMinutes: number): number {
  // Parse startTime as Asia/Jakarta timezone
  const startDate = new Date(startTime);
  const startMs = startDate.getTime();
  
  const durationMs = durationMinutes * 60 * 1000;
  const endMs = startMs + durationMs;
  
  // Get current time in Asia/Jakarta timezone
  const nowWIB = getCurrentTimeWIB();
  const now = nowWIB.getTime();
  
  return Math.max(0, Math.floor((endMs - now) / 1000));
}

/**
 * Format seconds to readable time format
 */
export function formatTimeRemaining(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Check if current time is within test period
 */
export function isWithinTestPeriod(availableFrom: string | null, availableUntil: string | null): boolean {
  const now = new Date();
  
  if (availableFrom && new Date(availableFrom) > now) {
    return false;
  }
  
  if (availableUntil && new Date(availableUntil) < now) {
    return false;
  }
  
  return true;
}