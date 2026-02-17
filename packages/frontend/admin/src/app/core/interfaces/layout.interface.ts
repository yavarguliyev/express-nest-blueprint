export interface LayoutPosition {
  elementId: string;
  left: number;
  top: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface LayoutCustomization {
  userId: string;
  positions: LayoutPosition[];
  lastModified: Date;
}
