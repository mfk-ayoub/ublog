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
        log_error "service '$service_name' already exists"
        exit 1
    fi

	log_info "making a copy of the postgres-db-base folder"

	cp -r "./services/postgress-db-base" "./services/$service_name"

	rm "./services/$service_name/infra/postgress-db-base.Dockerfile"
	rm "./services/$service_name/infra/secrets/.secret.auth-db-password-secret.example"

	cp -r "./services/postgress-db-base/infra/secrets/.secret.auth-db-password-secret.example" "./services/$service_name/infra/secrets/.secret.$service_name-password-secret.example"
    sed -i "s/postgress-db/$service_name/g" ./services/$service_name/infra/env/.env.example
    sed -i "s/auth-db/$service_name/g" ./services/$service_name/infra/env/.env.example

    mkdir -p "storage/$service_name-volume"
    # touch "storage/$service_name-volume/.gitkeep"

	log_info "Folder structure created successfully!"
}

main "$@"
