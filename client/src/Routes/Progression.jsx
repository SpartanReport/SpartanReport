import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom'; // Import useLocation
import "../Styles/progression.css"
import RankTable from './RankTable';

const Progression = ({ gamerInfo ,HaloStats, setHaloStats, setSelectedMatch}) => {
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation(); // Get the current location
    const [careerTrack, setCareerTrack] = useState()
    const [careerLadder, setCareerLadder] = useState()
    const [playlistMultipliers, setPlaylistMultipliers] = useState()
    const [playlistTimes, setPlaylistTimes] = useState()
    const [rankImages, setRankImages] = useState([]); // New state variable for rank images

    
    useEffect(() => {
      const fetchSpartanInventory = async () => {
        try {
          // Use gamerInfo in the Axios POST request
          const response = await axios.post('http://localhost:8080/progression', gamerInfo);
          console.log(response.data.AverageDurations)
          console.log("Halo Stats" , response.data.HaloStats)
          console.log(response.data.careerLadder)
          console.log(response.data.RankImages)

          setRankImages(response.data.RankImages);
          console.log(response.data); // Log the rank images


          setCareerTrack(response.data.CareerTrack)
          setCareerLadder(response.data.CareerLadder)
          setPlaylistMultipliers(response.data.AdjustedAverages)
          setPlaylistTimes(response.data.AverageDurations)
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

    const playlistMultiplierArray = Object.keys(playlistMultipliers).map(key => ({
      name: key,
      adjusted_xp: playlistMultipliers[key]
  }));
  console.log(careerLadder)

  const getRankImageData = (rankIndex) => {
    const rankImage = rankImages[rankIndex].Image
    console.log("Rank Image: ", rankImage)
    return rankImage
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
                    <div className="progressBarProgression">
                        <div 
                          className="progressBarFillProgression" 
                          style={{ width: `${(partialProgress/xpRequiredForNextRank) * 100}%` }}
                        >
                        </div>
                    </div>
                ) : ""}
                {isSpotlight ? (
                   <p>{xpRemaining} XP Left</p>
                ) : ""}
            </div>
        );
    }; 
    
    return (
      <div className="grid-container main-grid-container-progression">
          <div className="title-container-home">
            <h1 className="spartan-title-home">PROGRESSION</h1>
          </div>
          <div className="subheader-container-home">
          <svg className="diamond-icon" id="Layer_2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22.92 22.92"><defs></defs><g id="Layer_3"><g><path class="cls-1" d="M11.46,0L0,11.46l11.46,11.46,11.46-11.46L11.46,0ZM3.41,11.46L11.46,3.41l8.05,8.05-8.05,8.05L3.41,11.46Z"/><rect class="cls-1" x="8.16" y="8.16" width="6.59" height="6.59" transform="translate(-4.75 11.46) rotate(-45)"/></g></g></svg>
            <h1 className="spartan-subheader-home">RANK PROGRESS</h1>
          </div>
      
          <div className="grid-col-6">
            <div className="card mb-5 rank-card" style={{height: '70vh'}}>
              <div className="card-header">
                <h1>Rank</h1>
              </div>
              <div className="rank-row">
                {getRankContainer(careerTrack.CurrentProgress.Rank, true)}
                {careerTrack.CurrentProgress.Rank+1 < careerLadder.Ranks.length && getRankContainer(careerTrack.CurrentProgress.Rank+1, false)}
              </div>
              <p className='HeroProgress'>Road to Hero is {(Math.floor((careerTrack.CurrentProgress.TotalXPEarned / 9319351) * 10000) / 100).toFixed(2)}% complete!</p>
            </div>
          </div>
    
          <div className="grid-col-6">
            <div className="card mb-5 playlist-card">
              <div className="card-header">
                <h1>Averages Per Playlist</h1>
              </div>
              <thead>
                    <tr className='top-icon-bar'>
                      <th>Playlist</th>
                      <th><i className="xp-icon"></i></th>
                      <th><i className="time-icon"></i></th>
                      <th><i className="rate-icon"></i></th>
                    </tr>
              </thead>
              <div className="card-body playlist-card-body">
                <table className="xp-table">
   
                  <tbody>
                    {playlistMultiplierArray
                      .map((playlistData, index) => {
                        const playlistTimeInMinutes = parseInt(playlistTimes[playlistData.name].split(':')[0]) + parseInt(playlistTimes[playlistData.name].split(':')[1]) / 60;
                        const xpPerMinute = playlistData.adjusted_xp / playlistTimeInMinutes;
                        return {
                          ...playlistData,
                          xpPerMinute: isNaN(xpPerMinute) ? 0.00 : xpPerMinute
                        };
                      })
                      .sort((a, b) => b.xpPerMinute - a.xpPerMinute)
                      .map((playlistData, index) => (
                        <tr className='table-element' key={index}>
                          <td>{playlistData.name}</td>
                          <td>{parseInt(playlistData.adjusted_xp)}</td>
                          <td>{playlistTimes[playlistData.name]} Min</td>
                          <td>{playlistData.xpPerMinute.toFixed(2)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="subheader-container-rank-table">
          <svg className="diamond-icon" id="Layer_2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22.92 22.92"><defs></defs><g id="Layer_3"><g><path class="cls-1" d="M11.46,0L0,11.46l11.46,11.46,11.46-11.46L11.46,0ZM3.41,11.46L11.46,3.41l8.05,8.05-8.05,8.05L3.41,11.46Z"/><rect class="cls-1" x="8.16" y="8.16" width="6.59" height="6.59" transform="translate(-4.75 11.46) rotate(-45)"/></g></g></svg>
            <h1 className="spartan-subheader-home">RANK TABLE</h1>
          </div>
          <div className="grid-row-full rank-table-outer-container">
            <div className="card mb-5 rank-table-elem">
            <div className='RankTable'>
              <RankTable
                currentRank={careerTrack.CurrentProgress.Rank}
                rankImages={rankImages}
                careerLadder={careerLadder}
              />
            </div>
          </div>
        </div>
      </div>
    );
    
    
};

export default Progression;