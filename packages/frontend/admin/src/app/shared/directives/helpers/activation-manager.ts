import { Renderer2 } from '@angular/core';

import { ButtonCreator } from './button-creator';
import { HandleCreator } from './handle-creator';

export class ActivationManager {
  private isActivated = false;
  private handles: HTMLElement[] = [];

  constructor (
    private renderer: Renderer2,
    private buttonCreator: ButtonCreator,
    private handleCreator: HandleCreator
  ) {}

  get activated (): boolean {
    return this.isActivated;
  }

  activate (element: HTMLElement, onDeactivate: () => void, onResizeStart: (event: MouseEvent, handle: string) => void): void {
    this.isActivated = true;
    this.applyActivationStyles(element);
    this.createInteractionElements(element, onDeactivate, onResizeStart);
  }

  deactivate (element: HTMLElement, hasStoredPosition: boolean): void {
    this.isActivated = false;
    this.removeActivationStyles(element, hasStoredPosition);
    this.removeHandles(element);
  }

  removeHandles (element: HTMLElement): void {
    this.handles.forEach(h => this.renderer.removeChild(element, h));
    this.handles = [];
  }

  private applyActivationStyles (element: HTMLElement): void {
    if (window.getComputedStyle(element).position === 'static') this.renderer.setStyle(element, 'position', 'relative');
    this.renderer.setStyle(element, 'overflow', 'visible');
    this.renderer.setStyle(element, 'outline', '2px dashed var(--primary)');
  }

  private removeActivationStyles (element: HTMLElement, hasStoredPosition: boolean): void {
    if (element.style.position === 'relative' && !hasStoredPosition) this.renderer.removeStyle(element, 'position');
    this.renderer.removeStyle(element, 'overflow');
    this.renderer.removeStyle(element, 'outline');
  }

  private createInteractionElements (
    element: HTMLElement,
    onDeactivate: () => void,
    onResizeStart: (event: MouseEvent, handle: string) => void
  ): void {
    const newHandles = this.handleCreator.createHandles(element, onResizeStart);
    this.handles.push(...newHandles);
    const button = this.buttonCreator.createDeactivateButton(onDeactivate);
    this.renderer.appendChild(element, button);
    this.handles.push(button);
  }
}
