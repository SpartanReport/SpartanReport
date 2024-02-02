import useFetchSpartanInventory from "../Components/useFetchSpartanInventory";
import useFetchSpartanRank from "../Components/FetchSpartanRank";
import useFetchChallengeDeck from "../Components/FetchSpartanChallenges"
import { useState } from "react";
import "../Styles/CommandCenter.css"
import { useNavigate } from 'react-router-dom';
import GoogleAd from "../Components/GoogleAds";
function SpartanCard({ card , navigation}) {
  return (
    <div className="welcome-cards-spartan" onClick={() => navigation("/spartan")}>
      <div className="spartan-card-subheader-home">ARMORY</div>
      {card.imageSrc && <img src={card.imageSrc} alt="Spartan Armor" className="spartan-img" />}
      <div className="card-footer-spartan">{card.title} Core Equipped</div>
    </div>
  );
};

function ChallengeCard({ challenges }) {
  return (
    <div className="welcome-cards">
      <div className="spartan-card-subheader-home">CHALLENGES</div>
      <div>
        {challenges.map((challenge, index) => (
          <div key={index} className="challenge-row">
            <p className="challenge-title">{challenge.title} {challenge.OperationExperience}xp {challenge.Progress}/{challenge.Threshold}</p> 
            <p className="challenge-description">{challenge.Description}</p> 
            <div className="progressBar">
              <div 
                className="progressBarFill" 
                style={{ width: `${(challenge.Progress / challenge.Threshold) * 100}%` }}
              >
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function ProgressionCard({card,navigation,rankTitle,rankImageData,rankGrade}){
  return (
    <div className="welcome-cards-rank" onClick={() => navigation("/progression")}>
      <div className="spartan-card-subheader-home">PROGRESSION</div>
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
    if (card.type === "Challenge") {
      return <ChallengeCard className="challenge-card" challenges={card.challenges} />;
    }
  return null
}
function CommandCenter({ gamerInfo }) {
  const { spartanInventory, armoryRow,helmetRow, isLoading, fetchSpartanInventory } = useFetchSpartanInventory(gamerInfo);
  const [spartanRank, fetchSpartanRank] = useFetchSpartanRank(gamerInfo);
  const [challengeDeck, isLoadingChallenge, challengeError] = useFetchChallengeDeck(gamerInfo);
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
  ];

  if (coreDetails) {
    console.log(coreDetails)

    const commonDataKeys = ["spartanKey", "xuid", "xbltoken", "clearanceCode", "gamertag", "data"];
    commonDataKeys.forEach((key) => {
      if (coreDetails.CommonData[key]) {
        cardData.push({ title: coreDetails.CommonData[key].value, imageSrc });
      }
    });
  }
  let allChallenges = [];

  if (challengeDeck) {
    challengeDeck.AssignedDecks.forEach(challengeDeck => {
      challengeDeck.ActiveChallenges.forEach(activeChallenge => {
        // Add each active challenge to the allChallenges array
        console.log(activeChallenge)

        allChallenges.push({
          title: activeChallenge.ChallengeDetail.Title.value || 'Challenge', // Adjust based on your actual data structure
          OperationExperience: activeChallenge.ChallengeDetail.Reward.OperationExperience,
          Category: activeChallenge.ChallengeDetail.Category,
          Difficulty: activeChallenge.ChallengeDetail.Difficulty,
          Description: activeChallenge.ChallengeDetail.Description.value,
          Progress: activeChallenge.Progress,
          Threshold: activeChallenge.ChallengeDetail.ThresholdForSuccess
        });
      });
    });
  
    // Add the challenges to cardData as a single card
    cardData.push({
      type: "Challenge",
      challenges: allChallenges
    });
  }
  cardData.push({type: "Progression", title:"Test", imageSrc: imageSrc, gamerInfo: gamerInfo, rankTitle: rankTitle, rankGrade: rankGrade, rankImageData: rankImageData },
  )
    // Split the cardData into two arrays based on type
    const armoryCards = cardData.filter(card => card.type === 'Spartan');
    const progressionCards = cardData.filter(card => card.type === 'Progression');
  
    // Render Cards in a Column
    const renderCardsInColumn = (cards, navigation) => (
      <div className="card-column">
        {cards.map((card, index) => (
          <GetCard card={card} navigation={navigation} key={index} />
        ))}
      </div>
    );
  
  return (
      <div className="main-grid-container">
      <div className="title-container-home">
        <h1 className="spartan-title-home">COMMAND CENTER</h1>
      </div>
      <div className="subheader-container-home">
      <svg className="diamond-icon" id="Layer_2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22.92 22.92"><defs></defs><g id="Layer_3"><g><path class="cls-1" d="M11.46,0L0,11.46l11.46,11.46,11.46-11.46L11.46,0ZM3.41,11.46L11.46,3.41l8.05,8.05-8.05,8.05L3.41,11.46Z"/><rect class="cls-1" x="8.16" y="8.16" width="6.59" height="6.59" transform="translate(-4.75 11.46) rotate(-45)"/></g></g></svg>
        <h1 className="spartan-subheader-home">SPARTAN</h1>
      </div>
      <div className="cards-container">
        {renderCardsInColumn([...armoryCards, ...progressionCards], navigate)}
      </div>
      
        {cardData.map((card, index) => (
            card.type === "Spartan" || card.type === "Progression" ? null :
            <GetCard card={card} navigation={navigate} key={index} />
          ))}
                      <GoogleAd slot="7820477824" googleAdId="ca-pub-9090570730897630"/>
      </div>
  );
}

export default CommandCenter;
