import React, { useState, useEffect, useRef } from 'react';
import useFetchSpartanInventory from '../useFetchSpartanInventory';
import ArmoryRow from "./ArmoryRow"
import "../Styles/styles.css";
import "../Styles/spartan.css";


const Spartan = ({ gamerInfo }) => {
  const [highlightedCoreId, setHighlightedCoreId] = useState(null);
  const [highlightedHelmetId, setHighlightedHelmetId] = useState(null);

  const { spartanInventory, armoryRow,setArmoryRow, isLoading, fetchSpartanInventory, currentlyEquipped, setCurrentlyEquipped} = useFetchSpartanInventory(gamerInfo, true,setHighlightedCoreId,setHighlightedHelmetId,highlightedCoreId, highlightedHelmetId);
  // Refs for both scrollable rows
  const topRowRef = useRef(null);
  const bottomRowRef = useRef(null);

  useEffect(() => {
    fetchSpartanInventory();

  }, []);


  // Scroll synchronization handlers
  const syncScrollTop = () => {
    if (bottomRowRef.current) {
      bottomRowRef.current.scrollLeft = topRowRef.current.scrollLeft;
    }
  };

  const syncScrollBottom = () => {
    if (topRowRef.current) {
      topRowRef.current.scrollLeft = bottomRowRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    // Add event listeners
    const topRow = topRowRef.current;
    const bottomRow = bottomRowRef.current;

    if (topRow && bottomRow) {
      topRow.addEventListener('scroll', syncScrollTop);
      bottomRow.addEventListener('scroll', syncScrollBottom);
    }

    // Remove event listeners on cleanup
    return () => {
      if (topRow) {
        topRow.removeEventListener('scroll', syncScrollTop);
      }
      if (bottomRow) {
        bottomRow.removeEventListener('scroll', syncScrollBottom);
      }
    };
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!spartanInventory) {
    return <div>No Spartan Inventory Data</div>;
  }
  const resetHighlight = (newHighlightedId, itemType) => {
    console.log("RESSSETING ", newHighlightedId,itemType)
    if (itemType === "ArmorCore") {
      const updatedArmoryRow = armoryRow.ArmoryRow.map(obj => ({
        ...obj,
        isHighlighted: obj.Type === itemType && obj.id === newHighlightedId
      }));
      setArmoryRow({ ...armoryRow, ArmoryRow: updatedArmoryRow });
    } else if (itemType === "ArmorHelmet") {
      const updatedArmoryRowHelmets = armoryRow.ArmoryRowHelmets.map(obj => ({
        ...obj,
        isHighlighted: obj.Type === itemType && obj.id === newHighlightedId
      }));
      setArmoryRow({ ...armoryRow, ArmoryRowHelmets: updatedArmoryRowHelmets });
    }
  };
  
  
  const handleEquipItem = (item) => {
    console.log(item.Type)
    if (item.Type === "ArmorCore") {
      setCurrentlyEquipped(prev => ({ ...prev, CurrentlyEquippedCore: item }));
    } else if (item.Type === "ArmorHelmet") {
      setCurrentlyEquipped(prev => ({ ...prev, CurrentlyEquippedHelmet: item }));
    }
    console.log("Set New Items! ")
  };
  const coreDetails = spartanInventory.CoreDetails;
  const base64ImageData = coreDetails.CommonData.ImageData;
  const imageSrc = `data:image/png;base64,${base64ImageData}`;
  console.log("Armory Row: ", armoryRow)

  const renderPlaceholderCards = () => {
    const placeholders = [];
    for (let i = 0; i < 12; i++) {
      placeholders.push(
        <div className="spartan-card-mini" key={`placeholder-${i}`}>
          <div className="spartan-card-subheader-home-mini">
            {coreDetails.CommonData.Title.value}
          </div>
          <img src={imageSrc} alt="Spartan Core" className="spartan-image-mini" />
        </div>
      );
    }
    return placeholders;
  };

  return (
    <div className="main-grid-container-spartan">
      <div className="title-container-home">
        <h1 className="spartan-title-home">ARMORY</h1>
      </div>
      <div className="subheader-container-home">
        <svg className="diamond-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22.92 22.92">
          <path className="cls-1" d="M11.46,0L0,11.46l11.46,11.46,11.46-11.46L11.46,0ZM3.41,11.46L11.46,3.41l8.05,8.05-8.05,8.05L3.41,11.46Z"/>
          <rect className="cls-1" x="8.16" y="8.16" width="6.59" height="6.59" transform="translate(-4.75 11.46) rotate(-45)"/>
        </svg>
        <h1 className="spartan-subheader-home">Current Armor Core</h1>
      </div>
      <div className="armory-row">
        <ArmoryRow objects={armoryRow.ArmoryRow}  resetHighlight={resetHighlight} fullObjects={armoryRow} gamerInfo={gamerInfo} onEquipItem={handleEquipItem}   currentlyEquipped={currentlyEquipped} setHighlightedCoreId={setHighlightedCoreId} setHighlightedHelmetId={setHighlightedHelmetId} highlightedId={highlightedCoreId}   />
      </div>
      <div className="subheader-container-home">
        <svg className="diamond-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22.92 22.92">
          <path className="cls-1" d="M11.46,0L0,11.46l11.46,11.46,11.46-11.46L11.46,0ZM3.41,11.46L11.46,3.41l8.05,8.05-8.05,8.05L3.41,11.46Z"/>
          <rect className="cls-1" x="8.16" y="8.16" width="6.59" height="6.59" transform="translate(-4.75 11.46) rotate(-45)"/>
        </svg>
        <h1 className="spartan-subheader-home">Helmet</h1>
      </div>
      <div className="armory-row">
        <ArmoryRow objects={armoryRow.ArmoryRowHelmets} resetHighlight={resetHighlight}   fullObjects={armoryRow} gamerInfo={gamerInfo} onEquipItem={handleEquipItem}   currentlyEquipped={currentlyEquipped} setHighlightedHelmetId={setHighlightedHelmetId} highlightedId={highlightedHelmetId} />
      </div>
    </div>
  );
};

export default Spartan;
