import { Injectable } from '@angular/core';

/**
 * Centralized Date Formatting Service
 * 
 * This service provides consistent date/time formatting across the entire application
 * using the user's browser locale and timezone.
 * 
 * Features:
 * - Automatic timezone detection from browser
 * - Locale-aware formatting
 * - Multiple format options (short, medium, long)
 * - Relative time formatting (e.g., "2 hours ago")
 * - Null/undefined handling
 */
@Injectable({
  providedIn: 'root'
})
export class DateFormatService {
  
  private readonly userLocale: string;
  private readonly userTimezone: string;

  constructor () {
    // Get user's locale from browser (e.g., 'en-US', 'tr-TR', 'de-DE')
    this.userLocale = navigator.language || 'en-US';
    
    // Get user's timezone from browser (e.g., 'America/New_York', 'Europe/Istanbul')
    this.userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * Format date for table display (compact format)
   * Example: "Jan 19, 14:30"
   */
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
        hour12: false
      }).format(date);
    } catch {
      console.warn('Date formatting error');
      return 'Invalid Date';
    }
  }

  /**
   * Format date for detailed view (full format)
   * Example: "January 19, 2026 at 2:30 PM"
   */
  formatDetailed (dateValue: string | Date | null | undefined): string {
    if (!dateValue) return 'Not set';
    
    try {
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
        timeZoneName: 'short'
      }).format(date);
    } catch {
      console.warn('Date formatting error');
      return 'Invalid Date';
    }
  }

  /**
   * Format relative time (e.g., "2 hours ago", "in 3 days")
   */
  formatRelative (dateValue: string | Date | null | undefined): string {
    if (!dateValue) return '-';
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      // Use Intl.RelativeTimeFormat for proper localization
      const rtf = new Intl.RelativeTimeFormat(this.userLocale, { numeric: 'auto' });
      
      const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 }
      ];
      
      for (const interval of intervals) {
        const count = Math.floor(Math.abs(diffInSeconds) / interval.seconds);
        if (count >= 1) {
          return rtf.format(diffInSeconds > 0 ? -count : count, interval.label as Intl.RelativeTimeFormatUnit);
        }
      }
      
      return rtf.format(0, 'second');
    } catch {
      console.warn('Relative date formatting error');
      return 'Invalid Date';
    }
  }

  /**
   * Format date only (no time)
   * Example: "Jan 19, 2026"
   */
  formatDateOnly (dateValue: string | Date | null | undefined): string {
    if (!dateValue) return '-';
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return new Intl.DateTimeFormat(this.userLocale, {
        timeZone: this.userTimezone,
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    } catch {
      console.warn('Date formatting error');
      return 'Invalid Date';
    }
  }

  /**
   * Format time only (no date)
   * Example: "14:30"
   */
  formatTimeOnly (dateValue: string | Date | null | undefined): string {
    if (!dateValue) return '-';
    
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return new Intl.DateTimeFormat(this.userLocale, {
        timeZone: this.userTimezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date);
    } catch {
      console.warn('Time formatting error');
      return 'Invalid Time';
    }
  }

  /**
   * Check if a date is today
   */
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

  /**
   * Check if a date is within the last 24 hours
   */
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

  /**
   * Get user's locale and timezone info (for debugging)
   */
  getUserInfo (): { locale: string; timezone: string } {
    return {
      locale: this.userLocale,
      timezone: this.userTimezone
    };
  }
}