FROM sosedoff/pgweb:latest

EXPOSE 8081

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Override the base image ENTRYPOINT (which runs pgweb directly).
ENTRYPOINT ["/entrypoint.sh"]
