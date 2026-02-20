export class ColorValidator {
  private readonly hexPattern = /^#[0-9A-Fa-f]{6}$/;
  private readonly rgbPattern = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/;
  private readonly hslPattern = /^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+)?\s*\)$/;
  private readonly namedColors = ['red', 'green', 'blue', 'white', 'black', 'transparent'];

  isValidColor (color: string): boolean {
    if (this.hexPattern.test(color)) return true;
    if (this.rgbPattern.test(color)) return true;
    if (this.hslPattern.test(color)) return true;
    if (this.namedColors.includes(color.toLowerCase())) return true;
    return false;
  }

  validateAndCorrect (color: string, fallback: string): string {
    return this.isValidColor(color) ? color : fallback;
  }
}
