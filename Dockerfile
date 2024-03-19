FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

# If you're using Babel to compile, copy your source code and compile it
COPY . .

RUN npx babel src -d dist --presets @babel/preset-env

EXPOSE 8001

CMD ["node", "dist/index.js"]
