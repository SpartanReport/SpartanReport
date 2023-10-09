import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';

const MatchStats = ({gamerInfo, HaloStats}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [MatchStats, setMatchStats] = useState(null)
  const { matchId } = useParams();

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        const payload = {
          gamerInfo,
          HaloStats,
        };
        const response = await axios.post(`http://localhost:8080/match/${matchId}`, payload);
        setMatchStats(response.data);
        console.log(MatchStats)
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
    <h1>{MatchStats.MatchInfo.PublicName}</h1>
    <p>{MatchStats.MatchInfo.PlaylistInfo.PublicName}</p>

    <div className="row">

      <div className="col">
        <div className="col-md-6">
            <img src={MatchStats.MatchInfo.MapImagePath} alt="" className="img-fluid scaled-image" />
        </div>
        <p>Start Time: {MatchStats.MatchInfo.FormattedStartTime}</p>
        <p>End Time: {MatchStats.MatchInfo.FormattedEndTime}</p>
        <p>Duration: {MatchStats.MatchInfo.Duration}</p>
        <p>Playable Duration: {MatchStats.MatchInfo.PlayableDuration}</p>
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
                <th scope="col">Spartan ID</th>
                <th scope="col">Kills</th>
                <th scope="col">Deaths</th>
                <th scope="col">Assists</th>
                <th scope="col">KDA</th>

                {/* Add more headers for other stats */}
              </tr>
            </thead>
            <tbody>
              {MatchStats.Players?.map((player, index) => (
                <tr key={index}>
                  
                  <td><img src={player.Profile?.gamerpic.small} alt="Medium Gamerpic" className="rounded" />
                  {player.Profile?.gamertag || "Unknown"}</td>
                  <td>{player.PlayerTeamStats[0]?.Stats?.CoreStats?.Kills}</td>
                  <td>{player.PlayerTeamStats[0]?.Stats?.CoreStats?.Deaths}</td>
                  <td>{player.PlayerTeamStats[0]?.Stats?.CoreStats?.Assists}</td>
                  <td>{player.PlayerTeamStats[0]?.Stats?.CoreStats?.KDA}</td>

                  {/* Add more cells for other stats */}
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
