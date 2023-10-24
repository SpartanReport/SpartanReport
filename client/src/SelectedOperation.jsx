import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./selectedoperation.css"

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

  const displayRewards = (rewards) => (
    <div>
      {rewards.InventoryRewards && rewards.InventoryRewards.length > 0 && (
        <div>
          {rewards.InventoryRewards.map((invReward, index) => (
            <div key={index}>
              <img className="item-img" src={SeasonImage(invReward.ItemImageData)} alt="Reward Logo" />
            </div>
          ))}
        </div>
      )}
      {rewards.CurrencyRewards && rewards.CurrencyRewards.length > 0 && (
        <div>
          {rewards.CurrencyRewards.map((currReward, index) => (
            <div key={index}>
              <p>
                Amount: {currReward.Amount}, Currency Path: {currReward.CurrencyPath}
              </p>
              <img className="item-img" src={SeasonImage(currReward.ItemImageData)} alt="Reward Logo" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
  


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
        <p className="custom-text-3"><strong>Is Active: </strong> {String(seasonData.IsActive)}</p>

        <div className="scrollable-ranks">
        {trackData.Ranks && trackData.Ranks.map((rank, index) => (
            <div key={index} className="season-rank-container">
            <div className="rank-number">Rank {index + 1}</div>
            <div className="season-rank-row">
                {rank.FreeRewards && (rank.FreeRewards.InventoryRewards.length || rank.FreeRewards.CurrencyRewards.length) && (
                <div className="season-rank-card">
                    <h4 className="track-label">Free</h4>
                    {displayRewards(rank.FreeRewards, 'Free')}
                </div>
                )}
                {rank.PaidRewards && (rank.PaidRewards.InventoryRewards.length || rank.PaidRewards.CurrencyRewards.length) && (
                <div className="season-rank-card">
                    <h4 className="track-label">Paid</h4>
                    {displayRewards(rank.PaidRewards, 'Paid')}
                </div>
                )}

            </div>
            
            </div>
            
        ))}
        
        </div>
        
      </div>
      
      <div>

      </div>
    </div>
  );
}

export default SelectedOperation;
