import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ColorUtilityService {
  adjustBrightness (color: string, percent: number): string {
    if (color.startsWith('#')) return this.adjustHexBrightness(color, percent);
    if (color.startsWith('rgb')) return this.adjustRgbBrightness(color, percent);
    return color;
  }

  adjustOpacity (color: string, newOpacity: number): string {
    if (color.startsWith('rgba(')) return color.replace(/,\s*[\d.]+\)$/, `, ${newOpacity})`);
    if (color.startsWith('rgb(')) return color.replace('rgb(', 'rgba(').replace(')', `, ${newOpacity})`);
    return color;
  }

  hexToRgb (hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1]!, 16),
          g: parseInt(result[2]!, 16),
          b: parseInt(result[3]!, 16)
        }
      : null;
  }

  rgbToHex (r: number, g: number, b: number): string {
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  private adjustHexBrightness (hex: string, percent: number): string {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, Math.floor((num >> 16) + ((255 - (num >> 16)) * percent) / 100)));
    const g = Math.max(0, Math.min(255, Math.floor(((num >> 8) & 0x00ff) + ((255 - ((num >> 8) & 0x00ff)) * percent) / 100)));
    const b = Math.max(0, Math.min(255, Math.floor((num & 0x0000ff) + ((255 - (num & 0x0000ff)) * percent) / 100)));
    return this.rgbToHex(r, g, b);
  }

  private adjustRgbBrightness (rgb: string, percent: number): string {
    const matches = rgb.match(/\d+/g);
    if (!matches || matches.length < 3) return rgb;

    const r = Math.max(0, Math.min(255, parseInt(matches[0]) + Math.floor(((255 - parseInt(matches[0])) * percent) / 100)));
    const g = Math.max(0, Math.min(255, parseInt(matches[1]!) + Math.floor(((255 - parseInt(matches[1]!)) * percent) / 100)));
    const b = Math.max(0, Math.min(255, parseInt(matches[2]!) + Math.floor(((255 - parseInt(matches[2]!)) * percent) / 100)));
    const a = matches[3] ? parseFloat(matches[3]) : 1;

    return matches.length > 3 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
  }
}
