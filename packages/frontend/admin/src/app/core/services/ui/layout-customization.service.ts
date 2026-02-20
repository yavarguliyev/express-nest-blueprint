import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../../constants/api.constants';
import { LayoutPosition, LayoutCustomization } from '../../interfaces/common.interface';

@Injectable({
  providedIn: 'root'
})
export class LayoutCustomizationService {
  private http = inject(HttpClient);
  private STORAGE_KEY = 'admin_layout_customization';
  private originalPositions = signal<Map<string, LayoutPosition>>(new Map());
  public currentPositions = signal<Map<string, LayoutPosition>>(new Map());

  constructor () {
    this.loadFromLocalStorage();
  }

  changedElements = computed(() => this.computeChangedKeys());
  draftCount = computed(() => this.changedElements().length);
  hasDrafts = computed(() => this.draftCount() > 0);

  updatePosition (elementId: string, position: LayoutPosition): void {
    this.currentPositions.update(positions => {
      const newMap = new Map(positions);
      newMap.set(elementId, position);
      return newMap;
    });
  }

  loadCustomization (): Observable<LayoutCustomization> {
    return this.http.get<LayoutCustomization>(`${API_ENDPOINTS.ADMIN.LAYOUT_CUSTOMIZATION}`);
  }

  saveCustomization (positions: LayoutPosition[]): Observable<LayoutCustomization> {
    return this.http.post<LayoutCustomization>(`${API_ENDPOINTS.ADMIN.LAYOUT_CUSTOMIZATION}`, {
      positions
    });
  }

  resetDrafts (): void {
    this.currentPositions.set(new Map(this.originalPositions()));
  }

  publishDrafts (): void {
    this.originalPositions.set(new Map(this.currentPositions()));
    this.saveToLocalStorage();
  }

  initialize (customization: LayoutCustomization): void {
    const positionsMap = new Map<string, LayoutPosition>();
    customization.positions.forEach(pos => positionsMap.set(pos.elementId, pos));
    this.originalPositions.set(positionsMap);
    this.currentPositions.set(new Map(positionsMap));
  }

  clear (): void {
    this.originalPositions.set(new Map());
    this.currentPositions.set(new Map());
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private loadFromLocalStorage (): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved) as LayoutPosition[];
      const positionsMap = new Map<string, LayoutPosition>();
      data.forEach(pos => positionsMap.set(pos.elementId, pos));
      this.originalPositions.set(positionsMap);
      this.currentPositions.set(new Map(positionsMap));
    }
  }

  private saveToLocalStorage (): void {
    const positions = Array.from(this.originalPositions().values());
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(positions));
  }

  private isSamePosition (a: LayoutPosition, b: LayoutPosition): boolean {
    return a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height;
  }

  private computeChangedKeys (): string[] {
    const original = this.originalPositions();
    const current = this.currentPositions();
    const changed: string[] = [];

    for (const [key, currentPos] of current.entries()) {
      const originalPos = original.get(key);
      if (!originalPos || !this.isSamePosition(originalPos, currentPos)) changed.push(key);
    }

    for (const key of original.keys()) {
      if (!current.has(key)) changed.push(key);
    }

    return changed;
  }
}
