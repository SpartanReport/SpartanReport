import React, { useState, useEffect, useRef } from 'react'; 
import axios from 'axios';
import "./selectedoperation.css";
import xpboostImage from './xpboost.png';
import currencyImage from './credit.png';
import challengeSwap from './challengeswap.png';

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

  useEffect(() => {
    const adjustTextSize = () => {
      const elements = document.querySelectorAll('.item-data');
      elements.forEach(el => {
        while (el.offsetWidth < el.scrollWidth) {
          let currentSize = window.getComputedStyle(el, null).getPropertyValue('font-size');
          let newSize = (parseFloat(currentSize) - 1) + "px";
          el.style.fontSize = newSize;
        }
      });
    };
    adjustTextSize();
  }, [trackData]);

  const getBackgroundStyle = (quality) => {
    switch (quality) {
      case 'Epic':
        return 'background-epic';
      case 'Legendary':
        return 'background-legendary';
      case 'Rare':
        return 'background-rare';
      default:
        return '';
    }
  };

  function transformString(str) {
    let mapping = {
      "SpartanBackdropImage": "Backdrop",
      "SpartanEmblem": "Emblem",
      "ArmorCoating": "Armor Coating",
      "VehicleCoating": "Vehicle Coating",
      "WeaponCharm": "Weapon Charm",
      "WeaponCoating": "Weapon Coating",
      "ArmorGlove": "Gloves",
      "ArmorMythicFx": "Mythic Effect",
      "ArmorFx": "Armor Effect",
      "ArmorTheme": "Armor Kit"
    };
  
    if (mapping.hasOwnProperty(str)) {
      return mapping[str];
    }
    
    if (str.startsWith('Armor')) {
      str = str.substring(5);
    }
    
    return str.replace(/([A-Z])/g, ' $1').trim();
  }
  
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

    return rewards.map((reward, index) => {
      let imageSrc;
      let rewardType;
      let coreDesignation;
      let name;

      if (reward.CurrencyPath === "Currency/Currencies/xpboost.json") {
        imageSrc = xpboostImage
        rewardType = reward.Amount + "x Boost";
        name = "XP Boost";

      } else if (reward.CurrencyPath === "Currency/Currencies/cR.json") {
        imageSrc = currencyImage;
        rewardType = reward.Amount + " cR";
        name = "Credits";

      }else if (reward.CurrencyPath === "Currency/Currencies/rerollcurrency.json") {
        imageSrc = challengeSwap;
        rewardType = reward.Amount  + "x Swap";
        name = "Challenge Swap";
      } else {
        imageSrc = SeasonImage(reward.ItemImageData);
        rewardType = transformString(reward.Type);
        name = reward.Item.Title.value
        if (reward.Item.IsCrossCompatible){
          coreDesignation = "Cross Core"
        }else if(reward.Item.Core === "Unknown Core"){
          coreDesignation = ""
        }else{
          coreDesignation = reward.Item.Core
        }
      }


      return (
        <div>
          <div className='track-label-div'>
            <h4 className="track-label">{reward.type}</h4>
          </div>
          <div key={index} className={`season-rank-card ${getBackgroundStyle(reward.Item?.Quality)}`}>
            <p className='item-data'>{name}</p>
            {reward.Amount && (
              <p className="item-type">
                {rewardType}
              </p>
            )}
            <img className="item-img" src={imageSrc} alt="Reward Logo" />
            <p className='item-core'>{coreDesignation}</p>
          </div>
        </div>
      );
    });
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
