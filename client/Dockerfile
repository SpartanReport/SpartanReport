# Build stage
FROM node:14 as build

WORKDIR /app

COPY package*.json ./

RUN npm install

# Accept build-time arguments
ARG REACT_APP_API_URL
ARG REACT_APP_PROXY_URL
ARG REACT_APP_REDIRECT_URL
ARG REACT_APP_CLIENT_ID

# Set the environment variable
ENV REACT_APP_API_URL $REACT_APP_API_URL
ENV REACT_APP_PROXY_URL $REACT_APP_PROXY_URL
ENV REACT_APP_REDIRECT_URL $REACT_APP_REDIRECT_URL
ENV REACT_APP_CLIENT_ID $REACT_APP_CLIENT_ID
COPY . .

RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Copy the build output from the previous stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy the Nginx configuration file
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]