import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

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
<div className="card mb-5">
  <div className="card-body">
    <h5 className="card-title">Match Stats</h5>
    <div className="row">
      <div className="col">
        <p>Public Name: {MatchStats.MatchInfo.PublicName}</p>
        <div className="col-md-6">
            <img src={MatchStats.MatchInfo.MapImagePath} alt="" className="img-fluid scaled-image" />
        </div>
        <p>Match ID: {MatchStats.MatchId}</p>
        <p>Start Time: {MatchStats.MatchInfo.StartTime}</p>
        <p>End Time: {MatchStats.MatchInfo.EndTime}</p>
        <p>Duration: {MatchStats.MatchInfo.Duration}</p>
        <p>Lifecycle Mode: {MatchStats.MatchInfo.LifecycleMode}</p>
        <p>Game Variant Category: {MatchStats.MatchInfo.GameVariantCategory}</p>
        <p>Level ID: {MatchStats.MatchInfo.LevelId}</p>
        <p>Map Variant Asset ID: {MatchStats.MatchInfo.MapVariant.AssetId}</p>
        <p>Map Variant Version ID: {MatchStats.MatchInfo.MapVariant.VersionId}</p>
        <p>Ugc Game Variant Asset ID: {MatchStats.MatchInfo.UgcGameVariant.AssetId}</p>
        <p>Ugc Game Variant Version ID: {MatchStats.MatchInfo.UgcGameVariant.VersionId}</p>
        <p>Clearance ID: {MatchStats.MatchInfo.ClearanceId}</p>
        <p>Playlist Asset ID: {MatchStats.MatchInfo.Playlist.AssetId}</p>
        <p>Playlist Version ID: {MatchStats.MatchInfo.Playlist.VersionId}</p>
        <p>Playlist Experience: {MatchStats.MatchInfo.PlaylistExperience}</p>
        <p>Playlist Map Mode Pair Asset ID: {MatchStats.MatchInfo.PlaylistMapModePair.AssetId}</p>
        <p>Playlist Map Mode Pair Version ID: {MatchStats.MatchInfo.PlaylistMapModePair.VersionId}</p>
        <p>Season ID: {MatchStats.MatchInfo.SeasonId}</p>
        <p>Playable Duration: {MatchStats.MatchInfo.PlayableDuration}</p>
        <p>Teams Enabled: {MatchStats.MatchInfo.TeamsEnabled.toString()}</p>
        <p>Team Scoring Enabled: {MatchStats.MatchInfo.TeamScoringEnabled.toString()}</p>
        <p>Gameplay Interaction: {MatchStats.MatchInfo.GameplayInteraction}</p>
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
                <th scope="col">Player ID</th>
                <th scope="col">Kills</th>
                <th scope="col">Deaths</th>
                {/* Add more headers for other stats */}
              </tr>
            </thead>
            <tbody>
              {MatchStats.Players?.map((player, index) => (
                <tr key={index}>
                  <td>{player.PlayerId}</td>
                  <td>{player.PlayerTeamStats[0]?.Stats?.CoreStats?.Kills}</td>
                  <td>{player.PlayerTeamStats[0]?.Stats?.CoreStats?.Deaths}</td>
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
