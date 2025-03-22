# ──────────────────────────────────────────────────────────────
# Stage 1: Build Angular/Analog App
# ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy application source code
COPY . .

# Build the app
ENV NODE_OPTIONS="--max-old-space-size=8192"
RUN npm run build


# ──────────────────────────────────────────────────────────────
# Stage 2: Minimal Alpine-based Runtime
# ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Install PostgreSQL client
RUN apk add --no-cache postgresql-client

# Set working directory
WORKDIR /app

# Copy only the essential build artifacts and scripts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/check.js ./check.js

# Install only production dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose application port
EXPOSE 3000

# Set environment variables (example)
ENV DL_ENV_TYPE="selfHosted"

# Healthcheck to verify the app is running
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --spider -q http://localhost:3000/api/health || exit 1

# Start the container:
#  1) Run check.js (ignoring any failures),
#  2) Then run the main server script.
CMD ["sh", "-c", "node check.js || true && node dist/analog/server/index.mjs"]
