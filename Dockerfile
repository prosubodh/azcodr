# Reproducible CI sandbox for azcodr.
# Usage:
#   docker build --build-arg NODE_VERSION=22 -t azcodr-ci:22 .
#   docker build --build-arg NODE_VERSION=24 -t azcodr-ci:24 .
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-bookworm

WORKDIR /workspace

# System tools needed by the build and parity checks.
RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Install dependencies first for layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the repository.
COPY . .

# Run the same gates as CI.
RUN npm run build \
 && git diff --exit-code lib/ \
 && npm run lint \
 && npm run typecheck \
 && npm test \
 && npx azcodr check