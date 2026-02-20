import { FontGroup } from '../../../../../core/interfaces/theme.interface';

export class FontGroupsProvider {
  private readonly fontGroups: FontGroup[] = [
    {
      category: 'System Fonts',
      fonts: [
        {
          name: 'System Default',
          value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        },
        { name: 'San Francisco (macOS)', value: '-apple-system, BlinkMacSystemFont, sans-serif' },
        { name: 'Segoe UI (Windows)', value: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' },
        { name: 'Roboto (Android)', value: 'Roboto, "Helvetica Neue", Arial, sans-serif' }
      ]
    },
    {
      category: 'Sans Serif',
      fonts: [
        { name: 'Inter', value: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif' },
        { name: 'Helvetica Neue', value: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
        { name: 'Arial', value: 'Arial, sans-serif' },
        { name: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
        { name: 'Trebuchet MS', value: '"Trebuchet MS", Helvetica, sans-serif' },
        { name: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' }
      ]
    },
    {
      category: 'Serif',
      fonts: [
        { name: 'Times New Roman', value: '"Times New Roman", Times, serif' },
        { name: 'Georgia', value: 'Georgia, "Times New Roman", serif' },
        { name: 'Garamond', value: 'Garamond, "Times New Roman", serif' },
        { name: 'Book Antiqua', value: '"Book Antiqua", Palatino, serif' }
      ]
    },
    {
      category: 'Monospace',
      fonts: [
        { name: 'Monaco', value: 'Monaco, "Lucida Console", monospace' },
        { name: 'Menlo', value: 'Menlo, Monaco, "Courier New", monospace' },
        { name: 'Consolas', value: 'Consolas, "Courier New", monospace' },
        { name: 'Courier New', value: '"Courier New", Courier, monospace' },
        { name: 'Source Code Pro', value: '"Source Code Pro", Monaco, monospace' }
      ]
    },
    {
      category: 'Google Fonts (Popular)',
      fonts: [
        { name: 'Open Sans', value: '"Open Sans", sans-serif' },
        { name: 'Lato', value: '"Lato", sans-serif' },
        { name: 'Montserrat', value: '"Montserrat", sans-serif' },
        { name: 'Roboto', value: '"Roboto", sans-serif' },
        { name: 'Poppins', value: '"Poppins", sans-serif' },
        { name: 'Nunito', value: '"Nunito", sans-serif' },
        { name: 'Playfair Display', value: '"Playfair Display", serif' },
        { name: 'Merriweather', value: '"Merriweather", serif' }
      ]
    }
  ];

  getFontGroups (): FontGroup[] {
    return this.fontGroups;
  }
}
