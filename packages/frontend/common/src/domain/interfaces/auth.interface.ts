import { UserRole } from '../enums/auth.enum';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type Permission = string;
