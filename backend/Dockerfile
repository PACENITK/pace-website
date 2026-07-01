# Multi-stage production build
# Stage 1: Build & install dependencies
FROM node:20-alpine AS deps

WORKDIR /usr/src/app

COPY package*.json ./

# Install only production dependencies cleanly and reproducibly
RUN npm ci --only=production

# Stage 2: Create production runner image
FROM node:20-alpine AS runner

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /usr/src/app

# Copy production node_modules from deps stage
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy application source files
COPY . .

# Run container process under non-root node user for security
USER node

# Expose server port
EXPOSE 5000

# Configure health checking to poll the newly implemented connection status endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Production run script
CMD ["npm", "start"]
