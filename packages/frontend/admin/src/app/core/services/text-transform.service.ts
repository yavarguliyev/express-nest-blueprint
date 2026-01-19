import { Injectable } from '@angular/core';

/**
 * Centralized Text Transformation Service
 * 
 * This service provides consistent field name transformations across the entire application.
 * 
 * Usage:
 * 1. Inject the service: private textTransform = inject(TextTransformService)
 * 2. Use in templates: {{ getFieldDisplayName(fieldName) }}
 * 3. Use in components: this.textTransform.getDisplayName('firstName') // returns 'FIRST NAME'
 * 
 * To extend with new field mappings:
 * - Add new entries to the fieldDisplayNames object below
 * - Or use registerFieldMapping() / registerFieldMappings() methods at runtime
 * 
 * Examples:
 * - 'firstName' -> 'FIRST NAME'
 * - 'isEmailVerified' -> 'VERIFIED EMAIL'
 * - 'profileImageUrl' -> 'PROFILE IMAGE'
 */
@Injectable({
  providedIn: 'root'
})
export class TextTransformService {
  
  // Centralized field name mappings - extend this object for new fields
  private readonly fieldDisplayNames: Record<string, string> = {
    // User fields
    'firstName': 'FIRST NAME',
    'lastName': 'LAST NAME', 
    'email': 'EMAIL ADDRESS',
    'isActive': 'ACTIVE',
    'isEmailVerified': 'VERIFIED EMAIL',
    'profileImageUrl': 'PROFILE IMAGE',
    'role': 'USER ROLE',
    'id': 'ID',
    'lastLogin': 'LAST LOGIN',
    
    // Common fields
    'createdAt': 'CREATED DATE',
    'updatedAt': 'LAST UPDATED',
    'deletedAt': 'DELETED DATE',
    'status': 'STATUS',
    'name': 'NAME',
    'description': 'DESCRIPTION',
    'title': 'TITLE',
    'content': 'CONTENT',
    'type': 'TYPE',
    'category': 'CATEGORY',
    'priority': 'PRIORITY',
    'tags': 'TAGS',
    
    // System fields
    'userId': 'USER ID',
    'adminId': 'ADMIN ID',
    'sessionId': 'SESSION ID',
    'ipAddress': 'IP ADDRESS',
    'userAgent': 'USER AGENT',
    'deviceType': 'DEVICE TYPE',
    'browserName': 'BROWSER',
    'operatingSystem': 'OPERATING SYSTEM',
    
    // Business fields
    'companyName': 'COMPANY NAME',
    'department': 'DEPARTMENT',
    'position': 'POSITION',
    'phoneNumber': 'PHONE NUMBER',
    'address': 'ADDRESS',
    'city': 'CITY',
    'country': 'COUNTRY',
    'zipCode': 'ZIP CODE',
    
    // Settings fields
    'isEnabled': 'ENABLED',
    'isVisible': 'VISIBLE',
    'isPublic': 'PUBLIC',
    'isPrivate': 'PRIVATE',
    'allowNotifications': 'NOTIFICATIONS',
    'allowEmails': 'EMAIL NOTIFICATIONS',
    'allowSms': 'SMS NOTIFICATIONS',
    
    // Metrics fields
    'totalUsers': 'TOTAL USERS',
    'activeUsers': 'ACTIVE USERS',
    'memoryUsage': 'MEMORY USAGE',
    'cpuUsage': 'CPU USAGE',
    'diskUsage': 'DISK USAGE',
    'networkUsage': 'NETWORK USAGE',
    'requestCount': 'REQUEST COUNT',
    'errorCount': 'ERROR COUNT',
    'responseTime': 'RESPONSE TIME'
  };

  /**
   * Transform a database field name to a user-friendly display name
   * @param fieldName - The original field name from database
   * @returns Formatted display name
   */
  getDisplayName(fieldName: string): string {
    // Check if we have a specific mapping
    if (this.fieldDisplayNames[fieldName]) {
      return this.fieldDisplayNames[fieldName];
    }
    
    // Fallback: convert camelCase to UPPER CASE with spaces
    return this.camelCaseToUpperCase(fieldName);
  }

  /**
   * Convert camelCase to UPPER CASE with spaces
   * Example: firstName -> FIRST NAME
   */
  private camelCaseToUpperCase(str: string): string {
    return str
      // Insert space before uppercase letters
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Convert to uppercase
      .toUpperCase();
  }

  /**
   * Get all registered field mappings (for debugging/admin purposes)
   */
  getAllMappings(): Record<string, string> {
    return { ...this.fieldDisplayNames };
  }

  /**
   * Register new field mappings at runtime (for dynamic extensions)
   */
  registerFieldMapping(fieldName: string, displayName: string): void {
    this.fieldDisplayNames[fieldName] = displayName;
  }

  /**
   * Register multiple field mappings at once
   */
  registerFieldMappings(mappings: Record<string, string>): void {
    Object.assign(this.fieldDisplayNames, mappings);
  }
}