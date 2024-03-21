FROM node:18.17.0

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy prisma schema and the rest of your application
COPY prisma ./prisma
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build your application
RUN npx babel src -d dist --presets @babel/preset-env

# Copy the startup script into the container and make it executable
COPY startup.sh /usr/src/app/startup.sh
RUN chmod +x /usr/src/app/startup.sh

ENV NODE_ENV=production

EXPOSE 8001

# Start the container with the startup script
CMD ["/usr/src/app/startup.sh"]
