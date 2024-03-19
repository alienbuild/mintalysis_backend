FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

# If you're using Babel to compile, copy your source code and compile it
COPY . .
RUN npm run build  # Make sure to add a "build" script in package.json to compile your app

EXPOSE 8001

CMD ["node", "dist/index.js"]
