import React from 'react';
import ReactDOM from 'react-dom';
import './Styles/index.css';
import App from './Routes/App';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './auth/authConfig';
import { CurrentlyEquippedProvider } from './Components/GlobalStateContext';
await msalInstance.initialize();

ReactDOM.render(
  <CurrentlyEquippedProvider>
        <MsalProvider instance={msalInstance}>
        <App />

        </MsalProvider>
  </CurrentlyEquippedProvider>,
  document.getElementById('root')
);

