#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  Generate a self-signed TLS certificate for local development.
#  The certificate is valid for 365 days and covers localhost
#  plus a few common Docker-internal names.
#
#  Usage:  ./scripts/generate-ssl-certs.sh
# ─────────────────────────────────────────────────────────────

set -euo pipefail

CERT_DIR="$(cd "$(dirname "$0")/.." && pwd)/infrastructure/secrets/nginx"

mkdir -p "$CERT_DIR"

CERT_FILE="$CERT_DIR/selfsigned.crt"
KEY_FILE="$CERT_DIR/selfsigned.key"

if [[ -f "$CERT_FILE" && -f "$KEY_FILE" ]]; then
    echo "SSL certificates already exist in $CERT_DIR — skipping generation."
    echo "  To regenerate, delete them first:"
    echo "    rm $CERT_FILE $KEY_FILE"
    exit 0
fi

echo "Generating self-signed SSL certificate …"

openssl req -x509 -nodes -days 365 \
    -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -subj "/C=US/ST=Local/L=Dev/O=Ublog/OU=Dev/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,DNS:nginx,DNS:gateway,DNS:frontend,IP:127.0.0.1"

chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"

echo "Done — certificates written to:"
echo "  $CERT_FILE"
echo "  $KEY_FILE"
