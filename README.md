# AI SaaS Template

A modern monorepo template for building AI-powered SaaS applications with Next.js, TypeScript, and AWS CDK.

## Project Structure

```
saas-template/
├── apps/
│   ├── web/                 # Next.js 14 application (App Router)
│   └── api/                 # Node.js API handlers (Lambda-compatible)
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
- **apps/api**: Node.js API handlers designed for AWS Lambda deployment
- **packages/shared**: Shared TypeScript types, constants, and utilities
- **infra**: AWS CDK v2 infrastructure as code definitions

## Getting Started

### Prerequisites

- Node.js 20 (specified in `.nvmrc`)
- pnpm package manager

### Installation

```bash
# Install dependencies for all workspaces
pnpm install
```

### Development

```bash
# Start the Next.js development server
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

# API handlers
cd apps/api
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

## Next Steps

- Add authentication and user management
- Implement API routes and database integration
- Set up AWS infrastructure with CDK
- Add testing framework and CI/CD pipeline
- Configure deployment pipelines for each environment