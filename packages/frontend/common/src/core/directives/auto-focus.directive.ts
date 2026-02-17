import { Directive, ElementRef, Input, OnInit, inject } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
  standalone: true
})
export class AutoFocusDirective implements OnInit {
  private readonly elementRef = inject(ElementRef);

  @Input() appAutoFocus: boolean | string = true;

  ngOnInit (): void {
    const shouldFocus = this.appAutoFocus === '' || this.appAutoFocus === true || this.appAutoFocus === 'true';

    if (shouldFocus) {
      setTimeout(() => {
        const element = this.elementRef.nativeElement as HTMLElement;
        element.focus();
      }, 0);
    }
  }
}
