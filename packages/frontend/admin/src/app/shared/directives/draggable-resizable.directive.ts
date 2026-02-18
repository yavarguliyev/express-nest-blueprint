import { Directive, ElementRef, HostListener, inject, Renderer2, OnInit, OnDestroy, Input, effect } from '@angular/core';

import { AuthService } from '../../core/services/auth/auth.service';
import { UserRoleHelper } from '../../core/services/utilities/user-role-utility.service';
import { LayoutCustomizationService } from '../../core/services/ui/layout-customization.service';

@Directive({
  selector: '[appDraggableResizable]',
  standalone: true
})
export class DraggableResizableDirective implements OnInit, OnDestroy {
  @Input() appDraggableResizable: string = '';

  private el: ElementRef<HTMLElement> = inject(ElementRef) as ElementRef<HTMLElement>;
  private renderer = inject(Renderer2);
  private authService = inject(AuthService);
  private layoutService = inject(LayoutCustomizationService);

  private isDragging = false;
  private isResizing = false;
  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;
  private startLeft = 0;
  private startTop = 0;
  private currentHandle: string | null = null;

  private isGlobalAdmin = false;
  private isActivated = false;

  private handles: HTMLElement[] = [];

  constructor () {
    effect(() => {
      const positions = this.layoutService.currentPositions();
      const id = this.getElementId();
      const pos = positions.get(id);

      if (pos) {
        this.renderer.setStyle(this.el.nativeElement, 'position', 'absolute');
        this.renderer.setStyle(this.el.nativeElement, 'left', `${pos.left}px`);
        this.renderer.setStyle(this.el.nativeElement, 'top', `${pos.top}px`);
        this.renderer.setStyle(this.el.nativeElement, 'width', `${pos.width}px`);
        this.renderer.setStyle(this.el.nativeElement, 'height', `${pos.height}px`);
        this.renderer.setStyle(this.el.nativeElement, 'z-index', this.isActivated ? '1000000' : `${pos.zIndex}`);
      } else {
        this.renderer.removeStyle(this.el.nativeElement, 'position');
        this.renderer.removeStyle(this.el.nativeElement, 'left');
        this.renderer.removeStyle(this.el.nativeElement, 'top');
        this.renderer.removeStyle(this.el.nativeElement, 'width');
        this.renderer.removeStyle(this.el.nativeElement, 'height');
        this.renderer.removeStyle(this.el.nativeElement, 'z-index');
      }
    });
  }

  ngOnInit (): void {
    const user = this.authService.getCurrentUser();
    if (user && UserRoleHelper.isGlobalAdmin(user.role)) {
      this.isGlobalAdmin = true;
      this.setupInteraction();
    }
  }

  ngOnDestroy (): void {
    this.removeHandles();
  }

  @HostListener('dblclick', ['$event'])
  onDoubleClick (event: MouseEvent): void {
    if (!this.isGlobalAdmin) return;
    event.stopPropagation();
    if (!this.isActivated) this.activate();
  }

