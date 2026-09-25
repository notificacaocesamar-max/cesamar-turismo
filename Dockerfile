# Robô diário da Cesamar — imagem para Google Cloud Run (Job)
# Sem dependências externas: usa só o Node.js (fetch nativo).
FROM node:22-slim
WORKDIR /app
COPY package.json ./
COPY robo ./robo
COPY tools/seed-dados.js ./tools/seed-dados.js
COPY frontend/assets/js/core ./frontend/assets/js/core
ENV NODE_ENV=production
USER node
CMD ["node", "robo/index.js"]
