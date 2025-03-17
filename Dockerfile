# Stage 1: Build Angular Analog App
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source code
COPY . .

# Build the app
ENV NODE_OPTIONS="--max-old-space-size=8192"
RUN npm run build

# Stage 2: Create a minimal runtime image
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Copy built application from the previous stage
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json ./

# Install only production dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Expose application port
EXPOSE 3000

# Set environment variables with sensible defaults
ENV DL_ENV_TYPE="selfHosted"

# Start the application
CMD ["node", "dist/analog/server/index.mjs"]
