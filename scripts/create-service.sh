#!/usr/bin/env bash
#
# Creates a standardized folder structure for a new service
#
# Usage:  ./create-service.sh <service-name>
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $*"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*"
}

# Show usage
usage() {
    echo "Usage: $0 <service-name>"
    echo ""
    echo "Creates a standardized folder structure for a new service."
    echo ""
    echo "Example:"
    echo "  $0 auth-service"
    exit 1
}

# Validate service name
validate_service_name() {
    local name="$1"
    
    # Check if empty
    if [[ -z "$name" ]]; then
        log_error "Service name cannot be empty"
        exit 1
    fi
    
    # Check for valid characters (alphanumeric, hyphens, underscores)
    if [[ ! "$name" =~ ^[a-zA-Z][a-zA-Z0-9_-]*$ ]]; then
        log_error "Invalid service name: '$name'"
        log_error "Service name must start with a letter and contain only letters, numbers, hyphens, and underscores"
        exit 1
    fi
}

# Main function
main() {
    # Check if argument provided
    if [[ $# -ne 1 ]]; then
        log_error "Expected exactly one argument"
        usage
    fi

    local service_name="$1"
    
    # Validate the service name
    validate_service_name "$service_name"
    
    # Check if directory already exists
    if [[ -d "services/$service_name" ]]; then
        log_error "Directory '$service_name' already exists"
        exit 1
    fi

    log_info "Creating folder structure for service: $service_name"

    # Create directory structure
    mkdir -p "services/$service_name/app"
    mkdir -p "services/$service_name/infra/config"
    mkdir -p "services/$service_name/infra/env"
    mkdir -p "services/$service_name/infra/secrets"

    # Create .gitkeep files
    touch "services/$service_name/app/.gitkeep"
    # touch "services/$service_name/infra/. gitkeep"
    touch "services/$service_name/infra/$service_name.Dockerfile"
    touch "services/$service_name/infra/config/.gitkeep"
    touch "services/$service_name/infra/env/.env.example"
    touch "services/$service_name/infra/secrets/.secret.secret-name.example"
	cp "infrastructure/.dockerignore" "services/$service_name/"

    log_info "Folder structure created successfully!"
    echo ""
    echo "Created structure:"
    
	# displaying directory tree
	tree -a "services/$service_name"
}

# Run main function
main "$@"