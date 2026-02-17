import { Routes } from '@angular/router';
import { authGuard } from '@app/common';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
  },
  {
    path: '',
    loadComponent: () => import('./shared/components/layout/layout').then((m) => m.Layout),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'database',
        loadComponent: () => import('./features/database/database').then((m) => m.Database),
      },
      {
        path: 'health',
        loadComponent: () => import('./features/health/health').then((m) => m.Health),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings').then((m) => m.Settings),
      },
      {
        path: 'theme-editor',
        loadComponent: () =>
          import('./features/theme-editor/theme-editor').then((m) => m.ThemeEditor),
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
