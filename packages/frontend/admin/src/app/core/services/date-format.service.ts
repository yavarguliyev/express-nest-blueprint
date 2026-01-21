import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DateFormatService {
  private readonly userLocale: string;
  private readonly userTimezone: string;

  constructor () {
    this.userLocale = navigator.language || 'en-US';
    this.userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  formatForTable (dateValue: string | Date | null | undefined): string {
    if (!dateValue) return '-';

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'Invalid Date';

      return new Intl.DateTimeFormat(this.userLocale, {
        timeZone: this.userTimezone,
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(date);
    } catch {
      return 'Invalid Date';
    }
  }

  formatDetailed (dateValue: string | Date | null | undefined): string {
    if (!dateValue) return 'Not set';

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'Invalid Date';

    return new Intl.DateTimeFormat(this.userLocale, {
      timeZone: this.userTimezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  }

  formatRelative (dateValue: string | Date | null | undefined): string {
    if (!dateValue) return '-';

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'Invalid Date';

      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      const rtf = new Intl.RelativeTimeFormat(this.userLocale, { numeric: 'auto' });

      const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 },
      ];

      for (const interval of intervals) {
        const count = Math.floor(Math.abs(diffInSeconds) / interval.seconds);
        if (count >= 1) {
          return rtf.format(
            diffInSeconds > 0 ? -count : count,
            interval.label as Intl.RelativeTimeFormatUnit,
          );
        }
      }

      return rtf.format(0, 'second');
    } catch {
      return 'Invalid Date';
    }
  }

  formatDateOnly (dateValue: string | Date | null | undefined): string {
    if (!dateValue) return '-';

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'Invalid Date';

    return new Intl.DateTimeFormat(this.userLocale, {
      timeZone: this.userTimezone,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  formatTimeOnly (dateValue: string | Date | null | undefined): string {
    if (!dateValue) return '-';

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'Invalid Date';

    return new Intl.DateTimeFormat(this.userLocale, {
      timeZone: this.userTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  }

  isToday (dateValue: string | Date | null | undefined): boolean {
    if (!dateValue) return false;

    try {
      const date = new Date(dateValue);
      const today = new Date();

      return date.toDateString() === today.toDateString();
    } catch {
      return false;
    }
  }

  isRecent (dateValue: string | Date | null | undefined): boolean {
    if (!dateValue) return false;

    try {
      const date = new Date(dateValue);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      return diffInHours >= 0 && diffInHours <= 24;
    } catch {
      return false;
    }
  }

  getUserInfo (): { locale: string; timezone: string } {
    return {
      locale: this.userLocale,
      timezone: this.userTimezone,
    };
  }
}
