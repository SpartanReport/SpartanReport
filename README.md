# Spartan Report
Spartan Report is a project designed to track various statistics and data for Halo Infinite. The backend is written in Go and interfaces with a MongoDB database, while the frontend is built using React.

#  Prerequisites
- Docker/Docker Compose
- [Registering an Azure Active Directory Application (Step 1 here)](https://den.dev/blog/halo-api-authentication/#step-1-registering-an-azure-active-directory-application)


# Server Setup
The Back-End of this project is written in Go. Running the backend requires a MongoDB server to be set up. [You may follow this walkthrough](https://www.mongodb.com/docs/manual/installation/) to get this up and running
- Clone the repository:
   - `git clone https://github.com/mirackara/SpartanReport.git`
 
- Navigate to Server folder
  - `cd Server`

- Run `go mod tidy` to fetch the required Go modules
  
- Start the backend server:
  - `go run main.go`

# Client Setup
The Client-Side/Front-End of this project is written in ReactJS. Running the frontend requires npm and Node.js


- Navigate to the `client` directory:
  - `cd client`

- Install the required npm packages:
  - `npm install`

- Run the build:
  - `npm start`
 

# Env Setup
There are a couple of enviormental variables that should be loaded in before the project is ran. Make sure to remove the `.template` portion!

`initialsetup.template.env`
  - `MONGODB_HOST="mongodb://localhost:27017/"` this .env file points to where your MongoDB server is being hosted

`azure-keys.template.env` this env file contains authentication codes for Azure AD. View the Azure Active Directory Application Prerequisite step above for more details

  - `CLIENT_ID = "CLIENT_ID_HERE"` 
  - `CLIENT_SECRET = "CLIENT_SECRET_HERE"`
  - `REDIRECT_URI= "http://localhost:8080/callback"`

`google-keys.json` this file is not included, but is required if you want to store operation data on Google Cloud Storage.

  - The reason why we are using Google Cloud Storage is because Operation data contains high quality image assets. Storing these on MongoDB is not possible nor is it practical.
  - Follow the [guide here](https://cloud.google.com/iam/docs/keys-create-delete) to get the .json file from your Google Cloud Project


## Contributing

Feel free to contribute to this project by creating issues or pull requests.

## License

This project is open-source and available under the MIT License.

   
