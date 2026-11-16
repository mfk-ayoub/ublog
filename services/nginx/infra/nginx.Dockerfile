FROM nginx:1.27-alpine

LABEL maintainer="ublog"
LABEL description="Nginx HTTPS reverse-proxy"

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Config and certs are bind-mounted at runtime via docker-compose
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
