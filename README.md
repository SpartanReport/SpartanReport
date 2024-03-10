# Spartan Report
Spartan Report is a web application for Halo Infinite. It allows for users to create/modify custom armor presets, view progression stats, upcoming/previous seasons, and match history

#  Prerequisites
- Docker/Docker Compose
- [Registering an Azure Active Directory Application (Step 1 here)](https://den.dev/blog/halo-api-authentication/#step-1-registering-an-azure-active-directory-application)

# Docker Setup (RECOMMENDED)
- Clone the repository:
   - `git clone https://github.com/SpartanReport/SpartanReport.git`

- Fill out the `REACT_APP_CLIENT_ID` section of the `docker-compose-template.yml`.
   - Without this key, the app will fail to run

- Rename `docker-compose-template.yml` to `docker-compose.yml`

- Run `docker compose build` in the main directory

- Run `docker compose up` to start the application



# Server Setup (Advanced)
The Back-End of this project is written in Go. Running the backend requires a MongoDB server to be set up. [You may follow this walkthrough](https://www.mongodb.com/docs/manual/installation/) to get this up and running
- Clone the repository:
   - `git clone https://github.com/SpartanReport/SpartanReport.git`
 
- Navigate to Server folder
  - `cd Server`

- Run `go mod tidy` to fetch the required Go modules
  
- Start the backend server:
  - `go run main.go`

# Client Setup (Advanced)
The Client-Side/Front-End of this project is written in ReactJS. Running the frontend requires npm and Node.js


- Navigate to the `client` directory:
  - `cd client`

- Install the required npm packages:
  - `npm install`

- Run the build:
  - `npm start`

# Proxy Server Setup (Advanced)
The Proxy Server of this project is used to query halo infinite's api from the front end directly. It's only being used in the Armory section in order to display non-compressed highlighted images.


- Navigate to the `client/src/utils` directory:
  - `cd client/src/utils`

- Run the proxy server:
  - `node proxyserver.js`

## Contributing

Feel free to contribute to this project by creating issues or pull requests.

## License

This project is open-source and available under the MIT License.

   
