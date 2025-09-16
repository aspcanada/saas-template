# AI SaaS Template

A modern monorepo template for building AI-powered SaaS applications with Next.js, TypeScript, and AWS CDK.

## Project Structure

```
saas-template/
├── apps/
│   ├── web/                 # Next.js 14 application (App Router)
│   └── api/                 # Node.js API server with Hono
├── packages/
│   └── shared/              # Shared types and constants
├── infra/                   # AWS CDK v2 infrastructure definitions
├── package.json             # Root package.json with workspace configuration
├── tsconfig.base.json       # Base TypeScript configuration
├── .editorconfig            # Editor configuration
├── .gitignore              # Git ignore rules
└── .nvmrc                  # Node.js version specification (20)
```

## Workspaces

- **apps/web**: Next.js 14 application with App Router, TypeScript, and Tailwind CSS
- **apps/api**: Node.js API server with Hono, JWT authentication, and in-memory data store
- **packages/shared**: Shared TypeScript types, constants, and utilities
- **infra**: AWS CDK v2 infrastructure as code definitions

## Getting Started

### Prerequisites

- Node.js 20 (specified in `.nvmrc`)
- pnpm package manager
- Clerk account (for authentication)

### Installation

```bash
# Install dependencies for all workspaces
pnpm install
```

### Authentication Setup (Clerk)

1. **Create a Clerk account**:
   - Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
   - Sign up or sign in to your account

2. **Create a new application**:
   - Click "Add application"
   - Choose "Next.js" as the framework
   - Copy the API keys

3. **Configure environment variables**:
   
   **For the web app** (`apps/web/.env.local`):
   ```bash
   # Clerk configuration
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
   CLERK_SECRET_KEY=sk_test_your_actual_secret_here
   
   # API configuration
   API_BASE_URL=http://localhost:4000
   ```
   
   **For the API server** (`apps/api/.env.local`):
   ```bash
   # Clerk JWKS configuration
   CLERK_JWKS_URL=https://your-clerk-domain.clerk.accounts.dev/.well-known/jwks.json
   CLERK_JWT_ISSUER=https://your-clerk-domain.clerk.accounts.dev
   ```

4. **Test the authentication**:
   - Run `pnpm run dev` (starts both web app on :3000 and API server on :4000)
   - Visit `http://localhost:3000`
   - Click "Sign Up" to create an account
   - Click "Protected App" to test authentication
   - Test the Notes CRUD functionality (requires authentication)
   - Test the Billing functionality (requires authentication)

### Development

```bash
# Start both web app and API server concurrently
pnpm run dev

# Build all workspaces
pnpm run build

# Run linting across all workspaces
pnpm run lint

# Run type checking across all workspaces
pnpm run typecheck
```

### Individual Workspace Commands

```bash
# Web application
cd apps/web
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript type checking

# API server
cd apps/api
pnpm dev          # Start API server on port 4000
pnpm build        # Build TypeScript to JavaScript
pnpm typecheck    # Run TypeScript type checking

# Shared package
cd packages/shared
pnpm build        # Build shared types and utilities
pnpm typecheck    # Run TypeScript type checking

# Infrastructure
cd infra
pnpm build        # Build CDK definitions
pnpm typecheck    # Run TypeScript type checking
pnpm synth        # Synthesize CDK templates
pnpm cdk:bootstrap # Bootstrap CDK (first time only)
pnpm cdk:deploy   # Deploy infrastructure
pnpm cdk:destroy  # Destroy infrastructure
```

## Technology Stack

- **Frontend**: Next.js 14, React 19, TypeScript, Tailwind CSS
- **Authentication**: Clerk (Next.js integration)
- **Backend**: Node.js 22, TypeScript, Hono HTTP server
- **Database**: DynamoDB (production) / In-memory (development)
- **Billing**: Stripe (subscriptions, checkout, customer portal)
- **Infrastructure**: AWS CDK v2, TypeScript
- **Package Management**: pnpm workspaces
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

## Development Workflow

1. Make changes to the appropriate workspace
2. Run `pnpm run typecheck` to ensure type safety
3. Run `pnpm run lint` to check code quality
4. Run `pnpm run build` to build all workspaces
5. Test the web application with `pnpm run dev`

## API Server Features

The API server (`apps/api`) includes:

- **Hono HTTP server** running on port 4000
- **JWT authentication** using Clerk JWKS verification
- **Protected endpoints** for Notes and Billing operations
- **In-memory data store** for development (notes persist during server session)
- **CORS enabled** for web app integration
- **Health check endpoint** (`/health`)

### API Endpoints

**Health & Auth**:
- `GET /health` - Health check (public)

**Notes Management** (protected):
- `GET /notes` - Get all notes
- `POST /notes` - Create note
- `GET /notes/:id` - Get specific note
- `PATCH /notes/:id` - Update note
- `DELETE /notes/:id` - Delete note

**Billing Management** (protected):
- `POST /billing/checkout` - Create Stripe checkout session
- `POST /billing/portal` - Create Stripe customer portal session

## Authentication Features

The web application includes:

- **Sign In/Sign Up pages** (`/sign-in`, `/sign-up`) using Clerk components
- **Protected route** (`/app`) that redirects unauthenticated users to sign-in
- **User session management** with automatic redirects
- **JWT token integration** with API server
- **Responsive design** with Tailwind CSS

## Infrastructure Deployment

The infrastructure is defined using AWS CDK v2 and includes two stacks:

