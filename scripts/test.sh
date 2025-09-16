#!/bin/bash

# Test runner script for SaaS Template
# Usage: ./scripts/test.sh [workspace] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[TEST]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install pnpm first."
    exit 1
fi

# Parse arguments
WORKSPACE=""
COVERAGE=false
WATCH=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --coverage)
            COVERAGE=true
            shift
            ;;
        --watch)
            WATCH=true
            shift
            ;;
        --help)
            echo "Usage: $0 [workspace] [options]"
            echo ""
            echo "Workspaces:"
            echo "  api     - Run API tests only"
            echo "  web     - Run web app tests only"
            echo "  all     - Run all tests (default)"
            echo ""
            echo "Options:"
            echo "  --coverage  - Run tests with coverage"
            echo "  --watch     - Run tests in watch mode"
            echo "  --help      - Show this help message"
            exit 0
            ;;
        *)
            WORKSPACE="$1"
            shift
            ;;
    esac
done

# Set default workspace
if [ -z "$WORKSPACE" ]; then
    WORKSPACE="all"
fi

print_status "Starting tests for workspace: $WORKSPACE"

# Build the command
if [ "$COVERAGE" = true ]; then
    CMD="test:coverage"
elif [ "$WATCH" = true ]; then
    CMD="test:watch"
else
    CMD="test"
fi

# Run tests based on workspace
case $WORKSPACE in
    "api")
        print_status "Running API tests..."
        cd apps/api
        pnpm $CMD
        ;;
    "web")
        print_status "Running web app tests..."
        cd apps/web
        pnpm $CMD
        ;;
    "all")
        print_status "Running all tests..."
        pnpm -r $CMD
        ;;
    *)
        print_error "Unknown workspace: $WORKSPACE"
        print_error "Use --help to see available options"
        exit 1
        ;;
esac

print_status "Tests completed successfully!"
