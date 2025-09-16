// Shared types and constants
// This file will contain shared TypeScript types and utilities

export interface User {
  id: string;
  email: string;
  name?: string;
}

// Note types
export interface Note {
  id: string;
  orgId: string;
  userId: string;
  subjectId?: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  subjectId?: string;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  subjectId?: string;
}

// Organization and tenant types
export type OrgTenantId = string;

// Key builders for consistent key generation
export const KeyBuilders = {
  /**
   * Build a note key for storage
   * Format: note:{orgId}:{noteId}
   */
  noteKey: (orgId: OrgTenantId, noteId: string): string => `note:${orgId}:${noteId}`,
  
  /**
   * Build a user notes index key
   * Format: user_notes:{orgId}:{userId}
   */
  userNotesKey: (orgId: OrgTenantId, userId: string): string => `user_notes:${orgId}:${userId}`,
  
  /**
   * Build an organization notes index key
   * Format: org_notes:{orgId}
   */
  orgNotesKey: (orgId: OrgTenantId): string => `org_notes:${orgId}`,
  
  /**
   * Build a subject notes key (for future use)
   * Format: subject_notes:{orgId}:{subjectId}
   */
  subjectNotesKey: (orgId: OrgTenantId, subjectId: string): string => `subject_notes:${orgId}:${subjectId}`,
  
} as const;

export const API_ENDPOINTS = {
  USERS: "/api/users",
  AUTH: "/api/auth",
} as const;

// Export role and claims types
export * from "./roles";
export * from "./claims";