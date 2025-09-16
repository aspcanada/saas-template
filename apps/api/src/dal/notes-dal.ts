import { Note, OrgTenantId } from "@saas-template/shared";

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
    subjectId?: string;
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
   * List all notes for a subject (patient, student, client, etc.)
   */
  listNotesBySubject(params: { 
    orgId: string; 
    subjectId: string 
  }): Promise<Note[]>;
  

  /**
   * Update a note
   */
  updateNote(params: {
    orgId: OrgTenantId;
    noteId: string;
    title?: string;
    content?: string;
    subjectId?: string;
  }): Promise<Note | null>;

  /**
   * Delete a note
   */
  deleteNote(params: {
    orgId: OrgTenantId;
    noteId: string;
  }): Promise<boolean>;

}
