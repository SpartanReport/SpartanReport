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
import Sidebar from '../Sidebar';
import "../Styles/svgwave.css"
import Operations from './Operations';
import Store from './store';

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




  return (
    <Router>
    <div className="d-flex flex-row" style={{ width: '100%' } } id="wrapper">
          {/* Sidebar */}
          <Sidebar clearCookie={clearCookie} isAuthenticated={isAuthenticated} startAuth={startAuth} />
            {/* Header */}
            <Header gamerInfo={gamerInfo} />
            {/* Routes */}

        {/* Page Content */}
        <div id="page-content-wrapper">
          <div className="container-fluid">
          <div class="custom-shape">
            <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path id="wave1" d="M-5,0 Q0,0 0,46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47 Q1205,52.47 1205,0 Z" opacity=".25" class="wave wave2 shape-fill"></path>
            <path id="wave2" d="M-5,0 Q0,0 0,15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24 Q1205,0 1205,0 Z" opacity=".5" class=" wave wave1 shape-fill"></path>
              <path id="wave3" d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" class="shape-fill"></path>
            </svg>
            </div>
            <Routes>
              <Route path="/spartan" element={<Spartan gamerInfo={gamerInfo} spartanInventory={spartanInventory} setSpartanInventory={setSpartanInventory} />} />
              <Route path="/" element={isAuthenticated ? <Home gamerInfo={gamerInfo} spartanInventory={spartanInventory}/> : <UnauthenticatedContent startAuth={startAuth} />} />
              <Route path="/match/:matchId" element={<MatchStats gamerInfo={gamerInfo} HaloStats={HaloStats} selectedMatch={selectedMatch} />} />
              <Route path="/stats" element={<Stats gamerInfo={gamerInfo} HaloStats={HaloStats} setHaloStats={setHaloStats} setSelectedMatch={setSelectedMatch} />} />
              <Route path="/operations" element={<Operations gamerInfo={gamerInfo} />} />
              <Route path="/progression" element={<Progression gamerInfo={gamerInfo} HaloStats={HaloStats} setHaloStats={setHaloStats} setSelectedMatch={setSelectedMatch} />} />
              <Route path="/store" element={<Store gamerInfo={gamerInfo} />} />

            </Routes>
          </div>
        </div>
        {/* /#page-content-wrapper */}
      </div>
    </Router>
  );

}
export default App;