FROM node:alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 5173

# ...existing code...
CMD ["npm", "run", "preview", "--", "--host"]