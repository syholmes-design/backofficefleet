/**
 * Date utility functions for Excel serial date conversion
 */

/**
 * Convert Excel serial date number to ISO date string (YYYY-MM-DD)
 * Excel dates start at 1900-01-01, but Excel incorrectly treats 1900 as a leap year
 * So we need to adjust for this bug
 */
export function excelSerialToIsoDate(serialDate: number | string): string {
  if (!serialDate) return '';
  
  const serial = typeof serialDate === 'string' ? parseFloat(serialDate) : serialDate;
  if (isNaN(serial) || serial < 1) return '';
  
  // Excel's epoch is 1900-01-01, but Excel incorrectly thinks 1900 is a leap year
  // So we adjust by 1 day for dates after 1900-02-28
  const adjustedSerial = serial > 59 ? serial - 1 : serial;
  
  // Excel's epoch in milliseconds (1900-01-01)
  const excelEpoch = new Date(1900, 0, 1).getTime();
  
  // Convert serial days to milliseconds and add to epoch
  const dateMs = excelEpoch + (adjustedSerial * 24 * 60 * 60 * 1000);
  
  const date = new Date(dateMs);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return '';
  
  return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
}

/**
 * Convert Excel serial date to readable display format (May 17, 2026)
 */
export function excelSerialToDisplayDate(serialDate: number | string): string {
  const isoDate = excelSerialToIsoDate(serialDate);
  if (!isoDate) return '';
  
  const date = new Date(isoDate + 'T00:00:00');
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Convert ISO date string (YYYY-MM-DD) to readable display format
 */
export function isoToDisplayDate(isoDate: string): string {
  if (!isoDate) return '';
  
  const date = new Date(isoDate + 'T00:00:00');
  if (isNaN(date.getTime())) return isoDate; // Return original if invalid
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Parse various date formats and return ISO date string
 * Handles Excel serial numbers, ISO strings, and other common formats
 */
export function parseToDate(dateValue: string | number | null | undefined): string {
  if (!dateValue) return '';
  
  // Handle Excel serial numbers
  if (typeof dateValue === 'number' || (typeof dateValue === 'string' && /^\d+(\.\d+)?$/.test(dateValue))) {
    return excelSerialToIsoDate(dateValue);
  }
  
  // Handle string dates
  const strValue = String(dateValue).trim();
  if (!strValue) return '';
  
  // If already in ISO format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(strValue)) {
    return strValue;
  }
  
  // Try to parse as Date object
  const date = new Date(strValue);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  // If all else fails, return empty string
  return '';
}

/**
 * Format date for display (readable format)
 */
export function formatDisplayDate(dateValue: string | number | null | undefined): string {
  const isoDate = parseToDate(dateValue);
  return isoToDisplayDate(isoDate);
}
