import { Directive, ElementRef, HostListener, inject, Renderer2, OnInit, OnDestroy, Input, effect } from '@angular/core';

import { AuthService } from '../../core/services/auth/auth.service';
import { UserRoleHelper } from '../../core/services/utilities/user-role-utility.service';
import { LayoutCustomizationService } from '../../core/services/ui/layout-customization.service';
import { ButtonCreator } from './helpers/button-creator';
import { HandleCreator } from './helpers/handle-creator';
import { DragResizeHandler } from './helpers/drag-resize-handler';
import { PositionManager } from './helpers/position-manager';
import { EventHandler } from './helpers/event-handler';
import { ActivationManager } from './helpers/activation-manager';
import { INTERACTIVE_TAGS } from '../../core/constants/api.constants';

@Directive({ selector: '[appDraggableResizable]', standalone: true })
export class DraggableResizableDirective implements OnInit, OnDestroy {
  @Input() appDraggableResizable = '';

  private isAdmin = false;
  private el = inject(ElementRef) as ElementRef<HTMLElement>;
  private renderer = inject(Renderer2);
  private auth = inject(AuthService);
  private layout = inject(LayoutCustomizationService);
  private dragResize = new DragResizeHandler(this.renderer);
  private posManager = new PositionManager(this.renderer);
  private events = new EventHandler();
  private activation = new ActivationManager(this.renderer, new ButtonCreator(this.renderer), new HandleCreator(this.renderer));

  constructor () {
    effect(() => {
      const pos = this.layout.currentPositions().get(this.getId());
      if (pos) this.posManager.applyPosition(this.el.nativeElement, pos, this.activation.activated);
      else this.posManager.clearPosition(this.el.nativeElement);
    });
  }

  ngOnInit (): void {
    const user = this.auth.getCurrentUser();
    if (user && UserRoleHelper.isGlobalAdmin(user.role)) {
      this.isAdmin = true;
      this.setCursor();
    }
  }

  ngOnDestroy (): void {
    this.activation.removeHandles(this.el.nativeElement);
  }

  private setCursor (): void {
    this.renderer.setStyle(this.el.nativeElement, 'cursor', 'move');
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'none');
  }

  private isInteractive (target: HTMLElement): boolean {
    return INTERACTIVE_TAGS.includes(target.tagName) || target.classList.contains('drag-handle') || target.classList.contains('deactivate-btn');
  }

  @HostListener('dblclick', ['$event']) onDblClick (e: MouseEvent): void {
    if (this.isAdmin && !this.activation.activated) {
      e.stopPropagation();
      this.activate();
    }
  }

  @HostListener('click', ['$event']) onClick (e: MouseEvent): void {
    if (this.isAdmin && !this.isInteractive(e.target as HTMLElement) && this.activation.activated) e.stopPropagation();
  }

  @HostListener('document:keydown.escape', ['$event']) onEscape (e: KeyboardEvent): void {
    if (this.activation.activated) {
      e.preventDefault();
      this.deactivate();
    }
  }

  @HostListener('mousedown', ['$event']) onMouseDown (e: MouseEvent): void {
    if (!this.isAdmin || e.button !== 0 || !this.activation.activated) return;
    e.stopPropagation();
    if (!this.isInteractive(e.target as HTMLElement)) this.startDrag(e);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove (e: MouseEvent): void {
    if (!this.events.isActive()) return;
    const { dx, dy } = this.events.getDelta(e);
    const { left, top } = this.events.getStartPosition();
    if (this.events.dragging) this.dragResize.handleDrag(this.el.nativeElement, dx, dy, left, top);
    else if (this.events.handle) this.handleResize(dx, dy);
  }

  @HostListener('document:mouseup') onMouseUp (): void {
    if (!this.events.isActive()) return;
    this.events.stop();
    this.savePosition();
  }

  private handleResize (dx: number, dy: number): void {
    const handle = this.events.handle;
    if (!handle) return;
    const d = this.events.getStartDimensions();
    this.dragResize.handleResize(this.el.nativeElement, dx, dy, handle, d.width, d.height, d.left, d.top);
  }

  private getId (): string {
    const el = this.el.nativeElement;
    return this.appDraggableResizable || el.id || `el-${el.tagName.toLowerCase()}-${Array.from(el.classList).join('.').slice(0, 20)}`;
  }

  private activate (): void {
    this.activation.activate(
      this.el.nativeElement,
      () => this.deactivate(),
      (e, h) => this.startResize(e, h)
    );
  }

  private deactivate (): void {
    this.activation.deactivate(this.el.nativeElement, this.layout.currentPositions().has(this.getId()));
  }

  private startDrag (e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.posManager.initializeDragPosition(this.el.nativeElement);
    this.events.startDrag(e, this.el.nativeElement);
  }

  private startResize (e: MouseEvent, handle: string): void {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    this.events.startResize(e, handle, this.el.nativeElement);
  }

  private savePosition (): void {
    const el = this.el.nativeElement;
    const id = this.getId();
    this.layout.updatePosition(id, {
      elementId: id,
      left: el.offsetLeft,
      top: el.offsetTop,
      width: el.offsetWidth,
      height: el.offsetHeight,
      zIndex: 1000
    });
  }
}
