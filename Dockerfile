# -----------------------------
# Stage 1: Build the application
# -----------------------------
FROM node:24-alpine AS builder

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy the rest of the source code
COPY . .

# Build the NestJS app
RUN npm run build

# -----------------------------
# Stage 2: Production image
# -----------------------------
FROM node:24-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy only production dependencies from builder
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder /usr/src/app/dist ./dist

# Set environment variables
#ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Use non-root user for security
RUN addgroup -S nestjs && adduser -S nestjs -G nestjs
USER nestjs

# Start the app
CMD ["node", "dist/main.js"]
