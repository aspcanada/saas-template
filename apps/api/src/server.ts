import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { jwtVerify, createRemoteJWKSet } from "jose";
import fetch from "node-fetch";

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

// Auth types
interface AuthUser {
  userId: string;
  orgId: string;
}

interface JWTPayload {
  sub: string;
  org_id?: string;
  [key: string]: any;
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

// JWKS cache for Clerk
let jwksCache: any = null;
let jwksCacheExpiry = 0;

async function getJWKS() {
  const now = Date.now();
  
  // Return cached JWKS if still valid (cache for 1 hour)
  if (jwksCache && now < jwksCacheExpiry) {
    return jwksCache;
  }

  const jwksUrl = process.env.CLERK_JWKS_URL;
  if (!jwksUrl) {
    throw new Error("CLERK_JWKS_URL environment variable is required");
  }

  try {
    const response = await fetch(jwksUrl);
    const jwks = await response.json();
    
    // Cache for 1 hour
    jwksCache = jwks;
    jwksCacheExpiry = now + (60 * 60 * 1000);
    
    return jwks;
  } catch (error) {
    console.error("Failed to fetch JWKS:", error);
    throw new Error("Failed to fetch JWKS");
  }
}

// Auth middleware
async function authMiddleware(c: any, next: any) {
  try {
    const authHeader = c.req.header("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Missing or invalid Authorization header" }, 401);
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    // Get JWKS
    const jwks = await getJWKS();
    const JWKS = createRemoteJWKSet(new URL(process.env.CLERK_JWKS_URL!));
    
    // Verify JWT
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: process.env.CLERK_JWT_ISSUER || "https://clerk.dev",
    });

    const jwtPayload = payload as JWTPayload;
    
    // Extract user info
    const authUser: AuthUser = {
      userId: jwtPayload.sub,
      orgId: jwtPayload.org_id || "demo",
    };

    // Attach auth info to context
    c.set("auth", authUser);
    
    await next();
  } catch (error) {
    console.error("Auth verification failed:", error);
    return c.json({ error: "Invalid or expired token" }, 401);
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

// Notes CRUD endpoints (protected)
// GET /notes - Get all notes
app.get("/notes", authMiddleware, (c) => {
  try {
    const auth = c.get("auth") as AuthUser;
    console.log(`Fetching notes for user: ${auth.userId}, org: ${auth.orgId}`);
    
    const notes = NotesStore.getAll();
    return c.json(notes);
  } catch (error) {
    return c.json({ error: "Failed to fetch notes" }, 500);
  }
});

// POST /notes - Create a new note
app.post("/notes", authMiddleware, async (c) => {
  try {
    const auth = c.get("auth") as AuthUser;
    const body: CreateNoteRequest = await c.req.json();
    
    if (!body.title || !body.content) {
      return c.json({ error: "Title and content are required" }, 400);
    }

    console.log(`Creating note for user: ${auth.userId}, org: ${auth.orgId}`);

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
app.get("/notes/:id", authMiddleware, (c) => {
  try {
    const auth = c.get("auth") as AuthUser;
    const id = c.req.param("id");
    
    console.log(`Fetching note ${id} for user: ${auth.userId}, org: ${auth.orgId}`);
    
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
app.patch("/notes/:id", authMiddleware, async (c) => {
  try {
    const auth = c.get("auth") as AuthUser;
    const id = c.req.param("id");
    const body: UpdateNoteRequest = await c.req.json();
    
    console.log(`Updating note ${id} for user: ${auth.userId}, org: ${auth.orgId}`);
    
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
app.delete("/notes/:id", authMiddleware, (c) => {
  try {
    const auth = c.get("auth") as AuthUser;
    const id = c.req.param("id");
    
    console.log(`Deleting note ${id} for user: ${auth.userId}, org: ${auth.orgId}`);
    
    const deleted = NotesStore.delete(id);
    
    if (!deleted) {
      return c.json({ error: "Note not found" }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to delete note" }, 500);
  }
});

// Billing endpoints (protected)
// POST /billing/checkout - Create checkout session
app.post("/billing/checkout", authMiddleware, async (c) => {
  try {
    const auth = c.get("auth") as AuthUser;
    const body = await c.req.json();
    const { priceId } = body;

    if (!priceId) {
      return c.json({ error: "priceId is required" }, 400);
    }

    console.log(`Creating checkout for user: ${auth.userId}, org: ${auth.orgId}, priceId: ${priceId}`);

    // Mock response - in a real app, this would create a Stripe checkout session
    const mockCheckoutUrl = `https://billing.example/checkout?priceId=${priceId}&sessionId=mock_${Date.now()}&userId=${auth.userId}`;

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
app.post("/billing/portal", authMiddleware, async (c) => {
  try {
    const auth = c.get("auth") as AuthUser;
    
    console.log(`Creating portal for user: ${auth.userId}, org: ${auth.orgId}`);

    // Mock response - in a real app, this would create a Stripe customer portal session
    const mockPortalUrl = `https://billing.example/portal?customerId=mock_customer_${auth.userId}_${Date.now()}`;

    return c.json({
      url: mockPortalUrl,
      customerId: `mock_customer_${auth.userId}`,
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

// Check for required environment variables
if (!process.env.CLERK_JWKS_URL) {
  console.warn("⚠️  CLERK_JWKS_URL not set. Auth will fail. Set it to your Clerk JWKS URL.");
  console.warn("   Example: https://your-clerk-domain.clerk.accounts.dev/.well-known/jwks.json");
}

// Start the server
serve({
  fetch: app.fetch,
  port: Number(port),
});
