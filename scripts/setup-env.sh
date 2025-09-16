#!/bin/bash

# Environment setup script for SaaS Template
# Usage: ./scripts/setup-env.sh [environment]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[SETUP]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

ENVIRONMENT=${1:-development}

print_status "Setting up $ENVIRONMENT environment"

# Create environment files if they don't exist
if [[ ! -f "apps/web/.env.local" ]]; then
    print_info "Creating web app environment file..."
    cp apps/web/.env.local.example apps/web/.env.local
    print_warning "Please update apps/web/.env.local with your actual values"
fi

if [[ ! -f "apps/api/.env.local" ]]; then
    print_info "Creating API environment file..."
    cp apps/api/.env.local.example apps/api/.env.local
    print_warning "Please update apps/api/.env.local with your actual values"
fi

# Install dependencies
print_status "Installing dependencies..."
pnpm install

# Build packages
print_status "Building packages..."
pnpm run build

# Run tests
print_status "Running tests..."
pnpm run test

print_status "Environment setup completed!"
print_info "Next steps:"
print_info "1. Update environment files with your actual values"
print_info "2. Configure AWS credentials"
print_info "3. Set up Clerk authentication"
print_info "4. Configure Stripe billing (optional)"
print_info "5. Run 'pnpm run dev' to start development"
