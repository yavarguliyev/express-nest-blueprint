import { Directive, ElementRef, HostListener, Input, inject } from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true
})
export class TooltipDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private tooltipElement: HTMLDivElement | null = null;

  @Input() appTooltip = '';
  @Input() tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';

  @HostListener('mouseenter')
  onMouseEnter (): void {
    if (!this.appTooltip) return;
    this.showTooltip();
  }

  @HostListener('mouseleave')
  onMouseLeave (): void {
    this.hideTooltip();
  }

  private showTooltip (): void {
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.className = `tooltip tooltip-${this.tooltipPosition}`;
    this.tooltipElement.textContent = this.appTooltip;

    document.body.appendChild(this.tooltipElement);

    this.positionTooltip();
  }

  private hideTooltip (): void {
    if (this.tooltipElement && this.tooltipElement.parentNode) {
      this.tooltipElement.parentNode.removeChild(this.tooltipElement);
      this.tooltipElement = null;
    }
  }

  private positionTooltip (): void {
    if (!this.tooltipElement) return;

    const element = this.getElement();
    const hostPos = this.getRect(element);
    const tooltipPos = this.getRect(this.tooltipElement);

    let top = 0;
    let left = 0;

    switch (this.tooltipPosition) {
      case 'top': {
        const calculatedTop = hostPos.top - tooltipPos.height - 8;
        const calculatedLeft = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
        top = calculatedTop;
        left = calculatedLeft;
        break;
      }
      case 'bottom': {
        const calculatedTop = hostPos.bottom + 8;
        const calculatedLeft = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
        top = calculatedTop;
        left = calculatedLeft;
        break;
      }
      case 'left': {
        const calculatedTop = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
        const calculatedLeft = hostPos.left - tooltipPos.width - 8;
        top = calculatedTop;
        left = calculatedLeft;
        break;
      }
      case 'right': {
        const calculatedTop = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
        const calculatedLeft = hostPos.right + 8;
        top = calculatedTop;
        left = calculatedLeft;
        break;
      }
    }

    this.tooltipElement.style.position = 'fixed';
    this.tooltipElement.style.top = `${top}px`;
    this.tooltipElement.style.left = `${left}px`;
  }

  private getElement (): HTMLElement {
    return this.elementRef.nativeElement as HTMLElement;
  }

  private getRect (element: HTMLElement): DOMRect {
    return element.getBoundingClientRect();
  }
}
