import { ElementRef } from '@angular/core';

export class ScrollManager {
  setupScrollIndicators (container: ElementRef<HTMLDivElement>): void {
    if (!container) return;

    const element = container.nativeElement;
    const updateScrollIndicators = (): void => {
      const { scrollLeft, scrollWidth, clientWidth } = element;
      element.classList.remove('scrolled-left', 'scrolled-right');
      if (scrollLeft > 0) element.classList.add('scrolled-left');
      if (scrollLeft < scrollWidth - clientWidth - 1) element.classList.add('scrolled-right');
    };

    setTimeout(updateScrollIndicators, 100);
    element.addEventListener('scroll', updateScrollIndicators);
    window.addEventListener('resize', updateScrollIndicators);
  }

  resetTableScroll (container: ElementRef<HTMLDivElement> | undefined): void {
    setTimeout(() => {
      if (container) container.nativeElement.scrollLeft = 0;
    }, 100);
  }
}
