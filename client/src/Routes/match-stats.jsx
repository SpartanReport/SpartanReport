import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';

const MatchStats = ({gamerInfo, HaloStats,selectedMatch}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [MatchStats, setMatchStats] = useState(null)
  const { matchId } = useParams();

  useEffect(() => {
    const fetchMatchDetails = async () => {
      console.log(selectedMatch)

      try {
        const payload = {
          gamerInfo,
          selectedMatch,
        };
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080'; // Fallback URL if the env variable is not set

        const response = await axios.post(`${apiUrl}/match/${matchId}`, payload);
        setMatchStats(response.data);
      } catch (error) {
        console.error("Error fetching match details:", error);
      }
      setIsLoading(false);
    };

    fetchMatchDetails();
  }, [gamerInfo, HaloStats, matchId]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!MatchStats) {
    return <div>No Spartan Stats Data</div>;
  }
  function convertISO8601ToMinutesSeconds(duration) {
    // Match the duration parts using a regular expression
    const matches = duration.match(/PT(\d+M)?(\d+(\.\d+)?S)?/);
  
    if (!matches) {
      throw new Error('Invalid duration format');
    }
  
    let minutes = 0;
    let seconds = 0;
  
    // If the minutes part is found, parse it as an integer
    if (matches[1]) {
      minutes = parseInt(matches[1]);
    }
  
    // If the seconds part is found, parse it as a float and round it
    if (matches[2]) {
      seconds = Math.round(parseFloat(matches[2]));
    }
  
    // Format seconds to ensure it has a leading zero if less than 10
    const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
  
    // Return the formatted time string
    return `${minutes}:${formattedSeconds}`;
  }
  
  return (
    <>
{/* Match Stats Card */}
<Link 
                to={`/stats`}
                className="stats-link">
                Back to stats
    </Link>

<div className="card mb-5">
  <div className="card-body">
    
    <h5 className="card-title">Match Stats</h5>
    <h3>{selectedMatch.MatchInfo.PlaylistInfo.PublicName} {selectedMatch.MatchInfo.PublicName}</h3>

    <div className="row match-row">
      <div className="col">
        <div className="col-md-6">
            <img src={selectedMatch.MatchInfo.MapImagePath} alt="" className="img-fluid scaled-image" />
        </div>
        <p>Start Time: {selectedMatch.MatchInfo.FormattedStartTime}</p>
        <p>End Time: {selectedMatch.MatchInfo.FormattedEndTime}</p>
        <p>Duration: {convertISO8601ToMinutesSeconds(selectedMatch.MatchInfo.PlayableDuration)}</p>
      </div>
    </div>
  </div>
</div>

      {/* Player Stats Card */}
      <div className="card mt-5">
        <div className="card-body">
          <h5 className="card-title">Player Stats</h5>
          <table className="table">
            <thead>
              <tr>
              <th scope="col">Team</th>
              <th scope="col"></th>
                <th scope="col">Spartan ID</th>
                <th scope="col">Kills</th>
                <th scope="col">Deaths</th>
                <th scope="col">Assists</th>
                <th scope="col">KDA</th>

                {/* Add more headers for other stats */}
              </tr>
            </thead>
            <tbody>
              {MatchStats.Players?.sort((a, b) => a.PlayerTeamStats[0]?.TeamId - b.PlayerTeamStats[0]?.TeamId).map((player, index) => (
                <tr key={index}>
                  <td style={{ 
                    width: '1px',
                    backgroundColor: player.PlayerTeamStats[0].TeamId === 0 ? '#178DD8' :  '#B00000',
                    borderTop: 'none',
                    borderBottom: 'none',
                    borderSpacing: '0'
                  }} ></td>
                  <td className="gamerpic-td">
                    <img src={player.Profile?.gamerpic.small} alt="" />
                  </td>
                  <td className="gamertag-td">
                    {player.Profile?.gamertag || "Bot"}
                  </td>
                  <td className="kills-td">
                    {player.PlayerTeamStats[0]?.Stats?.CoreStats?.Kills}
                  </td>
                  <td className="deaths-td">
                    {player.PlayerTeamStats[0]?.Stats?.CoreStats?.Deaths}
                  </td>
                  <td className="assists-td">
                    {player.PlayerTeamStats[0]?.Stats?.CoreStats?.Assists}
                  </td>
                  <td className="kda-td">
                    {player.PlayerTeamStats[0]?.Stats?.CoreStats?.KDA}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>
    </>
  );
};

export default MatchStats;
