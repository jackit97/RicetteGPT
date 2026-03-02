FROM sosedoff/pgweb:latest

EXPOSE 8081

COPY entrypoint.sh /entrypoint.sh

# Override the base image ENTRYPOINT (which runs pgweb directly).
ENTRYPOINT ["sh", "/entrypoint.sh"]
