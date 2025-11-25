FROM nginx:alpine

LABEL maintainer="nginx-gateway"
LABEL description="API Gateway with rate limiting and routing"

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom configuration
COPY nginx.conf /etc/nginx/nginx.conf
# Create cache directory
RUN mkdir -p /var/cache/nginx/rate_limit && \
    chown -R nginx:nginx /var/cache/nginx

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
