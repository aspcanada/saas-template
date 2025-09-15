import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";

// Types for notes (mirroring the web app)
interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateNoteRequest {
  title: string;
  content: string;
}

interface UpdateNoteRequest {
  title?: string;
  content?: string;
}

// In-memory store for notes (mirroring the web app)
const notesStore = new Map<string, Note>();

class NotesStore {
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

// Create Hono app
const app = new Hono();

// Add CORS middleware
app.use("*", cors({
  origin: ["http://localhost:3000"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Health endpoint
app.get("/health", (c) => {
  return c.json({ ok: true });
});

// Notes CRUD endpoints
// GET /notes - Get all notes
app.get("/notes", (c) => {
  try {
    const notes = NotesStore.getAll();
    return c.json(notes);
  } catch (error) {
    return c.json({ error: "Failed to fetch notes" }, 500);
  }
});

// POST /notes - Create a new note
app.post("/notes", async (c) => {
  try {
    const body: CreateNoteRequest = await c.req.json();
    
    if (!body.title || !body.content) {
      return c.json({ error: "Title and content are required" }, 400);
    }

    const note = NotesStore.create({
      title: body.title,
      content: body.content,
    });

    return c.json(note, 201);
  } catch (error) {
    return c.json({ error: "Failed to create note" }, 500);
  }
});

// GET /notes/:id - Get a specific note
app.get("/notes/:id", (c) => {
  try {
    const id = c.req.param("id");
    const note = NotesStore.getById(id);
    
    if (!note) {
      return c.json({ error: "Note not found" }, 404);
    }

    return c.json(note);
  } catch (error) {
    return c.json({ error: "Failed to fetch note" }, 500);
  }
});

// PATCH /notes/:id - Update a specific note
app.patch("/notes/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body: UpdateNoteRequest = await c.req.json();
    
    const updatedNote = NotesStore.update(id, body);
    
    if (!updatedNote) {
      return c.json({ error: "Note not found" }, 404);
    }

    return c.json(updatedNote);
  } catch (error) {
    return c.json({ error: "Failed to update note" }, 500);
  }
});

// DELETE /notes/:id - Delete a specific note
app.delete("/notes/:id", (c) => {
  try {
    const id = c.req.param("id");
    const deleted = NotesStore.delete(id);
    
    if (!deleted) {
      return c.json({ error: "Note not found" }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to delete note" }, 500);
  }
});

// Billing endpoints
// POST /billing/checkout - Create checkout session
app.post("/billing/checkout", async (c) => {
  try {
    const body = await c.req.json();
    const { priceId } = body;

    if (!priceId) {
      return c.json({ error: "priceId is required" }, 400);
    }

    // Mock response - in a real app, this would create a Stripe checkout session
    const mockCheckoutUrl = `https://billing.example/checkout?priceId=${priceId}&sessionId=mock_${Date.now()}`;

    return c.json({
      url: mockCheckoutUrl,
      priceId,
      sessionId: `mock_${Date.now()}`,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return c.json({ error: "Failed to create checkout session" }, 500);
  }
});

// POST /billing/portal - Create customer portal session
app.post("/billing/portal", async (c) => {
  try {
    // Mock response - in a real app, this would create a Stripe customer portal session
    const mockPortalUrl = `https://billing.example/portal?customerId=mock_customer_${Date.now()}`;

    return c.json({
      url: mockPortalUrl,
      customerId: `mock_customer_${Date.now()}`,
    });
  } catch (error) {
    console.error("Portal error:", error);
    return c.json({ error: "Failed to create portal session" }, 500);
  }
});

// Start server
const port = process.env.PORT || 4000;

console.log(`🚀 API server starting on port ${port}`);
console.log(`📝 Health check: http://localhost:${port}/health`);
console.log(`📋 Notes API: http://localhost:${port}/notes`);
console.log(`💳 Billing API: http://localhost:${port}/billing`);

// Start the server
serve({
  fetch: app.fetch,
  port: Number(port),
});
