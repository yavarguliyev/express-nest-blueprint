import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private readonly loadingSubject = new BehaviorSubject<{ isLoading: boolean; message?: string }>({
    isLoading: false
  });
  public readonly state$: Observable<{ isLoading: boolean; message?: string }> = this.loadingSubject.asObservable();

  show (message: string = 'Loading...'): void {
    this.loadingSubject.next({ isLoading: true, message });
  }

  hide (): void {
    this.loadingSubject.next({ isLoading: false });
  }
}
