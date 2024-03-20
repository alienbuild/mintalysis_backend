FROM node:18.17.0

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma schema
COPY prisma ./prisma

# Copy the rest of your application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build your application if necessary
RUN npx babel src -d dist --presets @babel/preset-env

ENV NODE_ENV=production

EXPOSE 8001

# Use the nodemon command to run your application in development mode
CMD ["yarn", "dev"]
