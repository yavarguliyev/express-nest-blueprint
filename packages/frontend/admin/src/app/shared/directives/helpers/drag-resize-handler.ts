import { Renderer2 } from '@angular/core';

export class DragResizeHandler {
  constructor (private renderer: Renderer2) {}

  handleDrag (element: HTMLElement, dx: number, dy: number, startLeft: number, startTop: number): void {
    this.applyStyles(element, { left: startLeft + dx, top: startTop + dy });
  }

  handleResize (
    element: HTMLElement,
    dx: number,
    dy: number,
    handle: string,
    startWidth: number,
    startHeight: number,
    startLeft: number,
    startTop: number
  ): void {
    const leftFactor = handle.includes('l') ? 1 : 0;
    const rightFactor = handle.includes('r') ? 1 : 0;
    const topFactor = handle.includes('t') ? 1 : 0;
    const bottomFactor = handle.includes('b') ? 1 : 0;

    this.applyStyles(element, {
      width: startWidth + dx * rightFactor - dx * leftFactor,
      height: startHeight + dy * bottomFactor - dy * topFactor,
      left: startLeft + dx * leftFactor,
      top: startTop + dy * topFactor
    });
  }

  applyStyles (element: HTMLElement, styles: Partial<Record<'width' | 'height' | 'left' | 'top', number>>): void {
    for (const [key, value] of Object.entries(styles)) {
      this.renderer.setStyle(element, key, `${value}px`);
    }
  }
}
