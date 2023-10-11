import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./styles.css"
import 'bootstrap/dist/css/bootstrap.min.css';
import AuthenticatedContent from './AuthenticatedContent';
import Spartan from './Spartan';
import Stats from './Stats';
import Progression from './Progression';
import MatchStats from './match-stats';
import Header from './Header';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Sidebar from './Sidebar';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [gamerInfo, setGamerInfo] = useState(null);
  const [HaloStats, setHaloStats] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const [spartanInventory, setSpartanInventory] = useState(null);

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
      <div className="d-flex" id="wrapper">
        {/* Sidebar */}
        <Sidebar clearCookie={clearCookie} />
        {/* /#sidebar-wrapper */}
            {/* Header */}
            <Header gamerInfo={gamerInfo} />
            {/* Routes */}

        {/* Page Content */}
        <div id="page-content-wrapper">
          <div className="container-fluid">
            <Routes>
              <Route path="/spartan" element={<Spartan gamerInfo={gamerInfo} spartanInventory={spartanInventory} setSpartanInventory={setSpartanInventory} />} />
              <Route path="/" element={isAuthenticated ? <AuthenticatedContent gamerInfo={gamerInfo} spartanInventory={spartanInventory}/> : <div><h1>You are not authenticated</h1><button onClick={startAuth}>Authenticate</button></div>} />
              <Route path="/match/:matchId" element={<MatchStats gamerInfo={gamerInfo} HaloStats={HaloStats} selectedMatch={selectedMatch} />} />
              <Route path="/stats" element={<Stats gamerInfo={gamerInfo} HaloStats={HaloStats} setHaloStats={setHaloStats} setSelectedMatch={setSelectedMatch} />} />
              <Route path="/progression" element={<Progression gamerInfo={gamerInfo} HaloStats={HaloStats} setHaloStats={setHaloStats} setSelectedMatch={setSelectedMatch} />} />
            </Routes>
          </div>
        </div>
        {/* /#page-content-wrapper */}
      </div>
    </Router>
  );

}
export default App;