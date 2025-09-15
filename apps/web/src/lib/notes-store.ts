import { Note } from "../types/notes";

// In-memory store for notes
const notesStore = new Map<string, Note>();

export class NotesStore {
  static create(note: Omit<Note, "id" | "createdAt" | "updatedAt">): Note {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newNote: Note = {
      ...note,
      id,
      createdAt: now,
      updatedAt: now,
    };
    notesStore.set(id, newNote);
    return newNote;
  }

  static getAll(): Note[] {
    return Array.from(notesStore.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  static getById(id: string): Note | undefined {
    return notesStore.get(id);
  }

  static update(id: string, updates: Partial<Pick<Note, "title" | "content">>): Note | undefined {
    const existing = notesStore.get(id);
    if (!existing) return undefined;

    const updated: Note = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    notesStore.set(id, updated);
    return updated;
  }

  static delete(id: string): boolean {
    return notesStore.delete(id);
  }
}
