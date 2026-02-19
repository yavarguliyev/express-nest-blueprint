import { ColorUtilityService } from '../services/utilities/color-utility.service';

const colorUtility = new ColorUtilityService();

export const TOKEN_RELATIONSHIPS: Record<string, string[]> = {
  '--btn-secondary-bg': ['--btn-secondary-hover']
} as const;

export const TOKEN_GENERATORS: Record<string, (value: string) => string> = {
  '--btn-secondary-hover': (value: string) => colorUtility.adjustOpacity(value, 0.15)
};

export const SYNC_BOTH_MODES_TOKENS = ['toggle', 'btn-'] as const;

export const AUTO_GENERATED_TOKENS = Object.keys(TOKEN_GENERATORS);

export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  colors: 'Colors',
  spacing: 'Spacing',
  typography: 'Typography',
  borders: 'Borders',
  shadows: 'Shadows',
  gradients: 'Gradients'
};

export const CATEGORY_ICONS: Record<string, string> = {
  colors: '🎨',
  spacing: '📏',
  typography: '🔤',
  borders: '⬜',
  shadows: '🌫️',
  gradients: '🌈'
};
