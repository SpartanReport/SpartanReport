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
        const response = await axios.post(`http://localhost:8080/match/${matchId}`, payload);
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
    <h1>{selectedMatch.MatchInfo.PublicName}</h1>
    <p>{selectedMatch.MatchInfo.PlaylistInfo.PublicName}</p>

    <div className="row">

      <div className="col">
        <div className="col-md-6">
            <img src={selectedMatch.MatchInfo.MapImagePath} alt="" className="img-fluid scaled-image" />
        </div>
        <p>Start Time: {selectedMatch.MatchInfo.FormattedStartTime}</p>
        <p>End Time: {selectedMatch.MatchInfo.FormattedEndTime}</p>
        <p>Duration: {selectedMatch.MatchInfo.Duration}</p>
        <p>Playable Duration: {selectedMatch.MatchInfo.PlayableDuration}</p>
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
                    <img src={player.Profile?.gamerpic.small} alt="Medium Gamerpic" />
                  </td>
                  <td className="gamertag-td">
                    {player.Profile?.gamertag || "Unknown"}
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
