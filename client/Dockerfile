# Build stage
FROM node:14 as build

WORKDIR /app

COPY package*.json ./

RUN npm install

# Accept build-time arguments
ARG REACT_APP_API_URL
ARG REACT_APP_PROXY_URL

# Set the environment variable
ENV REACT_APP_API_URL $REACT_APP_API_URL
ENV REACT_APP_PROXY_URL $REACT_APP_PROXY_URL
COPY . .

RUN npm run build

# Production stage
FROM nginx:stable-alpine

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