  @HostListener('click', ['$event'])
  onClick (event: MouseEvent): void {
    if (!this.isGlobalAdmin) return;

    const target = event.target as HTMLElement;
    if (
      target.tagName === 'BUTTON' ||
      target.tagName === 'INPUT' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'A' ||
      target.tagName === 'LABEL'
    ) {
      return;
    }

    if (this.isActivated) event.stopPropagation();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey (event: KeyboardEvent): void {
    if (this.isActivated) {
      event.preventDefault();
      this.deactivate();
    }
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown (event: MouseEvent): void {
    if (!this.isGlobalAdmin) return;
    if (event.button !== 0) return;

    if (this.isActivated) {
      event.stopPropagation();

      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'A') return;
      if (target.classList.contains('drag-handle') || target.classList.contains('deactivate-btn')) return;

      this.onDragStart(event);
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove (event: MouseEvent): void {
    if (this.isDragging) {
      const dx = event.clientX - this.startX;
      const dy = event.clientY - this.startY;
      this.renderer.setStyle(this.el.nativeElement, 'left', `${this.startLeft + dx}px`);
      this.renderer.setStyle(this.el.nativeElement, 'top', `${this.startTop + dy}px`);
    } else if (this.isResizing) {
      const dx = event.clientX - this.startX;
      const dy = event.clientY - this.startY;

      switch (this.currentHandle) {
        case 'br':
          this.renderer.setStyle(this.el.nativeElement, 'width', `${this.startWidth + dx}px`);
          this.renderer.setStyle(this.el.nativeElement, 'height', `${this.startHeight + dy}px`);
          break;
        case 'tr':
          this.renderer.setStyle(this.el.nativeElement, 'width', `${this.startWidth + dx}px`);
          this.renderer.setStyle(this.el.nativeElement, 'height', `${this.startHeight - dy}px`);
          this.renderer.setStyle(this.el.nativeElement, 'top', `${this.startTop + dy}px`);
          break;
        case 'bl':
          this.renderer.setStyle(this.el.nativeElement, 'width', `${this.startWidth - dx}px`);
          this.renderer.setStyle(this.el.nativeElement, 'height', `${this.startHeight + dy}px`);
          this.renderer.setStyle(this.el.nativeElement, 'left', `${this.startLeft + dx}px`);
          break;
        case 'tl':
          this.renderer.setStyle(this.el.nativeElement, 'width', `${this.startWidth - dx}px`);
          this.renderer.setStyle(this.el.nativeElement, 'height', `${this.startHeight - dy}px`);
          this.renderer.setStyle(this.el.nativeElement, 'left', `${this.startLeft + dx}px`);
          this.renderer.setStyle(this.el.nativeElement, 'top', `${this.startTop + dy}px`);
          break;
      }
    }
  }

  @HostListener('document:mouseup')
  onMouseUp (): void {
    if (this.isDragging || this.isResizing) {
      this.isDragging = false;
      this.isResizing = false;
      this.currentHandle = null;

      this.saveCurrentPosition();
    }
  }

  private getElementId (): string {
    if (this.appDraggableResizable) return this.appDraggableResizable;
    const nativeElement = this.el.nativeElement;
    if (nativeElement.id) return nativeElement.id;
    const tag = nativeElement.tagName.toLowerCase();
    const classes = Array.from(nativeElement.classList).join('.').substring(0, 20);
    return `el-${tag}-${classes}`;
  }

  private setupInteraction (): void {
    this.renderer.setStyle(this.el.nativeElement, 'cursor', 'move');
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'none');
  }

  private activate (): void {
    this.isActivated = true;

    const element = this.el.nativeElement;
    const currentPos = window.getComputedStyle(element).position;
    if (currentPos === 'static') this.renderer.setStyle(element, 'position', 'relative');

    this.renderer.setStyle(element, 'overflow', 'visible');
    this.renderer.setStyle(element, 'outline', '2px dashed var(--primary)');

    this.createHandles();
    this.createDeactivateButton();
  }

  private deactivate (): void {
    this.isActivated = false;

    const element = this.el.nativeElement;
    const currentPos = element.style.position;
    if (currentPos === 'relative' && !this.layoutService.currentPositions().has(this.getElementId())) this.renderer.removeStyle(element, 'position');

    this.renderer.removeStyle(element, 'overflow');
    this.renderer.removeStyle(element, 'outline');
    this.removeHandles();
    this.removeDeactivateButton();
  }

  private createDeactivateButton (): void {
    const button = this.renderer.createElement('button') as HTMLElement;
    this.renderer.addClass(button, 'deactivate-btn');
    this.renderer.setStyle(button, 'position', 'absolute');
    this.renderer.setStyle(button, 'top', '4px');
    this.renderer.setStyle(button, 'right', '4px');
    this.renderer.setStyle(button, 'width', '24px');
    this.renderer.setStyle(button, 'height', '24px');
    this.renderer.setStyle(button, 'background', 'var(--danger)', 1);
    this.renderer.setStyle(button, 'color', 'var(--white, #ffffff)', 1);
    this.renderer.setStyle(button, 'border', '2px solid var(--white, #ffffff)', 1);
    this.renderer.setStyle(button, 'border-radius', '4px');
    this.renderer.setStyle(button, 'cursor', 'pointer');
    this.renderer.setStyle(button, 'z-index', '1000000');
    this.renderer.setStyle(button, 'display', 'flex');
    this.renderer.setStyle(button, 'align-items', 'center');
    this.renderer.setStyle(button, 'justify-content', 'center');
    this.renderer.setStyle(button, 'font-size', '16px');
    this.renderer.setStyle(button, 'font-family', 'Arial, sans-serif');
    this.renderer.setStyle(button, 'font-weight', '900');
    this.renderer.setStyle(button, 'line-height', '1');
    this.renderer.setStyle(button, 'padding', '0');
    this.renderer.setStyle(button, 'pointer-events', 'auto');
    this.renderer.setStyle(button, 'box-shadow', '0 2px 8px var(--primary-glow)');
    this.renderer.setStyle(button, 'transition', 'all 0.15s ease-in-out');
    this.renderer.setStyle(button, 'box-sizing', 'border-box');

    const xSpan =
      '<span style="color: var(--white, #ffffff) !important; font-weight: 900 !important; font-size: 16px !important; font-family: Arial, sans-serif !important; text-shadow: 0 0 2px var(--primary-glow) !important; line-height: 1 !important; display: block !important;">X</span>';
    button.innerHTML = xSpan;
    button.title = 'Exit draggable mode (ESC)';

    this.renderer.listen(button, 'click', (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      this.deactivate();
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

    this.renderer.appendChild(this.el.nativeElement, button);
    this.handles.push(button);
  }

  private removeDeactivateButton (): void {}

  private createHandles (): void {
    const positions = ['tl', 'tr', 'bl', 'br'];

    positions.forEach(pos => {
      const handle = this.renderer.createElement('div') as HTMLElement;
      this.renderer.addClass(handle, 'drag-handle');
      this.renderer.addClass(handle, `handle-${pos}`);
      this.renderer.setStyle(handle, 'position', 'absolute');
      this.renderer.setStyle(handle, 'width', '10px');
      this.renderer.setStyle(handle, 'height', '10px');
      this.renderer.setStyle(handle, 'background', 'var(--primary)');
      this.renderer.setStyle(handle, 'z-index', '1001');

      switch (pos) {
        case 'tl':
          this.renderer.setStyle(handle, 'top', '-5px');
          this.renderer.setStyle(handle, 'left', '-5px');
          this.renderer.setStyle(handle, 'cursor', 'nwse-resize');
          break;
        case 'tr':
          this.renderer.setStyle(handle, 'top', '-5px');
          this.renderer.setStyle(handle, 'right', '-5px');
          this.renderer.setStyle(handle, 'cursor', 'nesw-resize');
          break;
        case 'bl':
          this.renderer.setStyle(handle, 'bottom', '-5px');
          this.renderer.setStyle(handle, 'left', '-5px');
          this.renderer.setStyle(handle, 'cursor', 'nesw-resize');
          break;
        case 'br':
          this.renderer.setStyle(handle, 'bottom', '-5px');
          this.renderer.setStyle(handle, 'right', '-5px');
          this.renderer.setStyle(handle, 'cursor', 'nwse-resize');
          break;
      }

      this.renderer.listen(handle, 'mousedown', (e: MouseEvent) => this.onResizeStart(e, pos));
      this.renderer.appendChild(this.el.nativeElement, handle);
      this.handles.push(handle);
    });
  }

  private removeHandles (): void {
    this.handles.forEach(h => this.renderer.removeChild(this.el.nativeElement, h));
    this.handles = [];
  }

  private onDragStart (event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const element = this.el.nativeElement;
    if (element.style.position !== 'absolute') {
      const rect = element.getBoundingClientRect();
      this.renderer.setStyle(element, 'position', 'absolute');
      this.renderer.setStyle(element, 'left', `${rect.left}px`);
      this.renderer.setStyle(element, 'top', `${rect.top}px`);
      this.renderer.setStyle(element, 'width', `${rect.width}px`);
      this.renderer.setStyle(element, 'height', `${rect.height}px`);
      this.renderer.setStyle(element, 'z-index', '1000');
    }

    this.isDragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startLeft = element.offsetLeft;
    this.startTop = element.offsetTop;
  }

  private onResizeStart (event: MouseEvent, handle: string): void {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    this.isResizing = true;
    this.currentHandle = handle;
    this.startX = event.clientX;
    this.startY = event.clientY;
    const element = this.el.nativeElement;
    this.startWidth = element.offsetWidth;
    this.startHeight = element.offsetHeight;
    this.startLeft = element.offsetLeft;
    this.startTop = element.offsetTop;
  }

  private saveCurrentPosition (): void {
    const id = this.getElementId();
    const element = this.el.nativeElement;

    this.layoutService.updatePosition(id, {
      elementId: id,
      left: element.offsetLeft,
      top: element.offsetTop,
      width: element.offsetWidth,
      height: element.offsetHeight,
      zIndex: 1000
    });
  }
}
