FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src
COPY views ./views
COPY public ./public
COPY credentials.json ./credentials.json

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
