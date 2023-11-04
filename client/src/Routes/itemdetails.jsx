import React from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import "../Styles/selectedoperation.css";
import xpboostImage from '../xpboost.png';
import currencyImage from '../credit.png';
import challengeSwap from '../challengeswap.png';
import checkmark from "../checkmark.svg"
import { useNavigate } from 'react-router-dom';


const ItemDetailsPage = () => {
  const location = useLocation();
  const reward = location.state.reward; // Accessing the reward passed via state
  const navigate = useNavigate();
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
  function SeasonImage(base64ImageData){
    return `data:image/png;base64,${base64ImageData}`;
}
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




  if (!reward) {
    // Handle the case where reward is not passed or undefined
    console.error('Reward details are not available.');
    return <div>Item details not found. Please try again.</div>;
  }

  // Continue with your existing code assuming `reward` is defined
  return (
    <div>
    <div className='track-label-div'>
      <h4 className="track-label">{reward.type}</h4>
    </div>
    <div  className={`season-rank-card ${getBackgroundStyle(reward.Item?.Quality)}`}>
      {reward.Amount && (
        <p className="item-type">
          {rewardType}
        </p>
      )}
      <img className="item-img" src={imageSrc} alt="Reward Logo" />
      <p className='item-core'>{coreDesignation}</p>
    </div>
    <button className="nav-button back" onClick={() => navigate(-1)}>BACK</button>
  </div>
);
};

export default ItemDetailsPage;
