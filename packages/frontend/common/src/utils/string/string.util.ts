export class StringUtil {
  static capitalize (str: string): string {
    if (!str) return str;
    const firstChar = str.charAt(0);
    return firstChar.toUpperCase() + str.slice(1).toLowerCase();
  }

  static camelCase (str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char: string) => char ? char.toUpperCase() : '')
      .replace(/^[A-Z]/, char => char.toLowerCase());
  }

  static kebabCase (str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  static snakeCase (str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase();
  }

  static truncate (str: string, length: number, suffix = '...'): string {
    if (str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
  }

  static slugify (str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static stripHtml (str: string): string {
    return str.replace(/<[^>]*>/g, '');
  }

  static isEmpty (str: string | null | undefined): boolean {
    return !str || str.trim().length === 0;
  }

  static pad (str: string, length: number, char = ' ', direction: 'start' | 'end' = 'start'): string {
    if (str.length >= length) return str;
    const padding = char.repeat(length - str.length);
    return direction === 'start' ? padding + str : str + padding;
  }
}
