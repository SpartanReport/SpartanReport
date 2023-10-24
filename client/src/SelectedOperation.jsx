import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./selectedoperation.css";

function SelectedOperation({ gamerInfo, seasonData, handleBackClick, SeasonImage }) {
  const [trackData, setTrack] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOperations = async () => {
      try {
        const payload = {
          gamerInfo,
          seasonData,
        };
        const response = await axios.post('http://localhost:8080/operationdetails', payload);
        setTrack(response.data);
        console.log(response.data)
      } catch (error) {
        console.error("Error fetching Spartan inventory:", error);
      }
      setIsLoading(false);
    };

    fetchOperations();
  }, [gamerInfo, seasonData]);

  const displayRewards = (rank) => {
    const rewards = [];

    if (rank.FreeRewards) {
      rewards.push(...rank.FreeRewards.InventoryRewards.map(reward => ({ ...reward, type: 'Free' })));
      rewards.push(...rank.FreeRewards.CurrencyRewards.map(reward => ({ ...reward, type: 'Free' })));
    }

    if (rank.PaidRewards) {
      rewards.push(...rank.PaidRewards.InventoryRewards.map(reward => ({ ...reward, type: 'Paid' })));
      rewards.push(...rank.PaidRewards.CurrencyRewards.map(reward => ({ ...reward, type: 'Paid' })));
    }

    return rewards.map((reward, index) => (
      <div key={index} className="season-rank-card">
        <h4 className="track-label">{reward.type}</h4>
        <img className="item-img" src={SeasonImage(reward.ItemImageData)} alt="Reward Logo" />
        {reward.Amount && (
          <p>
            Amount: {reward.Amount}, Currency Path: {reward.CurrencyPath}
            {reward.Quality}
          </p>
        )}
      </div>
    ));
  };

  return (
    <div>
      <button className="back-button" onClick={handleBackClick}>Back</button>
      <div className="operation-container-single">
        <div className="season-card-selected">
          <img className="season-img-selected" src={SeasonImage(seasonData.SeasonMetadataDetails.SeasonImage)} alt="Season Logo" />
          <div className="text-overlay">
            <h3 className="season-name-selected">{seasonData.SeasonMetadataDetails.Name.value}</h3>
          </div>
        </div>
        <p className="date-text"><strong>{seasonData.SeasonMetadataDetails.DateRange.value}</strong></p>
        <p className="custom-text-3"><strong>Is Active: </strong>{String(seasonData.IsActive)}</p>
        <div className="scrollable-ranks">
          {trackData.Ranks && trackData.Ranks.map((rank, index) => (
            <div key={index} className="season-rank-container">
              <div className="rank-number">Rank {index + 1}</div>
              <div className="season-rank-row">
                {displayRewards(rank)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SelectedOperation;
