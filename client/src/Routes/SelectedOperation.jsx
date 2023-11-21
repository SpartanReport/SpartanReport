import React, { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "../Styles/selectedoperation.css";
import xpboostImage from '../xpboost.png';
import currencyImage from '../credit.png';
import ItemDetailsPage from '../Components/itemdetails';
import challengeSwap from '../challengeswap.png';
import checkmark from "../checkmark.svg"
import { Routes, Route,useParams } from 'react-router-dom';
import SvgBorderWrapper from '../Styles/Border';


function SeasonImage(base64ImageData) {
  return `data:image/png;base64,${base64ImageData}`;
}

function DisplayEvent({ season }) {
  if (!season) return null; // Don't render if no season data is present

  // Get the current date and the start date of the season
  const currentDate = new Date();
  const startDate = new Date(season.StartDate.ISO8601Date);

  // Determine whether the season is past, present, or future
  let seasonStatus;
  if (startDate > currentDate) {
    seasonStatus = "FUTURE";
  } else if (season.IsActive) {
    seasonStatus = "ACTIVE";
  } else {
    seasonStatus = "PAST";
  }

  // Determine the class name based on the season's status
  const titleContainerClassName = `title-container-event-home-${seasonStatus.toLowerCase()}`;

  return (
    <div className="event-card-ops">
      <div className={titleContainerClassName}>
        <h2 className="event-title-ops">
          {seasonStatus === "ACTIVE" && <span className="live-text">LIVE </span>}
          {seasonStatus === "PAST" && <span className="past-text">PAST </span>}
          {seasonStatus === "FUTURE" && <span className="future-text">FUTURE </span>} - 
          <span className="event-date-ops">{season.SeasonMetadataDetails.DateRange.value}</span>
        </h2>
      </div>

      <img className="event-image" src={SeasonImage(season.SeasonMetadataDetails.SeasonImage)} alt="Season Logo" />
      <br />
    </div>
  );
}
function SelectedOperation({ gamerInfo }) {
  const { operationId } = useParams();
  const [trackData, setTrack] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(null);
  useEffect(() => {
      const fetchOperationDetails = async () => {
          try {
            console.log("checking:" , operationId)
              const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
              const response = await axios.post(`${apiUrl}/operations/${operationId}`,gamerInfo || {});
              console.log("response: ", response.data)
              setSelectedSeason(response.data.selectedSeason); // Assuming the response has a selectedSeason field
              setTrack(response.data.track);
          } catch (error) {
              console.error("Error fetching operation details:", error);
          }
          setIsLoading(false);
      };

      fetchOperationDetails();
  }, [operationId]);

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

  function SeasonImage(base64ImageData){
    return `data:image/png;base64,${base64ImageData}`;
}
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
  // Navigate hook initialization
const navigate = useNavigate();

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
      if (reward.Type === "ArmorMythicFx" || reward.Type === "ArmorFx") {
        reward.Item.IsCrossCompatible = true

      }
      if (reward.CurrencyPath === "Currency/Currencies/xpboost.json") {
        imageSrc = xpboostImage
        rewardType = reward.Amount + "x Boost";
        reward.Item.Quality = "Common";
        name = "XP Boost";

      } else if (reward.CurrencyPath === "Currency/Currencies/cR.json") {
        imageSrc = currencyImage;
        rewardType = reward.Amount + " cR";
        reward.Item.Quality = "Common";

        name = "Credits";

      }else if (reward.CurrencyPath === "Currency/Currencies/rerollcurrency.json") {
        imageSrc = challengeSwap;
        rewardType = reward.Amount  + "x Swap";
        reward.Item.Quality = "Common";

        name = "Challenge Swap";
      } else {
        imageSrc = SeasonImage(reward.ItemImageData);
        rewardType = transformString(reward.Type);
        name = reward.Item.Title.value
        if (reward.Item.IsCrossCompatible){
          coreDesignation = "Cross Core"
        }else if(reward.Item.Core === "Unknown Core"){
          coreDesignation = "e"
        }else{
          coreDesignation = reward.Item.CoreTitle
        }
      }
      const handleItemClick = (reward, gamerInfo, selectedSeason, handleBackClick) => {
        // SeasonImage processing could happen here if needed before passing it along
        // For example, if you need to transform reward item data:
        if (reward.ItemImageData) {
          reward.imageSrc = SeasonImage(reward.ItemImageData);
        }
      
        // Navigate with all the state you want to pass
        navigate('/item-details', {
          state: {
            reward: reward,
            gamerInfo: gamerInfo,
            seasonData: selectedSeason,
          }
        });
      };
      const rarityClass = reward.Item?.Rarity; // e.g., "Common", "Rare", "Epic", "Legendary"
      const cardClassName = `objectCard-ops cardWithGradient ${rarityClass}`;
      console.log("reward: ", reward)
      return (
        <SvgBorderWrapper height={300} width={245} rarity={reward.Item?.Quality}>

        <div>
          <div onClick={() => handleItemClick(reward, gamerInfo, selectedSeason, handleBackClick)} key={index} className={cardClassName}>
            <p className='card-subheader-mini-ops'>{name} </p>
            <p className='card-subheader-mini-ops'>{rewardType}</p>
                    <img
                className="item-img"
                src={imageSrc}
                alt="Reward Logo"
                style={{ 
                  height: coreDesignation ? '225px' : '245px',
                  width: coreDesignation ? '225px' : '230px'
                  }}
              />
            <p className='card-subheader-mini-ops'>{coreDesignation}</p>
          </div>
        </div>
        </SvgBorderWrapper>
      );
    });
  };

  
  const handleBackClick = () => {
    navigate(-1); // Navigate back
  };
  if (isLoading || !selectedSeason) return <div>Loading...</div>;
  return (
    <div>
        <div className="title-container-singleoperations">
                <h1 className="operations-title-singleoperations"> {selectedSeason.SeasonMetadataDetails.Name.value}</h1>
        </div>

      <div className="operation-container-single">
        <div className="event-info-container">
          <DisplayEvent season={selectedSeason} />
          <div className="placeholder-card">
      </div>
        </div>
        <div className="scrollable-ranks">
        {trackData.Ranks && trackData.Ranks.map((rank, index) => {
          // Check if rank is completed
          const isCompleted = index < selectedSeason.UserSeasonProgression.CurrentProgress.Rank;
          return (
            <div key={index} className={`season-rank-container ${isCompleted ? "completed-rank" : ""}`}>
                <div className="rank-number">
                  {isCompleted && <img src={checkmark} className="completed-checkmark" alt="Completed" />}
                  {index + 1}
                </div>
              <div className="season-rank-row">
                {displayRewards(rank)}
              </div>
            </div>
          )
        })}
      </div>
      <button className="nav-button back" onClick={handleBackClick}>BACK</button>

    </div>
    <Routes>
              <Route path="operations/:operationid" element={<SelectedOperation gamerInfo={gamerInfo} seasonData={selectedSeason} handleBackClick={handleBackClick} />} />
    </Routes>
  </div>
  
  );
  
}

export default SelectedOperation;
