import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private readonly loadingSubject = new BehaviorSubject<{ isLoading: boolean; message?: string }>({
    isLoading: false
  });

  public readonly state$ = this.loadingSubject.asObservable();

  show (message: string = 'Loading...'): void {
    this.loadingSubject.next({ isLoading: true, message });
  }

  hide (): void {
    this.loadingSubject.next({ isLoading: false });
  }
}
