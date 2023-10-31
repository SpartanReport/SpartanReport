import useFetchSpartanInventory from "../useFetchSpartanInventory";
import useFetchSpartanRank from "../FetchSpartanRank";
import { useEffect, useState } from "react";
import "../Styles/Home.css"
import { useNavigate } from 'react-router-dom';

function SpartanCard({ card , navigation}) {
  return (
    <div className="welcome-cards" onClick={() => navigation("/spartan")}>
      <div className="card-header-spartan">Armory</div>
      {card.imageSrc && <img src={card.imageSrc} alt="Spartan Armor" className="spartan-img" />}
      <div className="card-footer-spartan">{card.title} Core Equipped</div>
    </div>
  );
};


function ProgressionCard({card,navigation,rankTitle,rankImageData,rankGrade}){
  return (
    <div className="welcome-cards progression-card-size" onClick={() => navigation("/progression")}>
      <div className="card-header-spartan">Rank</div>
      <img
          className={'rank-img'}
          src={`data:image/jpeg;base64,${rankImageData}`}
          alt={`Rank Icon - ${rankTitle} Grade ${rankGrade}`}
      />
      <div className="card-footer-rank">{rankTitle} Grade {rankGrade}</div>
    </div>
  );
}


function GetCard({card,navigation}){
  if (card.type === "Spartan"){
    return <SpartanCard card={card} navigation={navigation} />;
  }
  if (card.type === "Progression"){
    return <ProgressionCard 
      card={card} 
      navigation={navigation} 
      rankTitle = {card.rankTitle}
      rankImageData = {card.rankImageData}
      rankGrade = {card.rankGrade}
      />;
    }
  return null
}
function Home({ gamerInfo }) {
  const [spartanInventory, isLoading, fetchSpartanInventory] = useFetchSpartanInventory(gamerInfo);
  const [spartanRank, fetchSpartanRank] = useFetchSpartanRank(gamerInfo);

  const navigate = useNavigate();
  // Add a state variable to track if the fetchSpartanRank was already called.
  const [isRankFetched, setIsRankFetched] = useState(false);

    if (gamerInfo&& !isRankFetched) {
      fetchSpartanInventory();
      fetchSpartanRank();
      setIsRankFetched(true); // Set it to true so it won't fetch again.
    }

  if (!gamerInfo) return null;

  let imageSrc = null;
  let coreDetails = null;

  if (spartanInventory && spartanInventory.CoreDetails && spartanInventory.CoreDetails.CommonData) {
    coreDetails = spartanInventory.CoreDetails;
    const base64ImageData = coreDetails.CommonData.ImageData;
    imageSrc = `data:image/png;base64,${base64ImageData}`;
  }
  let rankImages = null;
  let CareerLadder = null;
  let CareerTrack = null;
  let rankTitle = null;
  let rankGrade = null;
  let rankImageData = null;

  const getRankImageData = (rankIndex) => {
    const rankImage = rankImages?.[rankIndex]?.Image;
    console.log("Rank Image: ", rankImage);
    return rankImage;
  };

  if (spartanRank){
    CareerLadder = spartanRank.CareerLadder;
    CareerTrack = spartanRank.CareerTrack;
    rankImages = spartanRank.RankImages;
  
    rankImageData = getRankImageData(CareerTrack?.CurrentProgress?.Rank)
    rankTitle = CareerLadder.Ranks[CareerTrack?.CurrentProgress?.Rank].RankTitle.value;
    rankGrade = CareerLadder.Ranks[CareerTrack?.CurrentProgress?.Rank].RankGrade;


  }
  const cardData = [
    {type: "Spartan", title: coreDetails ? coreDetails.CommonData.Title.value : 'N/A', imageSrc: imageSrc },
    {type: "Progression", title:"Test", imageSrc: imageSrc, gamerInfo: gamerInfo, rankTitle: rankTitle, rankGrade: rankGrade, rankImageData: rankImageData },

  ];

  if (coreDetails) {
    const commonDataKeys = ["spartanKey", "xuid", "xbltoken", "clearanceCode", "gamertag", "data"];
    commonDataKeys.forEach((key) => {
      if (coreDetails.CommonData[key]) {
        cardData.push({ title: coreDetails.CommonData[key].value, imageSrc });
      }
    });
  }

  function getCurrentWeekday() {
    const date = new Date();
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return weekdays[date.getDay()];
  }

  return (
    <div className="relative-container">
      <h1 className="welcome-title">Happy {getCurrentWeekday()}, Spartan {gamerInfo.gamertag}</h1>
      <div className="main-grid-container">
        {cardData.map((card, index) => (
          <GetCard card={card} navigation={navigate} key={index} />          
        ))}
      </div>
    </div>
  );
}

export default Home;
