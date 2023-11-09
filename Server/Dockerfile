# Stage 1: MongoDB setup
FROM mongo:latest as mongodb

# Set the MongoDB data directory
VOLUME [ "/data/db" ]

# Expose MongoDB's default port
EXPOSE 27017

# Stage 2: Build the Go application
FROM golang:1.21 as builder

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . .

# Download any necessary dependencies
RUN go mod download

# Build the Go app
RUN go build -o main .

# Stage 3: Final setup
FROM mongo:latest

# Accept build-time argument for HOST
ARG HOST
ARG REDIRECT-HOST

# Set the MongoDB host and HOST environment variables
ENV MONGODB_HOST="mongodb://localhost:27017/"
ENV HOST=$HOST
ENV REDIRECT-HOST=$REDIRECT-HOST

# Copy the Go binary from the builder stage
COPY --from=builder /app/main /app/main
# Set the Google Cloud credentials environment variable
ENV GOOGLE_APPLICATION_CREDENTIALS=/app/google-key.json

# Copy the Google Cloud credentials file into the container
COPY google-key.json /app/google-key.json
# Also copy the google-key.json file
COPY google-key.json /app/google-key.json
COPY azure-keys.env /app/azure-keys.env
# Set the working directory in the container
WORKDIR /app

# Expose the port the app runs on
EXPOSE 8080

# Run the MongoDB server and the Go application
CMD mongod --bind_ip 0.0.0.0 & ./main
