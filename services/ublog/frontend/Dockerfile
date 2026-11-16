FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer-cached)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Browser requests use relative paths (same origin) → Vite proxy forwards to gateway
ENV VITE_API_URL=""

EXPOSE 5173

CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5173"]

