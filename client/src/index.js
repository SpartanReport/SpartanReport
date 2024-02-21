import React from 'react';
import ReactDOM from 'react-dom';
import './Styles/index.css';
import App from './Routes/App';
import { GlobalStateProvider } from './Components/GlobalStateContext';

ReactDOM.render(
  <GlobalStateProvider>
    <App />
  </GlobalStateProvider>,
  document.getElementById('root')
);

