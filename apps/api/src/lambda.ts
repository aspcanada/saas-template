// Lambda handlers for API Gateway
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { DalFactory } from "./dal/dal-factory";
import { jwtVerify, createRemoteJWKSet } from "jose";
import fetch from "node-fetch";
import Stripe from "stripe";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// Initialize services
const notesDal = DalFactory.getNotesDal();

// Initialize Stripe
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
  });
}

// Initialize S3
let s3Client: S3Client | null = null;
let s3BucketName: string | null = null;
if (process.env.BUCKET_NAME && process.env.AWS_REGION) {
  s3Client = new S3Client({ region: process.env.AWS_REGION });
  s3BucketName = process.env.BUCKET_NAME;
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

// JWKS cache
let jwksCache: any = null;
let jwksCacheExpiry = 0;

async function getJWKS() {
  const now = Date.now();
  
  if (jwksCache && now < jwksCacheExpiry) {
    return jwksCache;
  }

  try {
    const response = await fetch(process.env.CLERK_JWKS_URL!);
    if (!response.ok) {
      throw new Error(`Failed to fetch JWKS: ${response.status}`);
    }
    
    jwksCache = await response.json();
    jwksCacheExpiry = now + 3600000; // Cache for 1 hour
    return jwksCache;
  } catch (error) {
    console.error("Failed to fetch JWKS:", error);
    throw new Error("Failed to fetch JWKS");
  }
}

// Auth middleware
async function authenticate(event: APIGatewayProxyEvent): Promise<AuthUser> {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const token = authHeader.substring(7);
  
  try {
    const jwks = await getJWKS();
    const JWKS = createRemoteJWKSet(new URL(process.env.CLERK_JWKS_URL!));
    
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: process.env.CLERK_JWT_ISSUER,
    });

    const jwtPayload = payload as JWTPayload;
    
    return {
      userId: jwtPayload.sub,
      orgId: jwtPayload.org_id || "demo-org",
    };
  } catch (error) {
    console.error("JWT verification failed:", error);
    throw new Error("Invalid token");
  }
}

// Helper function to create API Gateway response
function createResponse(statusCode: number, body: any, headers: Record<string, string> = {}): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      ...headers,
    },
    body: JSON.stringify(body),
  };
}

// Health check handler
export const health = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  return createResponse(200, { ok: true });
};

// Notes handlers
export const notesList = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    const auth = await authenticate(event);
    
    if (event.httpMethod === "GET") {
      const notes = await notesDal.listNotesByUser({
        orgId: auth.orgId,
        userId: auth.userId,
      });
      return createResponse(200, notes);
    }
    
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const note = await notesDal.createNote({
        orgId: auth.orgId,
        userId: auth.userId,
        subjectId: body.subjectId,
        title: body.title,
        content: body.content,
      });
      return createResponse(201, note);
    }
    
    return createResponse(405, { error: "Method not allowed" });
  } catch (error) {
    console.error("Notes list error:", error);
    if (error instanceof Error && error.message.includes("Authorization")) {
      return createResponse(401, { error: error.message });
    }
    return createResponse(500, { error: "Internal server error" });
  }
};

export const notesGet = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    const auth = await authenticate(event);
    const noteId = event.pathParameters?.id;
    
    if (!noteId) {
      return createResponse(400, { error: "Note ID is required" });
    }
    
    if (event.httpMethod === "GET") {
      const note = await notesDal.getNote({
        orgId: auth.orgId,
        noteId,
      });
      
      if (!note) {
        return createResponse(404, { error: "Note not found" });
      }
      
      return createResponse(200, note);
    }
    
    if (event.httpMethod === "PATCH") {
      const body = JSON.parse(event.body || "{}");
      const updatedNote = await notesDal.updateNote({
        orgId: auth.orgId,
        noteId,
        title: body.title,
        content: body.content,
        subjectId: body.subjectId,
      });
      
      if (!updatedNote) {
        return createResponse(404, { error: "Note not found" });
      }
      
      return createResponse(200, updatedNote);
    }
    
    if (event.httpMethod === "DELETE") {
      const deleted = await notesDal.deleteNote({
        orgId: auth.orgId,
        noteId,
      });
      
      if (!deleted) {
        return createResponse(404, { error: "Note not found" });
      }
      
      return createResponse(200, { success: true });
    }
    
    return createResponse(405, { error: "Method not allowed" });
  } catch (error) {
    console.error("Notes get error:", error);
    if (error instanceof Error && error.message.includes("Authorization")) {
      return createResponse(401, { error: error.message });
    }
    return createResponse(500, { error: "Internal server error" });
  }
};

