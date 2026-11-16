#!/usr/bin/env bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $*"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*"
}

usage() {
    echo "Usage: $0 <directory>"
    echo ""
    echo "Creates a -log folder in ./storage for each folder in the services directory that ends with '-db'."
    echo ""
    echo "If ./services contains:  auth-service, auth-service-db"
    echo "This creates: ./storage/auth-service-volume"
    exit 1
}

main() {
    local source_dir="./services"

    # Check if source directory exists
    if [[ !  -d "$source_dir" ]]; then
        log_error "Directory '$source_dir' does not exist"
        exit 1
    fi

    # Create logs directory if it doesn't exist
    mkdir -p ./storage

    log_info "Scanning directory: $source_dir"

    local count=0

    # Loop through each folder in the source directory
    for folder in "$source_dir"/*/; do
        # Check if any folders exist (glob didn't match)
        [[ -d "$folder" ]] || continue

        # Get folder name without trailing slash and path
        local folder_name
        folder_name=$(basename "$folder")

		[[ "$folder_name" == *-db ]] || continue

        # Create the log folder
        local log_folder="./storage/${folder_name}-volume"

        if [[ -d "$log_folder" ]]; then
            log_warn "Already exists: $log_folder"
        else
            mkdir -p "$log_folder"
            log_info "Created: $log_folder"
            count=$((count + 1))
        fi
    done

	log_info "Created: mongo-db-volume"
	mkdir -p ./storage/mongo-db-volume

	log_info "Created: mongo-db-config-volume"
	mkdir -p ./storage/mongo-db-config-volume

	log_info "Created: qdrant-volume"
	mkdir -p ./storage/qdrant-volume

	log_info "Created: users-uploads-volume"
	mkdir -p storage/users-uploads-volume

	log_info "Created: articles-uploads-volume"
	mkdir -p storage/articles-uploads-volume

	log_info "Created: prometheus-volume"
	mkdir -p storage/prometheus-volume

	log_info "Created: alertmanager-volume"
	mkdir -p storage/alertmanager-volume

	log_info "Created: grafana-volume"
	mkdir -p storage/grafana-volume


    if [[ $count -eq 0 ]]; then
        log_warn "No new log directories created"
    else
        log_info "Created $count log directories in ./logs/"
    fi
}

main "$@"