export interface AuthResponseDto {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthResponseUser;
}

export interface AuthResponseUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

export interface UserWithPassword extends AuthResponseUser {
  passwordHash: string;
}
