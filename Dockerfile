FROM node:20-alpine AS build

WORKDIR /app

# Copiar dependencias e instalar
COPY package*.json ./
RUN npm install

# Copiar el resto del código y construir la app de React
COPY . .
RUN npm run build

# Etapa de producción con un servidor estático ligero
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist

EXPOSE 3000

# Iniciar el servidor SPA (-s) en el puerto 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
