import { Renderer2 } from '@angular/core';

export class ButtonCreator {
  constructor (private renderer: Renderer2) {}

  createDeactivateButton (onDeactivate: () => void): HTMLElement {
    const button = this.renderer.createElement('button') as HTMLElement;
    this.applyButtonStyles(button);
    this.setButtonContent(button);
    this.attachButtonListeners(button, onDeactivate);
    return button;
  }

  private applyButtonStyles (button: HTMLElement): void {
    this.renderer.addClass(button, 'deactivate-btn');
    const styles = this.getButtonStyles();
    Object.entries(styles).forEach(([key, value]) => {
      this.renderer.setStyle(button, key, value, value.includes('!') ? 1 : undefined);
    });
  }

  private getButtonStyles (): Record<string, string> {
    return {
      position: 'absolute',
      top: '4px',
      right: '4px',
      width: '24px',
      height: '24px',
      background: 'var(--danger)',
      color: 'var(--white, #ffffff)',
      border: '2px solid var(--white, #ffffff)',
      'border-radius': '4px',
      cursor: 'pointer',
      'z-index': '1000000',
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      'font-size': '16px',
      'font-family': 'Arial, sans-serif',
      'font-weight': '900',
      'line-height': '1',
      padding: '0',
      'pointer-events': 'auto',
      'box-shadow': '0 2px 8px var(--primary-glow)',
      transition: 'all 0.15s ease-in-out',
      'box-sizing': 'border-box'
    };
  }

  private setButtonContent (button: HTMLElement): void {
    const xSpan =
      '<span style="color: var(--white, #ffffff) !important; font-weight: 900 !important; ' +
      'font-size: 16px !important; font-family: Arial, sans-serif !important; ' +
      'text-shadow: 0 0 2px var(--primary-glow) !important; line-height: 1 !important; ' +
      'display: block !important;">X</span>';

    button.innerHTML = xSpan;
    button.title = 'Exit draggable mode (ESC)';
  }

  private attachButtonListeners (button: HTMLElement, onDeactivate: () => void): void {
    this.renderer.listen(button, 'click', (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onDeactivate();
    });

    this.renderer.listen(button, 'contextmenu', (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
    });

    this.renderer.listen(button, 'mouseenter', () => {
      this.renderer.setStyle(button, 'transform', 'scale(1.1)');
      this.renderer.setStyle(button, 'filter', 'brightness(1.1)');
    });

    this.renderer.listen(button, 'mouseleave', () => {
      this.renderer.setStyle(button, 'transform', 'scale(1)');
      this.renderer.setStyle(button, 'filter', 'brightness(1)');
    });
  }
}
