import { Renderer2 } from '@angular/core';

export class HandleCreator {
  constructor (private renderer: Renderer2) {}

  createHandles (element: HTMLElement, onResizeStart: (event: MouseEvent, handle: string) => void): HTMLElement[] {
    const positions = ['tl', 'tr', 'bl', 'br'];
    return positions.map(pos => this.createHandle(element, pos, onResizeStart));
  }

  private createHandle (element: HTMLElement, position: string, onResizeStart: (event: MouseEvent, handle: string) => void): HTMLElement {
    const handle = this.renderer.createElement('div') as HTMLElement;
    this.applyHandleStyles(handle, position);
    this.renderer.listen(handle, 'mousedown', (e: MouseEvent) => onResizeStart(e, position));
    this.renderer.appendChild(element, handle);
    return handle;
  }

  private applyHandleStyles (handle: HTMLElement, position: string): void {
    this.renderer.addClass(handle, 'drag-handle');
    this.renderer.addClass(handle, `handle-${position}`);
    this.renderer.setStyle(handle, 'position', 'absolute');
    this.renderer.setStyle(handle, 'width', '10px');
    this.renderer.setStyle(handle, 'height', '10px');
    this.renderer.setStyle(handle, 'background', 'var(--primary)');
    this.renderer.setStyle(handle, 'z-index', '1001');
    this.applyPositionStyles(handle, position);
  }

  private applyPositionStyles (handle: HTMLElement, position: string): void {
    const configs: Record<string, { styles: Record<string, string>; cursor: string }> = {
      tl: { styles: { top: '-5px', left: '-5px' }, cursor: 'nwse-resize' },
      tr: { styles: { top: '-5px', right: '-5px' }, cursor: 'nesw-resize' },
      bl: { styles: { bottom: '-5px', left: '-5px' }, cursor: 'nesw-resize' },
      br: { styles: { bottom: '-5px', right: '-5px' }, cursor: 'nwse-resize' }
    };

    const config = configs[position];
    if (!config) return;
    Object.entries(config.styles).forEach(([key, value]) => this.renderer.setStyle(handle, key, value));
    this.renderer.setStyle(handle, 'cursor', config.cursor);
  }
}