// Billing handlers
export const billingCheckout = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    const auth = await authenticate(event);
    const body = JSON.parse(event.body || "{}");
    const { priceId } = body;

    if (!priceId) {
      return createResponse(400, { error: "priceId is required" });
    }

    if (!stripe) {
      const mockCheckoutUrl = `https://billing.example/checkout?priceId=${priceId}&sessionId=mock_${Date.now()}&userId=${auth.userId}`;
      return createResponse(200, {
        url: mockCheckoutUrl,
        priceId,
        sessionId: `mock_${Date.now()}`,
        mock: true,
      });
    }

    // Get or create customer by orgId
    const orgId = auth.orgId || "demo-org";
    let customer;
    
    try {
      const customers = await stripe.customers.list({ limit: 100 });
      const existingCustomer = customers.data.find(c => c.metadata?.orgId === orgId);
      
      if (existingCustomer) {
        customer = existingCustomer;
      } else {
        customer = await stripe.customers.create({
          metadata: { orgId, userId: auth.userId },
        });
      }
    } catch (error) {
      console.error("Customer lookup/creation error:", error);
      throw new Error("Failed to get or create customer");
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: process.env.STRIPE_SUCCESS_URL || "https://your-domain.com/app/billing?success=true",
      cancel_url: process.env.STRIPE_CANCEL_URL || "https://your-domain.com/app/billing?canceled=true",
      metadata: { orgId, userId: auth.userId },
    });

    return createResponse(200, {
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Billing checkout error:", error);
    if (error instanceof Error && error.message.includes("Authorization")) {
      return createResponse(401, { error: error.message });
    }
    return createResponse(500, { error: "Failed to create checkout session" });
  }
};

export const billingPortal = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    const auth = await authenticate(event);
    
    if (!stripe) {
      const mockPortalUrl = `https://billing.example/portal?customerId=mock_customer_${auth.userId}_${Date.now()}`;
      return createResponse(200, {
        url: mockPortalUrl,
        customerId: `mock_customer_${auth.userId}`,
        mock: true,
      });
    }

    const orgId = auth.orgId || "demo-org";
    const customers = await stripe.customers.list({ limit: 100 });
    const customer = customers.data.find(c => c.metadata?.orgId === orgId);

    if (!customer) {
      return createResponse(404, { error: "No customer found for this organization" });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: process.env.STRIPE_RETURN_URL || "https://your-domain.com/app/billing",
    });

    return createResponse(200, {
      url: session.url,
      customerId: customer.id,
    });
  } catch (error) {
    console.error("Billing portal error:", error);
    if (error instanceof Error && error.message.includes("Authorization")) {
      return createResponse(401, { error: error.message });
    }
    return createResponse(500, { error: "Failed to create portal session" });
  }
};

