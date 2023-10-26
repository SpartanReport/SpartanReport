import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import axios from 'axios';

// Function to authenticate user
const authenticateUser = async () => {
  try {

    const response = await axios.get('http://localhost:8080/account', { withCredentials: true });
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

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();