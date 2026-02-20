export class ColorPresetProvider {
  private readonly presets = [
    '#000000',
    '#ffffff',
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ffff00',
    '#ff00ff',
    '#00ffff',
    '#ffa500',
    '#800080',
    '#008000',
    '#000080',
    '#808080',
    '#c0c0c0',
    '#800000'
  ];

  getPresets (): string[] {
    return this.presets;
  }
}
