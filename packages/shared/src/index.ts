// Shared types and constants
// This file will contain shared TypeScript types and utilities

export interface User {
  id: string;
  email: string;
  name?: string;
}

export const API_ENDPOINTS = {
  USERS: "/api/users",
  AUTH: "/api/auth",
} as const;

// Export role and claims types
export * from "./roles";
export * from "./claims";