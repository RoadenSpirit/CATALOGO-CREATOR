FROM node:20-bookworm-slim

USER root

# Instalación de dependencias de Chromium para Debian (mucho más estables)
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-freefont-ttf \
    fonts-noto-color-emoji \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxshmfence1 \
    ca-certificates \
    curl \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

# Variables de entorno para Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV N8N_PORT=5678

# Instalación global de n8n
RUN npm install -g n8n

# Preparación de directorios para nodos personalizados
RUN mkdir -p /custom-nodes && chown -R node:node /custom-nodes

USER node
WORKDIR /custom-nodes
RUN npm init -y && npm install n8n-nodes-html2image

WORKDIR /data
EXPOSE 5678

CMD ["n8n"]
