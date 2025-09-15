import { NotesDal } from "./notes-dal";
import { Note, CreateNoteRequest, UpdateNoteRequest, OrgTenantId, KeyBuilders } from "@saas-template/shared";

/**
 * In-memory implementation of NotesDal
 * Uses Map-based storage for development and testing
 */
export class InMemoryNotesDal implements NotesDal {
  private notesStore = new Map<string, Note>();

  async createNote(params: {
    orgId: OrgTenantId;
    userId: string;
    title: string;
    content: string;
  }): Promise<Note> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const note: Note = {
      id,
      orgId: params.orgId,
      userId: params.userId,
      title: params.title,
      content: params.content,
      createdAt: now,
      updatedAt: now,
    };

    const key = KeyBuilders.noteKey(params.orgId, id);
    this.notesStore.set(key, note);
    
    return note;
  }

  async getNote(params: {
    orgId: OrgTenantId;
    noteId: string;
  }): Promise<Note | null> {
    const key = KeyBuilders.noteKey(params.orgId, params.noteId);
    return this.notesStore.get(key) || null;
  }

  async listNotesByUser(params: {
    orgId: OrgTenantId;
    userId: string;
  }): Promise<Note[]> {
    const notes = Array.from(this.notesStore.values())
      .filter(note => note.orgId === params.orgId && note.userId === params.userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return notes;
  }

  async listNotesByOrg(params: {
    orgId: OrgTenantId;
  }): Promise<Note[]> {
    const notes = Array.from(this.notesStore.values())
      .filter(note => note.orgId === params.orgId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return notes;
  }

  async updateNote(params: {
    orgId: OrgTenantId;
    noteId: string;
    updates: UpdateNoteRequest;
  }): Promise<Note | null> {
    const key = KeyBuilders.noteKey(params.orgId, params.noteId);
    const existing = this.notesStore.get(key);
    
    if (!existing) {
      return null;
    }

    const updated: Note = {
      ...existing,
      ...params.updates,
      updatedAt: new Date().toISOString(),
    };

    this.notesStore.set(key, updated);
    return updated;
  }

  async deleteNote(params: {
    orgId: OrgTenantId;
    noteId: string;
  }): Promise<boolean> {
    const key = KeyBuilders.noteKey(params.orgId, params.noteId);
    return this.notesStore.delete(key);
  }

  // Stub implementations for future features
  async listNotesByPatient(params: {
    orgId: OrgTenantId;
    patientId: string;
  }): Promise<Note[]> {
    // TODO: Implement patient notes filtering
    // For now, return empty array
    console.log(`TODO: Implement listNotesByPatient for orgId=${params.orgId}, patientId=${params.patientId}`);
    return [];
  }

  async listNotesByProvider(params: {
    orgId: OrgTenantId;
    providerId: string;
  }): Promise<Note[]> {
    // TODO: Implement provider notes filtering
    // For now, return empty array
    console.log(`TODO: Implement listNotesByProvider for orgId=${params.orgId}, providerId=${params.providerId}`);
    return [];
  }
}
