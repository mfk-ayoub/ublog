#!/bin/sh
set -eu
umask 077
mkdir -p infrastructure/secrets/ai-system
if [ ! -s infrastructure/secrets/ai-system/service.key ]; then
    (set -C; openssl rand -hex 32 > infrastructure/secrets/ai-system/service.key)
fi
