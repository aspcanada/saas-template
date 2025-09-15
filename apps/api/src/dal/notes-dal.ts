import { Note, CreateNoteRequest, UpdateNoteRequest, OrgTenantId } from "@saas-template/shared";

/**
 * Data Access Layer interface for Notes
 * Provides a consistent interface for different storage implementations
 */
export interface NotesDal {
  /**
   * Create a new note
   */
  createNote(params: {
    orgId: OrgTenantId;
    userId: string;
    title: string;
    content: string;
  }): Promise<Note>;

  /**
   * Get a specific note by ID within an organization
   */
  getNote(params: {
    orgId: OrgTenantId;
    noteId: string;
  }): Promise<Note | null>;

  /**
   * List all notes for a user within an organization
   */
  listNotesByUser(params: {
    orgId: OrgTenantId;
    userId: string;
  }): Promise<Note[]>;

  /**
   * List all notes for an organization
   */
  listNotesByOrg(params: {
    orgId: OrgTenantId;
  }): Promise<Note[]>;

  /**
   * Update a note
   */
  updateNote(params: {
    orgId: OrgTenantId;
    noteId: string;
    updates: UpdateNoteRequest;
  }): Promise<Note | null>;

  /**
   * Delete a note
   */
  deleteNote(params: {
    orgId: OrgTenantId;
    noteId: string;
  }): Promise<boolean>;

  // Future methods for patient/provider notes (stubs for now)
  
  /**
   * List notes for a specific patient (stub for future implementation)
   */
  listNotesByPatient(params: {
    orgId: OrgTenantId;
    patientId: string;
  }): Promise<Note[]>;

  /**
   * List notes for a specific provider (stub for future implementation)
   */
  listNotesByProvider(params: {
    orgId: OrgTenantId;
    providerId: string;
  }): Promise<Note[]>;
}
