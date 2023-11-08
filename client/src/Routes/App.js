import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../Styles/styles.css"
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from './Home';
import Spartan from './Spartan';
import Stats from './Stats';
import Progression from './Progression';
import MatchStats from './match-stats';
import Header from './Header'
import UnauthenticatedContent from './UnauthenticatedContent';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './Navbar'
import Operations from './Operations';
import Store from './store';
import ItemDetailsPage from './itemdetails';

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
        console.log(response.data.gamerInfo)
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




  return (
    <Router>
    <div className="d-flex flex-row" style={{ width: '100%' } } id="wrapper">
          {/* Sidebar */}
          <Navbar clearCookie={clearCookie} isAuthenticated={isAuthenticated} startAuth={startAuth} />
            {/* Header */}
            <Header gamerInfo={gamerInfo} />
            {/* Routes */}

        {/* Page Content */}
        <div id="page-content-wrapper">
          <div className="container-fluid">
            <Routes>
              <Route path="/spartan" element={<Spartan gamerInfo={gamerInfo} spartanInventory={spartanInventory} setSpartanInventory={setSpartanInventory} />} />
              <Route path="/" element={isAuthenticated ? <Home gamerInfo={gamerInfo} spartanInventory={spartanInventory}/> : <UnauthenticatedContent startAuth={startAuth} />} />
              <Route path="/match/:matchId" element={<MatchStats gamerInfo={gamerInfo} HaloStats={HaloStats} selectedMatch={selectedMatch} />} />
              <Route path="/stats" element={<Stats gamerInfo={gamerInfo} HaloStats={HaloStats} setHaloStats={setHaloStats} setSelectedMatch={setSelectedMatch} />} />
              <Route path="/operations" element={<Operations gamerInfo={gamerInfo} />} />
              <Route path="/progression" element={<Progression gamerInfo={gamerInfo} HaloStats={HaloStats} setHaloStats={setHaloStats} setSelectedMatch={setSelectedMatch} />} />
              <Route path="/store" element={<Store gamerInfo={gamerInfo} />} />
              <Route path="/item-details" element={<ItemDetailsPage />} />
            </Routes>
          </div>
        </div>
        {/* /#page-content-wrapper */}
      </div>
    </Router>
  );

}
export default App;