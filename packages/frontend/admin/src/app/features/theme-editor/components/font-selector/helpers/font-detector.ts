import { FontGroup } from '../../../../../core/interfaces/theme.interface';

export class FontDetector {
  constructor (private fontGroups: FontGroup[]) {}

  isPredefinedFont (fontValue: string): boolean {
    return this.fontGroups.some(group => group.fonts.some(font => font.value === fontValue));
  }

  getFontDisplayName (fontValue: string): string {
    for (const group of this.fontGroups) {
      const font = group.fonts.find(f => f.value === fontValue);
      if (font) return font.name;
    }

    return 'Unknown Font';
  }
}
