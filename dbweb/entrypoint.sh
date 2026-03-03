#!/bin/sh
set -eu

LISTEN_PORT="${PORT:-8081}"

if [ -z "${PGWEB_DATABASE_URL:-}" ]; then
  echo "PGWEB_DATABASE_URL is not set" >&2
  exit 1
fi

if [ -z "${PGWEB_AUTH_USER:-}" ] || [ -z "${PGWEB_AUTH_PASS:-}" ]; then
  echo "PGWEB_AUTH_USER/PGWEB_AUTH_PASS are not set" >&2
  exit 1
fi

exec pgweb \
  --bind 0.0.0.0 \
  --listen "$LISTEN_PORT" \
  --url "$PGWEB_DATABASE_URL" \
  --auth-user "$PGWEB_AUTH_USER" \
  --auth-pass "$PGWEB_AUTH_PASS" \
  --skip-open \
