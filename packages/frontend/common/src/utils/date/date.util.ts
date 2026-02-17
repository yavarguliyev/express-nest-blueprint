export class DateUtil {
  static format (date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('yyyy', String(year))
      .replace('MM', month)
      .replace('dd', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  static parse (dateString: string, format: string): Date {
    const formatParts = format.split(/[-/\s:]/);
    const dateParts = dateString.split(/[-/\s:]/);

    const yearIndex = formatParts.indexOf('yyyy');
    const monthIndex = formatParts.indexOf('MM');
    const dayIndex = formatParts.indexOf('dd');

    const year = yearIndex >= 0 ? parseInt(dateParts[yearIndex], 10) : new Date().getFullYear();
    const month = monthIndex >= 0 ? parseInt(dateParts[monthIndex], 10) - 1 : 0;
    const day = dayIndex >= 0 ? parseInt(dateParts[dayIndex], 10) : 1;

    return new Date(year, month, day);
  }

  static addDays (date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static diffDays (date1: Date, date2: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000;
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
    return Math.floor((utc2 - utc1) / msPerDay);
  }

  static isToday (date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }

  static isWeekend (date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  static startOfDay (date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  static endOfDay (date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }
}
