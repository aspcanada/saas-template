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
```

## Technology Stack

- **Frontend**: Next.js 14, React 19, TypeScript, Tailwind CSS
- **Authentication**: Clerk (Next.js integration)
- **Backend**: Node.js 22, TypeScript, AWS Lambda
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

- `GET /health` - Health check (public)
- `GET /notes` - Get all notes (protected)
- `POST /notes` - Create note (protected)
- `GET /notes/:id` - Get specific note (protected)
- `PATCH /notes/:id` - Update note (protected)
- `DELETE /notes/:id` - Delete note (protected)
- `POST /billing/checkout` - Create checkout session (protected)
- `POST /billing/portal` - Create customer portal session (protected)

## Authentication Features

The web application includes:

- **Sign In/Sign Up pages** (`/sign-in`, `/sign-up`) using Clerk components
- **Protected route** (`/app`) that redirects unauthenticated users to sign-in
- **User session management** with automatic redirects
- **JWT token integration** with API server
- **Responsive design** with Tailwind CSS

## Next Steps

- Implement API routes and database integration
- Set up AWS infrastructure with CDK
- Add testing framework and CI/CD pipeline
- Configure deployment pipelines for each environment
- Add user profile management
- Implement role-based access control