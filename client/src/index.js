import React from 'react';
import ReactDOM from 'react-dom';
import './Styles/index.css';
import App from './Routes/App';
import axios from 'axios';

// Function to authenticate user
const authenticateUser = async () => {
  try {

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080'; // Fallback URL if the env variable is not set
    const response = await axios.get(`${apiUrl}/account`, { withCredentials: true });
    if (response.status === 200) {
      console.log('User authenticated successfully');
      return response.data;
    }
  } catch (error) {
    console.error('Error during authentication:', error);
  }
};

// Call the function on page load
authenticateUser();

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

