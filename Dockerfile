FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx babel src -d dist --presets @babel/preset-env

ENV NODE_ENV=production

EXPOSE 8001

CMD ["node", "dist/index.js"]
#CMD ["node", "-r", "esm", "dist/index.js"]
