import { Renderer2 } from '@angular/core';

export class PositionManager {
  constructor (private renderer: Renderer2) {}

  applyPosition (element: HTMLElement, pos: { left: number; top: number; width: number; height: number; zIndex: number }, isActivated: boolean): void {
    this.renderer.setStyle(element, 'position', 'absolute');
    this.renderer.setStyle(element, 'left', `${pos.left}px`);
    this.renderer.setStyle(element, 'top', `${pos.top}px`);
    this.renderer.setStyle(element, 'width', `${pos.width}px`);
    this.renderer.setStyle(element, 'height', `${pos.height}px`);
    this.renderer.setStyle(element, 'z-index', isActivated ? '1000000' : `${pos.zIndex}`);
  }

  clearPosition (element: HTMLElement): void {
    this.renderer.removeStyle(element, 'position');
    this.renderer.removeStyle(element, 'left');
    this.renderer.removeStyle(element, 'top');
    this.renderer.removeStyle(element, 'width');
    this.renderer.removeStyle(element, 'height');
    this.renderer.removeStyle(element, 'z-index');
  }

  initializeDragPosition (element: HTMLElement): void {
    if (element.style.position !== 'absolute') {
      const rect = element.getBoundingClientRect();
      this.renderer.setStyle(element, 'position', 'absolute');
      this.renderer.setStyle(element, 'left', `${rect.left}px`);
      this.renderer.setStyle(element, 'top', `${rect.top}px`);
      this.renderer.setStyle(element, 'width', `${rect.width}px`);
      this.renderer.setStyle(element, 'height', `${rect.height}px`);
      this.renderer.setStyle(element, 'z-index', '1000');
    }
  }
}
