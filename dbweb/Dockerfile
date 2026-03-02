FROM sosedoff/pgweb:latest

EXPOSE 8081

# Render sets $PORT at runtime. We bind to 0.0.0.0 so Render can route traffic.
# PGWEB_DATABASE_URL, PGWEB_AUTH_USER, PGWEB_AUTH_PASS are provided via Render env vars.
CMD ["sh", "-c", "pgweb --bind 0.0.0.0 --listen ${PORT:-8081} --url \"$PGWEB_DATABASE_URL\" --auth-user \"$PGWEB_AUTH_USER\" --auth-pass \"$PGWEB_AUTH_PASS\" --skip-open --readonly"]
