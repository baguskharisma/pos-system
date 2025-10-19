import type { UserRole } from "@prisma/client";

/**
 * Auth-related type definitions
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  employeeId?: string | null;
  avatar?: string | null;
  phone?: string | null;
  isActive: boolean;
  emailVerified?: Date | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: UserRole;
  employeeId?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  employeeId?: string | null;
  avatar?: string | null;
  phone?: string | null;
  isActive: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: User;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: "Bearer";
}

export interface AuthError {
  code: string;
  message: string;
  details?: string[];
}

// Role permission types
export type AdminRole = "SUPER_ADMIN" | "ADMIN";
export type StaffRole = "CASHIER" | "STAFF";
export type AllRoles = AdminRole | StaffRole;

// Permission checks
export const isAdminRole = (role: UserRole): role is AdminRole => {
  return role === "SUPER_ADMIN" || role === "ADMIN";
};

export const isStaffRole = (role: UserRole): role is StaffRole => {
  return role === "CASHIER" || role === "STAFF";
};

export const isSuperAdmin = (role: UserRole): boolean => {
  return role === "SUPER_ADMIN";
};
