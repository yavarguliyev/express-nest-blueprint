export class EventHandler {
  private isDragging = false;
  private isResizing = false;
  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;
  private startLeft = 0;
  private startTop = 0;
  private currentHandle: string | null = null;

  get dragging (): boolean {
    return this.isDragging;
  }

  get resizing (): boolean {
    return this.isResizing;
  }

  get handle (): string | null {
    return this.currentHandle;
  }

  startDrag (event: MouseEvent, element: HTMLElement): void {
    this.isDragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startLeft = element.offsetLeft;
    this.startTop = element.offsetTop;
  }

  startResize (event: MouseEvent, handle: string, element: HTMLElement): void {
    this.isResizing = true;
    this.currentHandle = handle;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startWidth = element.offsetWidth;
    this.startHeight = element.offsetHeight;
    this.startLeft = element.offsetLeft;
    this.startTop = element.offsetTop;
  }

  getDelta (event: MouseEvent): { dx: number; dy: number } {
    return {
      dx: event.clientX - this.startX,
      dy: event.clientY - this.startY
    };
  }

  getStartPosition (): { left: number; top: number } {
    return { left: this.startLeft, top: this.startTop };
  }

  getStartDimensions (): { width: number; height: number; left: number; top: number } {
    return {
      width: this.startWidth,
      height: this.startHeight,
      left: this.startLeft,
      top: this.startTop
    };
  }

  stop (): void {
    this.isDragging = false;
    this.isResizing = false;
    this.currentHandle = null;
  }

  isActive (): boolean {
    return this.isDragging || this.isResizing;
  }
}
