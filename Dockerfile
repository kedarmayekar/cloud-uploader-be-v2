FROM node:18-alpine
COPY . /app
WORKDIR /app
RUN npm install
EXPOSE 3001
CMD ["node", "server.js"]