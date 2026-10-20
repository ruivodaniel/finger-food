##############################
######## BUILD STAGE #########
##############################
FROM node:22.16.0-alpine AS build

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/main/web/package.json ./apps/main/web/
COPY apps/main/api/package.json ./apps/main/api/
COPY apps/main/slices/ ./apps/main/slices/
COPY shared/ ./shared/
COPY team-cockpit/ ./team-cockpit/
COPY configs/ ./configs/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy all source code
COPY . .

# Build client with .env secret mounted (Vite will pick it up)
# Note: @apps/api/hc is resolved directly from source via Vite alias
# (no tsc build needed — esbuild strips type-only imports from hc.ts)
RUN --mount=type=secret,id=envfile \
    cp /run/secrets/envfile ./apps/main/web/.env && \
    pnpm --filter @apps/web-main build

##############################
######## RUNNER STAGE ########
##############################
FROM node:22.16.0-alpine AS runner

RUN npm install -g serve@14

WORKDIR /app

# Copy the built static files from the build stage
COPY --from=build /app/apps/main/web/dist ./

USER 1000

EXPOSE 8080

CMD ["serve", "-s", ".", "-l", "8080"]
