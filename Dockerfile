FROM node:18.17.0

WORKDIR /usr/src/app

# Copying both package.json and yarn.lock to utilize Docker cache layers efficiently
COPY package.json yarn.lock ./

# Installing all dependencies, including devDependencies
RUN npm install

# Copying the rest of the application
COPY . .

ENV NODE_ENV=production

EXPOSE 8001

# Using the yarn dev command directly
CMD ["yarn", "dev"]
