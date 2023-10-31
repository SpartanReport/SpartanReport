import useFetchSpartanInventory from "../useFetchSpartanInventory";
import { useEffect } from "react";
import "../Styles/styles.css"
import "../Styles/Home.css"
import { useNavigate } from 'react-router-dom';

function SpartanCard({ card ,navigateToSpartan}) {
  return (
    <div className="welcome-cards" onClick={() => navigateToSpartan("/spartan")}>
      <div className="card-header-spartan">Armory</div>
      {card.imageSrc && <img src={card.imageSrc} alt="Spartan Armor" className="spartan-img" />}
      <div className="card-footer-spartan">{card.title} Core Equipped</div>
    </div>
  );
};
function Home({ gamerInfo }) {
  const [spartanInventory, isLoading, fetchSpartanInventory] = useFetchSpartanInventory(gamerInfo);
  const navigate = useNavigate();


  useEffect(() => {
    if (gamerInfo) {
      fetchSpartanInventory();
    }
  }, [gamerInfo, fetchSpartanInventory]);

  if (!gamerInfo) return null;

  let imageSrc = null;
  let coreDetails = null;

  if (spartanInventory && spartanInventory.CoreDetails && spartanInventory.CoreDetails.CommonData) {
    coreDetails = spartanInventory.CoreDetails;
    const base64ImageData = coreDetails.CommonData.ImageData;
    imageSrc = `data:image/png;base64,${base64ImageData}`;
  }

  const cardData = [
    { title: coreDetails ? coreDetails.CommonData.Title.value : 'N/A', imageSrc: imageSrc },
  ];
  const navigateToSpartan = (path) => {
    navigate(path);
  };
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
          <SpartanCard navigateToSpartan={navigate} card={card} />
        ))}
      </div>
    </div>
  );
}

export default Home;
