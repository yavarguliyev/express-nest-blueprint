import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TextTransformService {
  private readonly fieldDisplayNames: Record<string, string> = {
    // User fields
    firstName: 'FIRST NAME',
    lastName: 'LAST NAME',
    email: 'EMAIL ADDRESS',
    isActive: 'ACTIVE',
    isEmailVerified: 'VERIFIED EMAIL',
    profileImageUrl: 'PROFILE IMAGE',
    role: 'USER ROLE',
    id: 'ID',
    lastLogin: 'LAST LOGIN',

    // Common fields
    createdAt: 'CREATED DATE',
    updatedAt: 'LAST UPDATED',
    deletedAt: 'DELETED DATE',
    status: 'STATUS',
    name: 'NAME',
    description: 'DESCRIPTION',
    title: 'TITLE',
    content: 'CONTENT',
    type: 'TYPE',
    category: 'CATEGORY',
    priority: 'PRIORITY',
    tags: 'TAGS',

    // System fields
    userId: 'USER ID',
    adminId: 'ADMIN ID',
    sessionId: 'SESSION ID',
    ipAddress: 'IP ADDRESS',
    userAgent: 'USER AGENT',
    deviceType: 'DEVICE TYPE',
    browserName: 'BROWSER',
    operatingSystem: 'OPERATING SYSTEM',

    // Business fields
    companyName: 'COMPANY NAME',
    department: 'DEPARTMENT',
    position: 'POSITION',
    phoneNumber: 'PHONE NUMBER',
    address: 'ADDRESS',
    city: 'CITY',
    country: 'COUNTRY',
    zipCode: 'ZIP CODE',

    // Settings fields
    isEnabled: 'ENABLED',
    isVisible: 'VISIBLE',
    isPublic: 'PUBLIC',
    isPrivate: 'PRIVATE',
    isRead: 'READ',
    isEmpty: 'EMPTY',
    isCustomizable: 'CUSTOMIZABLE',
    isImportant: 'IMPORTANT',
    isSystemGradient: 'SYSTEM GRADIENT',
    allowEmails: 'EMAIL NOTIFICATIONS',
    allowSms: 'SMS NOTIFICATIONS',

    // Metrics fields
    totalUsers: 'TOTAL USERS',
    activeUsers: 'ACTIVE USERS',
    memoryUsage: 'MEMORY USAGE',
    cpuUsage: 'CPU USAGE',
    diskUsage: 'DISK USAGE',
    networkUsage: 'NETWORK USAGE',
    requestCount: 'REQUEST COUNT',
    errorCount: 'ERROR COUNT',
    responseTime: 'RESPONSE TIME'
  };

  getDisplayName (fieldName: string): string {
    if (this.fieldDisplayNames[fieldName]) {
      return this.fieldDisplayNames[fieldName];
    }

    return this.camelCaseToUpperCase(fieldName);
  }

  getAllMappings (): Record<string, string> {
    return { ...this.fieldDisplayNames };
  }

  registerFieldMapping (fieldName: string, displayName: string): void {
    this.fieldDisplayNames[fieldName] = displayName;
  }

  registerFieldMappings (mappings: Record<string, string>): void {
    Object.assign(this.fieldDisplayNames, mappings);
  }

  private camelCaseToUpperCase (str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1 $2').toUpperCase();
  }
}
