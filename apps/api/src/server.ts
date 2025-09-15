import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { jwtVerify, createRemoteJWKSet } from "jose";
import fetch from "node-fetch";
import { Note, CreateNoteRequest, UpdateNoteRequest, OrgTenantId } from "@saas-template/shared";
import { DalFactory } from "./dal/dal-factory";

// Note: Types are now imported from @saas-template/shared

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

// Note: Using any for Hono context to avoid complex typing issues

// Get DAL instance
const notesDal = DalFactory.getNotesDal();

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
async function authMiddleware(c: any, next: () => Promise<void>) {
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
// GET /notes - Get all notes for the authenticated user
app.get("/notes", authMiddleware, async (c: any) => {
  try {
    const auth = c.get("auth") as AuthUser;
    console.log(`Fetching notes for user: ${auth.userId}, org: ${auth.orgId}`);
    
    const notes = await notesDal.listNotesByUser({
      orgId: auth.orgId,
      userId: auth.userId,
    });
    return c.json(notes);
  } catch (error) {
    console.error("Failed to fetch notes:", error);
    return c.json({ error: "Failed to fetch notes" }, 500);
  }
});

// POST /notes - Create a new note
app.post("/notes", authMiddleware, async (c: any) => {
  try {
    const auth = c.get("auth") as AuthUser;
    const body: CreateNoteRequest = await c.req.json();
    
    if (!body.title || !body.content) {
      return c.json({ error: "Title and content are required" }, 400);
    }

    console.log(`Creating note for user: ${auth.userId}, org: ${auth.orgId}`);

    const note = await notesDal.createNote({
      orgId: auth.orgId,
      userId: auth.userId,
      title: body.title,
      content: body.content,
    });

    return c.json(note, 201);
  } catch (error) {
    console.error("Failed to create note:", error);
    return c.json({ error: "Failed to create note" }, 500);
  }
});

// GET /notes/:id - Get a specific note
app.get("/notes/:id", authMiddleware, async (c: any) => {
  try {
    const auth = c.get("auth") as AuthUser;
    const id = c.req.param("id");
    
    console.log(`Fetching note ${id} for user: ${auth.userId}, org: ${auth.orgId}`);
    
    const note = await notesDal.getNote({
      orgId: auth.orgId,
      noteId: id,
    });
    
    if (!note) {
      return c.json({ error: "Note not found" }, 404);
    }

    return c.json(note);
  } catch (error) {
    console.error("Failed to fetch note:", error);
    return c.json({ error: "Failed to fetch note" }, 500);
  }
});

// PATCH /notes/:id - Update a specific note
app.patch("/notes/:id", authMiddleware, async (c: any) => {
  try {
    const auth = c.get("auth") as AuthUser;
    const id = c.req.param("id");
    const body: UpdateNoteRequest = await c.req.json();
    
    console.log(`Updating note ${id} for user: ${auth.userId}, org: ${auth.orgId}`);
    
    const updatedNote = await notesDal.updateNote({
      orgId: auth.orgId,
      noteId: id,
      updates: body,
    });
    
    if (!updatedNote) {
      return c.json({ error: "Note not found" }, 404);
    }

    return c.json(updatedNote);
  } catch (error) {
    console.error("Failed to update note:", error);
    return c.json({ error: "Failed to update note" }, 500);
  }
});

// DELETE /notes/:id - Delete a specific note
app.delete("/notes/:id", authMiddleware, async (c: any) => {
  try {
    const auth = c.get("auth") as AuthUser;
    const id = c.req.param("id");
    
    console.log(`Deleting note ${id} for user: ${auth.userId}, org: ${auth.orgId}`);
    
    const deleted = await notesDal.deleteNote({
      orgId: auth.orgId,
      noteId: id,
    });
    
    if (!deleted) {
      return c.json({ error: "Note not found" }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to delete note:", error);
    return c.json({ error: "Failed to delete note" }, 500);
  }
});

// Billing endpoints (protected)
// POST /billing/checkout - Create checkout session
app.post("/billing/checkout", authMiddleware, async (c: any) => {
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
app.post("/billing/portal", authMiddleware, async (c: any) => {
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
