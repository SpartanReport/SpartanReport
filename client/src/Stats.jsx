import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, Link } from 'react-router-dom'; // Don't forget to import Routes and Route
import MatchStats from './match-stats';

const Stats = ({ gamerInfo ,HaloStats, setHaloStats}) => {
    const [isLoading, setIsLoading] = useState(true);
  
    useEffect(() => {
      const fetchSpartanInventory = async () => {
        try {
          // Use gamerInfo in the Axios POST request
          const response = await axios.post('http://localhost:8080/stats', gamerInfo);
  
          console.log(response.data);
          setHaloStats(response.data.HaloStats);
        } catch (error) {
          console.error("Error fetching Spartan inventory:", error);
        }
        setIsLoading(false);
      };
  
      fetchSpartanInventory();
    }, [gamerInfo,setHaloStats]);
    
    if (isLoading) {
      return <div>Loading...</div>;
    }
    if (!HaloStats) {
      return <div>No Spartan Stats Data</div>;
    }
  
  return (
    <div>
      {/* Gamer Info Card */}
      <div className="card mb-5">
        <div className="card-body">
          <h5 className="card-title">{gamerInfo.gamertag}</h5>
          <div className="row align-items-center"> {/* Bootstrap row and alignment class */}
            <div className="col-3"> {/* Bootstrap column class */}
              <img src={gamerInfo.gamerpic.medium} alt="Medium Gamerpic" className="rounded" />
            </div>
          </div>
        </div>
      </div>
      {/* Match Stats */}
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Matches</h5>
          <div className="matches">
            {HaloStats.Results.map((result, index) => (
              <Link 
                key={result.MatchId} 
                to={`/match/${result.MatchId}`}
                className="match-link">
                <div className="match">
                  <p>Match ID: {result.MatchId}</p>
                  <p>Start Time: {result.MatchInfo.FormattedStartTime}</p>
                  <p>End Time: {result.MatchInfo.FormattedEndTime}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Routes>
        <Route path="match/:matchId" element={<MatchStats HaloStats={HaloStats} gamerInfo={gamerInfo} />} />
      </Routes>
    </div>
  );
};

export default Stats;