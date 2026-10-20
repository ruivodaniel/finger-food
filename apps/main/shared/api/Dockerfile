##############################
######## BUILD STAGE #########
##############################
FROM node:22.16.0-alpine AS build

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/main/shared/api/package.json ./apps/main/shared/api/
COPY apps/main/shared/api/drizzle ./apps/main/shared/api/drizzle
COPY shared ./shared
COPY team-cockpit ./team-cockpit

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy all source code
COPY . .

# Build the API application (esbuild bundle → apps/main/shared/api/dist)
RUN pnpm --filter @apps/api build

##############################
######## RUNNER STAGE ########
##############################
FROM node:22.16.0-alpine AS runner

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from the build stage
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/.npmrc ./
COPY --from=build /app/apps/main/shared/api ./apps/main/shared/api
COPY --from=build /app/shared ./shared
COPY --from=build /app/team-cockpit ./team-cockpit

# Install production dependencies only
RUN pnpm install --frozen-lockfile

# TEMPORARY: copy drizzle migrations into dist so that Drizzle can find them
RUN cp -R apps/main/shared/api/drizzle apps/main/shared/api/dist/drizzle \
    && mkdir -p apps/main/shared/api/dist/meta \
    && cp apps/main/shared/api/drizzle/meta/_journal.json apps/main/shared/api/dist/meta/_journal.json


# Set the user to node for security
USER node

EXPOSE 3000

CMD ["node", "apps/main/shared/api/dist/index.js"]
