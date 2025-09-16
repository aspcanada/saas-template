#!/bin/bash

# Deployment script for SaaS Template
# Usage: ./scripts/deploy.sh [environment] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[DEPLOY]${NC} $1"
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

# Default values
ENVIRONMENT="development"
SKIP_TESTS=false
SKIP_BUILD=false
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --environment|-e)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --environment, -e    Environment to deploy to (development|production)"
            echo "  --skip-tests         Skip running tests"
            echo "  --skip-build         Skip building packages"
            echo "  --dry-run            Show what would be deployed without actually deploying"
            echo "  --help               Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 --environment production"
            echo "  $0 --environment development --skip-tests"
            echo "  $0 --dry-run"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            print_error "Use --help to see available options"
            exit 1
            ;;
    esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "development" && "$ENVIRONMENT" != "production" ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    print_error "Must be 'development' or 'production'"
    exit 1
fi

print_status "Starting deployment to $ENVIRONMENT environment"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install pnpm first."
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install AWS CLI first."
    exit 1
fi

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    print_warning "AWS CDK is not installed. Installing globally..."
    npm install -g aws-cdk
fi

# Set environment-specific variables
if [[ "$ENVIRONMENT" == "production" ]]; then
    STACK_PREFIX="SaasTemplate"
    AWS_PROFILE=${AWS_PROFILE:-production}
else
    STACK_PREFIX="SaasTemplateDev"
    AWS_PROFILE=${AWS_PROFILE:-development}
fi

print_info "Using stack prefix: $STACK_PREFIX"
print_info "Using AWS profile: $AWS_PROFILE"

# Run tests unless skipped
if [[ "$SKIP_TESTS" == false ]]; then
    print_status "Running tests..."
    pnpm run test
    print_status "Tests passed!"
else
    print_warning "Skipping tests"
fi

# Build packages unless skipped
if [[ "$SKIP_BUILD" == false ]]; then
    print_status "Building packages..."
    pnpm run build
    print_status "Build completed!"
else
    print_warning "Skipping build"
fi

# Deploy infrastructure
if [[ "$DRY_RUN" == true ]]; then
    print_info "DRY RUN: Would deploy infrastructure"
    print_info "CoreStack: $STACK_PREFIX"Core
    print_info "ApiStack: $STACK_PREFIX"Api
else
    print_status "Deploying infrastructure..."
    
    # Deploy CoreStack first
    print_status "Deploying CoreStack..."
    pnpm -C infra cdk:deploy $STACK_PREFIX"Core" --require-approval never --profile $AWS_PROFILE
    
    # Deploy ApiStack
    print_status "Deploying ApiStack..."
    pnpm -C infra cdk:deploy $STACK_PREFIX"Api" --require-approval never --profile $AWS_PROFILE
    
    print_status "Infrastructure deployed successfully!"
fi

# Get API URL
if [[ "$DRY_RUN" == false ]]; then
    print_status "Getting API URL..."
    API_URL=$(aws cloudformation describe-stacks --stack-name $STACK_PREFIX"Api" --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text --profile $AWS_PROFILE)
    print_info "API URL: $API_URL"
    
    # Build web app with API URL
    print_status "Building web application..."
    NEXT_PUBLIC_API_BASE_URL=$API_URL pnpm -C apps/web build
    
    print_status "Web application built successfully!"
    print_info "You can now deploy the web app to your hosting provider"
    print_info "Make sure to set NEXT_PUBLIC_API_BASE_URL=$API_URL"
fi

print_status "Deployment completed successfully!"
