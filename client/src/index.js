import React from 'react';
import ReactDOM from 'react-dom';
import './Styles/index.css';
import App from './Routes/App';
import { CurrentlyEquippedProvider } from './Components/GlobalStateContext';

ReactDOM.render(
  <CurrentlyEquippedProvider>
    <App />
  </CurrentlyEquippedProvider>,
  document.getElementById('root')
);

