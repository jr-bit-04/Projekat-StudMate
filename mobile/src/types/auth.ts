export type UserRole = "student" | "admin" | "partner";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  admin_module?: string | null;
  faculty?: string | null;
  dorm?: string | null;
  index_number?: string | null;
  profile_image_url?: string | null;
  location_tracking_consent?: boolean;
  role?: UserRole;
  created_at?: string | null;
  updated_at?: string | null;
  last_login_at?: string | null;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  faculty: string;
  dorm: string;
  index_number: string;
  location_tracking_consent: boolean;
  role?: UserRole;
  admin_module?: string | null;
}
