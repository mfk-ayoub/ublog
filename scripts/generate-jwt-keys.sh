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
    echo "Usage: $0"
    echo ""
    echo "Creates a jwt private and public keys in folder in ./infrastructure/secrets/jwt/"
    echo ""
    echo "If ./infrastructure/secrets/jwt/ contains:  private.key, public.key"
    echo "the script will NOT overwrite them"
    exit 1
}

main() {
	local	dir="./infrastructure/secrets/jwt";

	if [[ ! -d "infrastructure" ]]; then
		log_error "./infrastructure/ must exist!"
		exit 1
	fi

	mkdir -p "$dir"

	if [[ -f "$dir/private.key" ]] || [[ -f "$dir/public.key" ]]; then
		log_error 'Private key or Public key already exist!'
		exit 1
	fi

	log_info "Creating Private key" 
	openssl genrsa -out $dir/private.key 4096
	 
	log_info "Creating Public key"
	openssl rsa -in $dir/private.key -pubout -outform PEM -out $dir/public.key

	log_info "Done!"
}

main "$@"