### CoreStack
- **DynamoDB Table**: On-demand billing with PK/SK and three GSIs for org-scoped data access
- **S3 Bucket**: Private bucket for file attachments with encryption and block public access

### ApiStack
- **API Gateway**: HTTP API with CORS for web domain
- **Lambda Functions**: Node.js functions for notes, billing, and attachments
- **Permissions**: Least-privilege access to DynamoDB and S3

### Prerequisites

- AWS CLI configured with appropriate credentials
- AWS CDK v2 installed globally: `npm install -g aws-cdk`

### Deployment Order

**Important**: Deploy stacks in this specific order:

1. **Deploy CoreStack first**:
```bash
pnpm -C infra cdk:deploy SaasTemplateCore
```

2. **Deploy ApiStack**:
```bash
pnpm -C infra cdk:deploy SaasTemplateApi
```

3. **Update web app environment**:
   - Get the API URL from the ApiStack outputs
   - Update `NEXT_PUBLIC_API_BASE_URL` in `apps/web/.env.local`
   - Rebuild the web app: `pnpm -C apps/web build`

### First-time Setup

```bash
# Bootstrap CDK (only needed once per AWS account/region)
pnpm -C infra cdk:bootstrap

# Deploy CoreStack
pnpm -C infra cdk:deploy SaasTemplateCore

# Deploy ApiStack
pnpm -C infra cdk:deploy SaasTemplateApi
```

### Infrastructure Details

- **DynamoDB Table**: `saas-template-core`
  - Primary Key: PK (string), SK (string)
  - GSI1: Subject → Notes (`ORG#<orgId>#SUBJECT#<subjectId>` → `NOTE#<noteId>#<createdAtISO>`)
  - GSI2: User → Notes (`ORG#<orgId>#USER#<userId>` → `NOTE#<noteId>#<createdAtISO>`)
  - GSI3: Role/Indexing (for future admin features)
  - Server-side encryption enabled
  - Removal policy: DESTROY (for template)

- **S3 Bucket**: `saas-template-attachments-<account>-<region>`
  - Private access only
  - Server-side encryption
  - Versioning disabled
  - Removal policy: DESTROY (for template)

## Billing Integration

The template includes full Stripe billing integration with subscription management:

### Features

- **Subscription Checkout**: Create Stripe checkout sessions for plan upgrades
- **Customer Portal**: Manage subscriptions, payment methods, and billing history
- **Plan Management**: Free, Pro, and Business tiers with environment-configurable pricing
- **Development Mode**: Works without Stripe configuration using mock responses

### Stripe Setup

1. **Create a Stripe account**:
   - Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
   - Sign up or sign in to your account

2. **Create products and prices**:
   - Create products for Free, Pro, and Business plans
   - Note down the Price IDs for each plan

3. **Configure environment variables**:
   
   **For the API server** (`apps/api/.env.local`):
   ```bash
   # Stripe configuration
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   STRIPE_PRICE_FREE=price_free_plan_id
   STRIPE_PRICE_PRO=price_pro_plan_id
   STRIPE_PRICE_BUSINESS=price_business_plan_id
   
   # Optional: Custom URLs (defaults to localhost)
   STRIPE_SUCCESS_URL=http://localhost:3000/app/billing?success=true
   STRIPE_CANCEL_URL=http://localhost:3000/app/billing?canceled=true
   STRIPE_RETURN_URL=http://localhost:3000/app/billing
   ```
   
   **For the web app** (`apps/web/.env.local`):
   ```bash
   # Stripe Price IDs (public)
   NEXT_PUBLIC_STRIPE_PRICE_FREE=price_free_plan_id
   NEXT_PUBLIC_STRIPE_PRICE_PRO=price_pro_plan_id
   NEXT_PUBLIC_STRIPE_PRICE_BUSINESS=price_business_plan_id
   ```

### Billing API Endpoints

- `POST /billing/checkout` - Create checkout session for plan upgrade
- `POST /billing/portal` - Create customer portal session for subscription management

### Development vs Production

**Local Development** (`pnpm run dev`):
- Uses HTTP server on port 4000
- Direct database access (DynamoDB or in-memory)
- Real-time development with hot reload
- No AWS Lambda cold starts

**Production Deployment** (Lambda + API Gateway):
- Serverless Lambda functions
- API Gateway for HTTP routing
- DynamoDB and S3 integration
- Auto-scaling and pay-per-request

**Billing Configuration**:

*Development Mode* (no Stripe config):
- Shows "Stripe not configured" message
- Plan buttons are disabled with tooltips
- Mock responses for testing billing flow
- `pnpm run dev` works out of the box

*Production Mode* (with Stripe config):
- Real Stripe checkout and portal sessions
- Customer management by organization ID
- Full subscription lifecycle management

### Testing Billing

1. **Without Stripe** (default):
   ```bash
   pnpm run dev
   # Visit http://localhost:3000/app/billing
   # See mock billing interface
   ```

2. **With Stripe** (configured):
   ```bash
   # Set environment variables in both apps
   pnpm run dev
   # Visit http://localhost:3000/app/billing
   # Test real Stripe checkout flow
   ```

## Next Steps

- Add testing framework and CI/CD pipeline
- Configure deployment pipelines for each environment
- Add user profile management
- Implement role-based access control
- Add webhook handlers for Stripe events
- Implement usage tracking and plan limits
- Add admin dashboard for subscription management