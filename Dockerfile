# ──────────────────────────────────────────────────────────────
# Stage 1 - build: Compiles the frontend and API code
# ──────────────────────────────────────────────────────────────
FROM node:20.12.0-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy application source code
COPY . .

# Build the app
ENV NODE_OPTIONS="--max-old-space-size=8192"
ENV DL_ENV_TYPE="selfHosted"
RUN npm run build

# ──────────────────────────────────────────────────────────────
# Stage 2 - run: Alpine-based runtime to serve the app
# ──────────────────────────────────────────────────────────────
FROM node:20.12.0-alpine AS runner

# Create non-root app user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy required build artifacts and scripts
COPY --chown=appuser:appgroup --from=builder /app/dist ./dist
COPY --chown=appuser:appgroup --from=builder /app/package.json ./package.json
COPY --chown=appuser:appgroup --from=builder /app/check.js ./check.js

# Install only production dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Switch to da user
USER appuser

# Expose application port
EXPOSE 3000

# Set environment variables (example)
ENV DL_ENV_TYPE="selfHosted"

# Healthcheck to verify the app is running
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --spider -q http://localhost:3000/api/health || exit 1

# Start the container
CMD ["sh", "-c", "node check.js || true && node ./dist/analog/server/index.mjs"]
