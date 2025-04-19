# Stage 1 - build: Compiles the frontend and API code
FROM node:20.12.0-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./

# Set NPM registry and config
RUN npm config set registry https://registry.npmmirror.com && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 2000 && \
    npm config set fetch-retry-maxtimeout 60000

# Install dependencies, with retry
RUN for i in 1 2 3; do npm ci --legacy-peer-deps && break || sleep 20; done

# Copy application source code
COPY . .

# Build the app
ENV NODE_OPTIONS="--max-old-space-size=8192"
ENV DL_ENV_TYPE="selfHosted"
RUN npm run build

# Stage 2 - run: Alpine-based runtime to serve the app
FROM node:20.12.0-alpine AS runner

# Install PostgreSQL client to run pg_isready and psql
RUN apk add --no-cache postgresql-client

# Create non-root app user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy required build artifacts and scripts
COPY --chown=appuser:appgroup --from=builder /app/dist ./dist
COPY --chown=appuser:appgroup --from=builder /app/package.json ./package.json
COPY --chown=appuser:appgroup --from=builder /app/db/schema.sql ./schema.sql
COPY --chown=appuser:appgroup --from=builder /app/start.sh ./start.sh

# Install only production dependencies
RUN npm config set registry https://registry.npmmirror.com && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 2000 && \
    npm config set fetch-retry-maxtimeout 60000 && \
    for i in 1 2 3; do npm install --omit=dev --legacy-peer-deps && break || sleep 20; done


# Switch to the app user
USER appuser

# Expose application port
EXPOSE 3000

# Set environment variables
ENV DL_ENV_TYPE="selfHosted"

# Healthcheck
HEALTHCHECK --interval=15s --timeout=2s --start-period=5s --retries=5 \
  CMD wget --spider -q http://localhost:3000/api/health || exit 1

# Run the start script to init the database and start the app server
CMD ["./start.sh"]

# The app can actually just be started with: node ./dist/analog/server/index.mjs
# However, we need the init script to wait for the DB and initialize the schema
