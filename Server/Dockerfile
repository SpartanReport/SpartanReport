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

# Copy the Go binary from the builder stage
COPY --from=builder /app/main /app/main

# Also copy the google-key.json file
COPY google-key.json /app/google-key.json

# Set the working directory in the container
WORKDIR /app

# Expose the port the app runs on
EXPOSE 8080

# Update the MongoDB host to localhost
ENV MONGODB_HOST="mongodb://localhost:27017/"

# Run the MongoDB server and the Go application
CMD mongod --bind_ip 0.0.0.0 & ./main
