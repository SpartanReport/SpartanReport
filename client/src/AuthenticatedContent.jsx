import useFetchSpartanInventory from "./useFetchSpartanInventory";
import { useEffect } from "react";
import "./styles.css"
function AuthenticatedContent({ gamerInfo }) {
  const [spartanInventory, isLoading, fetchSpartanInventory] = useFetchSpartanInventory(gamerInfo);

  useEffect(() => {
    if (gamerInfo) {
      fetchSpartanInventory();
    }
  }, [gamerInfo, fetchSpartanInventory]);

  console.log("gamerInfo: ", gamerInfo);
  if (!gamerInfo) return null;

  let imageSrc = null;
  let coreDetails = null;
  
  if (spartanInventory && spartanInventory.CoreDetails && spartanInventory.CoreDetails.CommonData) {
    coreDetails = spartanInventory.CoreDetails;
    const base64ImageData = coreDetails.CommonData.ImageData;
    imageSrc = `data:image/png;base64,${base64ImageData}`;
  }

  const cardData = [
    { title: 'Authenticated', spartanKey: "too long to show.. but acquired!", xuid: gamerInfo.xuid, xbltoken: gamerInfo.xbltoken ,clearanceCode: gamerInfo.ClearanceCode, gamertag: gamerInfo.gamertag },
    { title: coreDetails ? coreDetails.CommonData.Title.value : 'N/A', imageSrc: imageSrc },
        // ... other cards
  ];

  return (
    <div className="relative-container">
      <div className="main-grid-container">
      {cardData.map((card, index) => (
        <div key={index} className="main-cards">
          <div className="card-title">{card.title}</div>
          {card.spartanKey && <p>Spartan Key: {card.spartanKey}</p>}
          {card.xuid && <p>XUID: {card.xuid}</p>}
          {card.xbltoken && <p>XBLToken: {card.xbltoken}</p>}

          {card.clearanceCode && <p>FlightID: {card.clearanceCode}</p>}
          {card.gamertag && <p>Gamertag: {card.gamertag}</p>}
          {card.data && <p>Data: {card.data}</p>}
          {card.imageSrc && <img src={card.imageSrc} alt="Spartan Armor" class="main-card-spartan"/>}
        </div>
      ))}
      </div>
    </div>     
      );

}
export default AuthenticatedContent;
