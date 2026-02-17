import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingStateService } from '../services/state/loading-state.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingStateService);
  const skipLoading = req.headers.has('X-Skip-Loading');

  if (!skipLoading) {
    const loadingKey = generateLoadingKey(req.url);

    loadingService.startLoading(loadingKey);

    return next(req).pipe(
      finalize(() => {
        loadingService.stopLoading(loadingKey);
      })
    );
  }

  return next(req);
};

function generateLoadingKey (url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.replace(/\//g, '_').replace(/^_/, '') || 'api_request';
  } catch {
    return url.replace(/[^a-zA-Z0-9]/g, '_');
  }
}