export const billingWebhook = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    const body = event.body || "";
    const signature = event.headers["stripe-signature"] || event.headers["Stripe-Signature"];

    if (!signature) {
      console.error("Missing stripe-signature header");
      return createResponse(400, { error: "Missing stripe-signature header" });
    }

    if (!stripe) {
      console.warn("Stripe not configured, ignoring webhook");
      return createResponse(200, { received: true, mock: true });
    }

    // Verify webhook signature
    let webhookEvent;
    try {
      webhookEvent = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return createResponse(400, { error: "Invalid signature" });
    }

    console.log(`Processing webhook event: ${webhookEvent.type}`);

    // Handle different event types
    switch (webhookEvent.type) {
      case "checkout.session.completed": {
        const session = webhookEvent.data.object as any;
        const orgId = session.metadata?.orgId;
        const customerId = session.customer;

        if (orgId && customerId) {
          console.log(`Checkout completed for org: ${orgId}, customer: ${customerId}`);
          // TODO: Store in DynamoDB with PK=ORG#orgId, SK=BILLING#CUSTOMER
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = webhookEvent.data.object as any;
        const customerId = subscription.customer;

        // Get customer to find orgId
        const customer = await stripe.customers.retrieve(customerId);
        const orgId = (customer as any).metadata?.orgId;

        if (orgId) {
          const priceId = subscription.items?.data?.[0]?.price?.id;
          let plan = "FREE";
          
          if (priceId === process.env.STRIPE_PRICE_PRO) {
            plan = "CLINIC";
          } else if (priceId === process.env.STRIPE_PRICE_BUSINESS) {
            plan = "PRACTICE_PLUS";
          }

          console.log(`Subscription ${webhookEvent.type} for org: ${orgId}, plan: ${plan}, status: ${subscription.status}`);
          // TODO: Store in DynamoDB with PK=ORG#orgId, SK=ENTITLEMENT#PLAN
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${webhookEvent.type}`);
    }

    return createResponse(200, { received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return createResponse(500, { error: "Webhook processing failed" });
  }
};

// Billing entitlement handler
export const billingEntitlement = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    const auth = await authenticate(event);
    const orgId = auth.orgId || "demo-org";

    console.log(`Getting entitlement for user: ${auth.userId}, org: ${orgId}`);

    // If Stripe is not configured, return mock response
    if (!stripe) {
      return createResponse(200, {
        plan: "FREE",
        status: "active",
        currentPeriodEnd: null,
        mock: true,
      });
    }

    // Get customer by orgId
    const customers = await stripe.customers.list({ limit: 100 });
    const customer = customers.data.find(c => c.metadata?.orgId === orgId);

    if (!customer) {
      return createResponse(200, {
        plan: "FREE",
        status: "active",
        currentPeriodEnd: null,
      });
    }

    // Get active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return createResponse(200, {
        plan: "FREE",
        status: "active",
        currentPeriodEnd: null,
      });
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0]?.price.id;
    
    // Map price ID to plan name
    let plan = "FREE";
    if (priceId === process.env.STRIPE_PRICE_PRO) {
      plan = "CLINIC";
    } else if (priceId === process.env.STRIPE_PRICE_BUSINESS) {
      plan = "PRACTICE_PLUS";
    }

    return createResponse(200, {
      plan,
      status: subscription.status,
      currentPeriodEnd: (subscription as any).current_period_end || null,
    });
  } catch (error) {
    console.error("Entitlement error:", error);
    if (error instanceof Error && error.message.includes("Authorization")) {
      return createResponse(401, { error: error.message });
    }
    return createResponse(500, { error: "Failed to get billing entitlement" });
  }
};

// Attachments handler
export const attachmentsPresign = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    const auth = await authenticate(event);
    const body = JSON.parse(event.body || "{}");
    const { contentType, maxSize = 5 * 1024 * 1024 } = body;

    if (!contentType) {
      return createResponse(400, { error: "contentType is required" });
    }

    const allowedTypes = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "application/pdf", "text/plain", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    
    if (!allowedTypes.includes(contentType)) {
      return createResponse(400, { 
        error: "Invalid content type. Allowed types: " + allowedTypes.join(", ") 
      });
    }

    if (maxSize > 5 * 1024 * 1024) {
      return createResponse(400, { 
        error: "File size too large. Maximum allowed: 5MB" 
      });
    }

    if (!s3Client || !s3BucketName) {
      return createResponse(400, { 
        error: "File upload not configured. BUCKET_NAME and AWS_REGION environment variables are required." 
      });
    }

    const orgId = auth.orgId || "demo-org";
    const fileId = uuidv4();
    const key = `${orgId}/${auth.userId}/${fileId}`;

    const command = new PutObjectCommand({
      Bucket: s3BucketName,
      Key: key,
      ContentType: contentType,
      ContentLength: maxSize,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 300 // 5 minutes
    });

    return createResponse(200, {
      url: presignedUrl,
      key,
      fields: {
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    console.error("Presign error:", error);
    if (error instanceof Error && error.message.includes("Authorization")) {
      return createResponse(401, { error: error.message });
    }
    return createResponse(500, { error: "Failed to generate presigned URL" });
  }
};
