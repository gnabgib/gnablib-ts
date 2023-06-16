ARG NODE_VER="18"
FROM node:${NODE_VER}
ENV NODE_ENV=production

WORKDIR /app
COPY ["package.json", "package-lock.json", "src/"]
RUN npm install
RUN npm ci
RUN npm run build
RUN npm run compress
