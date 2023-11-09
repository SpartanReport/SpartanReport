import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, Link, useLocation } from 'react-router-dom'; // Import useLocation
import MatchStats from './match-stats';
import { useNavigate } from 'react-router-dom';
import "../Styles/stats.css"

const Stats = ({ gamerInfo ,HaloStats, setHaloStats, setSelectedMatch}) => {
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation(); // Get the current location

    useEffect(() => {
      const fetchSpartanInventory = async () => {
        try {
          // Use gamerInfo in the Axios POST request
          const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080'; // Fallback URL if the env variable is not set
          const response = await axios.post(`${apiUrl}/stats`, gamerInfo);
          console.log(response.data.HaloStats)
          setHaloStats(response.data.HaloStats);
        } catch (error) {
          console.error("Error fetching Spartan inventory:", error);
        }
        setIsLoading(false);
        
      };
    
      // Only fetch Spartan inventory if HaloStats is not already populated
      if (!HaloStats) {
        fetchSpartanInventory();
      }
    }, [gamerInfo, setHaloStats, HaloStats]);

    // Reset HaloStats state when navigating back to /stats
    useEffect(() => {
      if (location.pathname === '/stats') {
        setHaloStats(null);
      }
    }, [location, setHaloStats]);

    if (isLoading) {
      return <div>Loading...</div>;
    }
    if (!HaloStats) {
      return <div>No Spartan Stats Data</div>;
    }

  return (
    <div>
      <div className="title-container-matches">
        <h1 className="matches-title-home">BATTLE LOG</h1>
      </div>
      <div>

{/* Match Stats */}
<div className="welcome-cards-matches">

    <div className="matches">
      {HaloStats.Results.map((result, index) => (
        <Link 
        key={result.MatchId} 
        to={`/match/${result.MatchId}`}
        onClick={() => {
          setSelectedMatch(result.Match);
          navigate(`/match/${result.Match.MatchId}`);
        }}
        className="match-link">
        <div className="match" >
          <img src={result.Match.MatchInfo.MapImagePath} alt="Map" className="match-img" />
            <div className="info-col">
              <p className="map-name">{result.Match.MatchInfo.PublicName}</p>
              <p className="playlist">{result.Match.MatchInfo.PlaylistInfo.PublicName}</p>
            </div>
            <div className="time-col">
              <p>End Time: {result.Match.MatchInfo.FormattedEndTime}</p>
              <p>Start Time: {result.Match.MatchInfo.FormattedStartTime}</p>
            </div>
            {HaloStats.Results[index].PresentAtEndOfMatch ? '' : 'Left Match Early :('}
          </div>

        </Link>
      ))}
    </div>
</div>
<Routes>
  <Route path="match/:matchId" element={<MatchStats HaloStats={HaloStats} gamerInfo={gamerInfo} />} />
</Routes>
</div>
    </div>

  );
};

export default Stats;