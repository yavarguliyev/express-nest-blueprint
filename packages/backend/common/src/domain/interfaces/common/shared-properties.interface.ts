export interface WithOptionalDescription {
  description?: string;
}

export interface WithStringKey {
  key: string;
}

export interface WithValue<V = unknown> {
  value: V;
}

export interface WithLabel {
  label: string;
}

export interface WithEmail {
  email: string;
}

export interface WithFirstName {
  firstName: string;
}

export interface WithLastName {
  lastName: string;
}

export interface WithRole<R = string> {
  role: R;
}

export interface WithIsActive {
  isActive: boolean;
}

export interface WithIsEmailVerified {
  isEmailVerified: boolean;
}

export interface WithData<D = unknown> {
  data: D;
}
