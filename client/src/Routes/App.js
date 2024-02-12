import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../Styles/styles.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from './Home';
import Spartan from './Spartan';
import Stats from './Stats';
import Progression from './Progression';
import MatchStats from './match-stats';
import Header from './Header';
import UnauthenticatedContent from './UnauthenticatedContent';
import { BrowserRouter as Router, Route, Routes , useNavigate} from 'react-router-dom';
import Navbar from './Navbar';
import Operations from './Operations';
import Store from './store';
import ItemDetailsPage from '../Components/itemdetails';
import CommandCenter from './CommandCenter';
import Policy from './policy';
import SelectedOperation from './SelectedOperation';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [gamerInfo, setGamerInfo] = useState();
  const [HaloStats, setHaloStats] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [spartanInventory, setSpartanInventory] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token');

  useEffect(() => {
    // Load gamerInfo from local storage on component mount
    const storedGamerInfo = localStorage.getItem('gamerInfo');
    if (storedGamerInfo) {
      const parsedGamerInfo = JSON.parse(storedGamerInfo);
      if (parsedGamerInfo.spartankey === ""){
        setIsAuthenticated(false); // Set isAuthenticated to true

      }else{
        setGamerInfo(parsedGamerInfo); // Set the gamerInfo state
        setIsAuthenticated(true); // Set isAuthenticated to true
  
      }
    } else {
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Save gamerInfo to local storage whenever it changes
    if (gamerInfo) {
      localStorage.setItem('gamerInfo', JSON.stringify(gamerInfo));
    }
  }, [gamerInfo]);

  const fetchGamerInfo = async (token) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const response = await axios.get(`${apiUrl}/getGamerInfo?token=${token}`);
      if (response.data) {
        setGamerInfo(response.data);
        setIsAuthenticated(true);
        const apiUrl = process.env.REACT_APP_REDIRECT_URL || 'http://localhost:3000';

        window.location.href = `${apiUrl}/`;
  
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error fetching gamerInfo:", error);
      setIsAuthenticated(false);
    }
  };

  const checkAuth = async () => {
    if (gamerInfo) {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      try {
        const response = await axios.post(`${apiUrl}/account`, gamerInfo);
        if (response.data.IsNew) {
          if (response.data.gamerInfo!==null) {
          setGamerInfo(response.data.gamerInfo); // Update gamerInfo with new data
          setIsAuthenticated(true);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error in checkAuth:", error);
        setIsAuthenticated(false);
      }
    } else {
      if (localStorage.getItem('gamerInfo')!==null) {
        setIsAuthenticated(true);
      }else{
      setIsAuthenticated(false);

      }
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');
    if (token) {
      fetchGamerInfo(token);
    } else {
      checkAuth();
    }
  }, []);

  const startAuth = () => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    window.location.href = `${apiUrl}/startAuth`;
  };

  // JSX rendering
  return (
    <Router>
      <div className="d-flex flex-column" style={{ width: '100%' }}>
        {/* Sidebar */}
        <Navbar isAuthenticated={isAuthenticated} startAuth={startAuth} />
        {/* Header */}
        {/* Routes */}
        <div id="page-content-wrapper">
          <div className="container-fluid p-0">
            <Routes>
              <Route path="/spartan" element={<Spartan gamerInfo={JSON.parse(localStorage.getItem('gamerInfo'))} spartanInventory={spartanInventory} setSpartanInventory={setSpartanInventory} />} />
              <Route path="/CommandCenter" element={isAuthenticated ? <CommandCenter gamerInfo={JSON.parse(localStorage.getItem('gamerInfo'))} spartanInventory={spartanInventory}/> : <UnauthenticatedContent startAuth={startAuth} />} />
              <Route path="/policy" element={<Policy />} />
              <Route path="/" element={<Home />} />
              <Route path="/match/:matchId" element={<MatchStats gamerInfo={JSON.parse(localStorage.getItem('gamerInfo'))} HaloStats={HaloStats} selectedMatch={selectedMatch} />} />
              <Route path="/stats" element={<Stats gamerInfo={JSON.parse(localStorage.getItem('gamerInfo'))} HaloStats={HaloStats} setHaloStats={setHaloStats} setSelectedMatch={setSelectedMatch} />} />
              <Route path="/operations" element={<Operations gamerInfo={gamerInfo} />} />
              <Route path="/operations/:operationId" element={<SelectedOperation gamerInfo={gamerInfo} />} />
              <Route path="/progression" element={<Progression gamerInfo={JSON.parse(localStorage.getItem('gamerInfo'))} HaloStats={HaloStats} setHaloStats={setHaloStats} setSelectedMatch={setSelectedMatch} />} />
              <Route path="/store" element={<Store gamerInfo={JSON.parse(localStorage.getItem('gamerInfo'))} />} />
              <Route path="/item-details" element={<ItemDetailsPage />} />
              <Route path="/logout" />
            </Routes>
          </div>
        </div>
        {/* /#page-content-wrapper */}
        <Header gamerInfo={JSON.parse(localStorage.getItem('gamerInfo'))} />

      </div>
    </Router>
  );
}

export default App;