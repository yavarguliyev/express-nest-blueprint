import { Injectable } from '@angular/core';

import { FIELD_DISPLAY_NAMES } from '../../constants/field.constants';

@Injectable({
  providedIn: 'root'
})
export class TextTransformService {
  private readonly fieldDisplayNames: Record<string, string> = { ...FIELD_DISPLAY_NAMES };

  getDisplayName (fieldName: string): string {
    if (this.fieldDisplayNames[fieldName]) return this.fieldDisplayNames[fieldName];
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
