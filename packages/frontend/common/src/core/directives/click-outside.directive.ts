import { Directive, ElementRef, EventEmitter, Output, inject, effect } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Directive({
  selector: '[appClickOutside]',
  standalone: true
})
export class ClickOutsideDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  @Output() clickOutside = new EventEmitter<MouseEvent>();

  constructor () {
    effect(onCleanup => {
      const element = this.getElement();

      const subscription: Subscription = fromEvent<MouseEvent>(document, 'click')
        .pipe(
          filter((event: MouseEvent) => {
            const target = event.target as Node | null;
            if (!target) {
              return false;
            }
            const clickedInside = element.contains(target);
            return !clickedInside;
          })
        )
        .subscribe((event: MouseEvent) => {
          this.clickOutside.emit(event);
        });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  private getElement (): HTMLElement {
    return this.elementRef.nativeElement as HTMLElement;
  }
}
