import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import "./styles.css"
import AuthenticatedContent from './AuthenticatedContent';
import Spartan from './Spartan';
import Stats from './Stats';
import MatchStats from './match-stats';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Link } from 'react-router-dom';
function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [gamerInfo, setGamerInfo] = useState(null);
  const [HaloStats, setHaloStats] = useState(null);
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get('http://localhost:8080/account', { withCredentials: true });
        setIsAuthenticated(true);
        setGamerInfo(response.data.gamerInfo);
      } catch (error) {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const startAuth = () => {
    window.location.href = "http://localhost:8080/startAuth";
  };

  const clearCookie = () => {
    document.cookie = "SpartanToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/";
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    
    <Router>
      <div>
        <div className="header">
          <h1>Halo Tracker</h1>
          <nav>
            <ul>
              <li><Link to="/">Account</Link></li>
              <li><Link to="/season">Season</Link></li>
              <li><Link to="/stats">Battle History</Link></li>
              <li><Link to="/spartan">Spartan</Link></li>
            </ul>
            <div className="right-aligned">
              <button className="clear-cookie-button btn btn-danger" onClick={clearCookie}>Clear Cookie</button>
            </div>
          </nav>
        </div>

        <div className="container mt-5">
        <Routes>
          <Route path="/spartan" element={<Spartan gamerInfo={gamerInfo} setGamerInfo={setGamerInfo} />} />
          <Route path="/" element={
            isAuthenticated 
              ? <AuthenticatedContent gamerInfo={gamerInfo} /> 
              : <div><h1>You are not authenticated</h1><button onClick={startAuth}>Authenticate</button></div>
          } />
<Route path="/match/:matchId" element={<MatchStats gamerInfo={gamerInfo} HaloStats={HaloStats} />} />
<Route path="/stats" element={<Stats gamerInfo={gamerInfo} HaloStats={HaloStats} setHaloStats={setHaloStats} />} />
        </Routes>
      </div>
      </div>
    </Router>
  );
}

export default App;