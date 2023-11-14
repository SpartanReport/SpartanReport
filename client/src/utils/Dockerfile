FROM node:latest
WORKDIR /app
COPY package*.json ./
RUN npm install express http-proxy-middleware --save 

COPY . .
# Set a default environment variable for the proxy address
ENV PROXY_BASE_URL "http://localhost:3001/api"

CMD ["node", "proxyserver.js"]