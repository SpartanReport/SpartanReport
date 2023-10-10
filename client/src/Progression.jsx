import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, Link, useLocation } from 'react-router-dom'; // Import useLocation
import MatchStats from './match-stats';
import { useNavigate } from 'react-router-dom';

const Progression = ({ gamerInfo ,HaloStats, setHaloStats, setSelectedMatch}) => {
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation(); // Get the current location
    const [careerTrack, setCareerTrack] = useState()
    const [careerLadder, setCareerLadder] = useState()

    
    useEffect(() => {
      const fetchSpartanInventory = async () => {
        try {
          // Use gamerInfo in the Axios POST request
          const response = await axios.post('http://localhost:8080/progression', gamerInfo);
          console.log(response.data.CareerTrack)
          console.log(response.data.CareerLadder)
          setCareerTrack(response.data.CareerTrack)
          setCareerLadder(response.data.CareerLadder)

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
      if (location.pathname === '/progression') {
        setHaloStats(null);
      }
    }, [location, setHaloStats]);

    if (isLoading) {
      return <div>Loading...</div>;
    }
    if (!HaloStats) {
      return <div>No Spartan Stats Data</div>;
    }
    const xpRequiredForNextRank = careerLadder.Ranks[careerTrack.CurrentProgress.Rank].XpRequiredForRank;
    const partialProgress = careerTrack.CurrentProgress.PartialProgress;
    const xpRemaining = xpRequiredForNextRank - partialProgress;


    const getRankImageData = (rankIndex) => {
        if (rankIndex < careerTrack.CurrentProgress.Rank) {
            return careerTrack.CurrentProgress.PreviousRankIconData;
        } else if (rankIndex > careerTrack.CurrentProgress.Rank) {
            return careerTrack.CurrentProgress.NextRankIconData;
        }
        return careerTrack.CurrentProgress.RankIconData;
    };
    
    const getRankContainer = (rankIndex, isSpotlight) => {
        const rankIconData = getRankImageData(rankIndex);
        const rankTitle = careerLadder.Ranks[rankIndex].RankTitle.value;
        const rankGrade = careerLadder.Ranks[rankIndex].RankGrade;
        const containerClass = isSpotlight ? 'rank-spotlight' : 'rank-regular';
    
        let headerText;
        if (isSpotlight) {
            headerText = "Current Rank";
        } else if (rankIndex < careerTrack.CurrentProgress.Rank) {
            headerText = "Previous Rank";
        } else {
            headerText = "Next Rank";
        }
    
        return (
            <div className={`rank-container ${containerClass}`}>
                <div className="rank-header">
                    <p>{headerText}</p>
                </div>
                <img
                    className={isSpotlight ? 'rank-spotlight-image' : 'rank-regular-image'}
                    src={`data:image/jpeg;base64,${rankIconData}`}
                    alt={`Rank Icon - ${rankTitle} Grade ${rankGrade}`}
                />
                <p>{rankTitle} Grade {rankGrade}</p>
                {isSpotlight ? (
                    <div className="progress-container">
                        <progress value={partialProgress} max={xpRequiredForNextRank}></progress>
                    </div>
                ) : ""}
                {isSpotlight ? (
                   <p>{xpRemaining} XP Left</p>
                ) : ""}
            </div>
        );
    };
    
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
      <div className="card mb-5">
      <div className="card-header">
            < h1>Progression</h1>
          </div>
        <div className="rank-row">
            {careerTrack.CurrentProgress.Rank-1 >= 0 && getRankContainer(careerTrack.CurrentProgress.Rank-1, false)}
            {getRankContainer(careerTrack.CurrentProgress.Rank, true)}
            {careerTrack.CurrentProgress.Rank+1 < careerLadder.Ranks.length && getRankContainer(careerTrack.CurrentProgress.Rank+1, false)}
        </div>
        <p>Total XP Gained So Far {careerTrack.CurrentProgress.TotalXPEarned}</p>

 

      </div>
      {/* Match Stats 
      <div className="card mb-5">
          <div className="card-header">
            < h1>Matches</h1>
          </div>
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
            */}
      <Routes>
        <Route path="match/:matchId" element={<MatchStats HaloStats={HaloStats} gamerInfo={gamerInfo} />} />
      </Routes>
    </div>
  );
};

export default Progression;