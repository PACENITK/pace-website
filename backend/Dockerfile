# Multi-stage production build.
#
# Build context is the REPO ROOT (see docker-compose.yml), not ./backend,
# because backend/game/engine.js loads the shared rules engine from
# ../../simulation/*. Both trees are copied into the image:
#   /usr/src/app/backend      <- the API
#   /usr/src/app/simulation   <- the pure ESM rules engine
# so the `../../simulation/...` imports resolve at runtime.

# Stage 1: install production dependencies
FROM node:20-alpine AS deps

WORKDIR /usr/src/app/backend

COPY backend/package*.json ./

RUN npm ci --omit=dev

# Stage 2: production runner image
FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /usr/src/app/backend

# Production node_modules from the deps stage
COPY --from=deps /usr/src/app/backend/node_modules ./node_modules

# Application code
COPY backend/ /usr/src/app/backend/

# Shared rules engine (pure ESM, no npm deps). simulation/package.json
# marks this subtree as "type": "module" so Node treats these .js files
# as ESM even though backend/ itself is CommonJS.
COPY simulation/ /usr/src/app/simulation/

# Commented out for unprivileged LXC/Proxmox sysctl compatibility
# USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["npm", "start"]
