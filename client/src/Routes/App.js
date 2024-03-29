import React, { useState, useEffect } from 'react';
import "../Styles/styles.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from './Home';
import Spartan from './Spartan';
import Stats from './Stats';
import Progression from './Progression';
import MatchStats from './match-stats';
import Header from './Header';
import UnauthenticatedContent from './UnauthenticatedContent';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './Navbar';
import Operations from './Operations';
import Store from './store';
import ItemDetailsPage from '../Components/itemdetails';
import CommandCenter from './CommandCenter';
import Policy from './policy';
import SelectedOperation from './SelectedOperation';
import Donate from './donate';
import useAutoRenewToken from '../auth/AuthRenewToken'; // Adjust the path as necessary
import { useAuth } from '../Components/GlobalStateContext'; // Adjust the import path as needed
import useStartAuth from '../auth/AuthComponent';
import CustomKit from './CustomKit';


function App() {
  useAutoRenewToken();
  const [ setIsLoading] = useState(true);
  const {isAuthenticated, setIsAuthenticated } = useAuth();
    const [gamerInfo, setGamerInfo] = useState();
  const [HaloStats, setHaloStats] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [spartanInventory, setSpartanInventory] = useState(null);

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
  }, [setIsAuthenticated]);

  useEffect(() => {
    // Save gamerInfo to local storage whenever it changes
    if (gamerInfo) {
      localStorage.setItem('gamerInfo', JSON.stringify(gamerInfo));
    }
  }, [gamerInfo]);



  const startAuth = useStartAuth();

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
              <Route path="/donate" element={<Donate />} />
              <Route path="/" element={<Home />} />
              <Route path="/match/:matchId" element={<MatchStats gamerInfo={JSON.parse(localStorage.getItem('gamerInfo'))} HaloStats={HaloStats} selectedMatch={selectedMatch} />} />
              <Route path="/stats" element={<Stats gamerInfo={JSON.parse(localStorage.getItem('gamerInfo'))} HaloStats={HaloStats} setHaloStats={setHaloStats} setSelectedMatch={setSelectedMatch} />} />
              <Route path="/operations" element={<Operations gamerInfo={gamerInfo} />} />
              <Route path="/operations/:operationId" element={<SelectedOperation gamerInfo={gamerInfo} />} />
              <Route path="/progression" element={<Progression gamerInfo={JSON.parse(localStorage.getItem('gamerInfo'))} HaloStats={HaloStats} setHaloStats={setHaloStats} setSelectedMatch={setSelectedMatch} />} />
              <Route path="/store" element={<Store gamerInfo={JSON.parse(localStorage.getItem('gamerInfo'))} />} />
                <Route path= "/customkit/:kitId/:xuid" element={<CustomKit gamerInfo={JSON.parse(localStorage.getItem('gamerInfo'))} startAuth={startAuth}  />} />
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