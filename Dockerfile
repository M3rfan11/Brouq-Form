# Dockerfile for Google Cloud Run / Docker deployment
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create directory for database
RUN mkdir -p /app/data

# Expose port (Cloud Run sets PORT automatically)
# Cloud Run sets PORT automatically
ENV PORT=8080
EXPOSE 8080

# Start the application
CMD ["node", "server.js"]
