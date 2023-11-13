import React, { useState, useEffect, useRef } from 'react';
import useFetchSpartanInventory from '../useFetchSpartanInventory';
import ArmoryRow from "./ArmoryRow"
import "../Styles/styles.css";
import "../Styles/spartan.css";


const Spartan = ({ gamerInfo }) => {
  const [visibleRows, setVisibleRows] = useState({
    core: true,
    helmet: true,
    visors: true,
    gloves: true,
    coatings: true,
  });
  const [highlightedItems, setHighlightedItems] = useState({
    armorcoreId: null,
    armorhelmetId: null,
    armorvisorId: null,
    armorgloveId: null,
    armorcoatingId: null,

  });
  const { spartanInventory, armoryRow,setArmoryRow, isLoading, fetchSpartanInventory, currentlyEquipped, setCurrentlyEquipped} = useFetchSpartanInventory(gamerInfo, true,setHighlightedItems);
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
    setHighlightedItems(prev => ({
      ...prev,
      [`${itemType.toLowerCase()}Id`]: newHighlightedId // Dynamically set the property based on itemType
    }));
    if (itemType === "ArmorCore") {
      const updatedArmoryRow = armoryRow.ArmoryRow.map(obj => ({
        ...obj,
        isHighlighted: obj.Type === itemType && obj.id === newHighlightedId
      }));
      setArmoryRow({ ...armoryRow, ArmoryRow: updatedArmoryRow });
    }
    if (itemType === "ArmorHelmet") {
      const updatedArmoryRowHelmets = armoryRow.ArmoryRowHelmets.map(obj => ({
        ...obj,
        isHighlighted: obj.Type === itemType && obj.id === newHighlightedId
      }));
      setArmoryRow({ ...armoryRow, ArmoryRowHelmets: updatedArmoryRowHelmets });
    } 
    if (itemType === "ArmorVisor") {
      const updatedArmoryRowVisors = armoryRow.ArmoryRowVisors.map(obj => ({
        ...obj,
        isHighlighted: obj.Type === itemType && obj.id === newHighlightedId
      }));
      setArmoryRow({ ...armoryRow, ArmoryRowVisors: updatedArmoryRowVisors });
    }
    if (itemType === "ArmorGlove") {
      const updatedArmoryRowGloves = armoryRow.ArmoryRowGloves.map(obj => ({
        ...obj,
        isHighlighted: obj.Type === itemType && obj.id === newHighlightedId
      }));
      setArmoryRow({ ...armoryRow, ArmoryRowGloves: updatedArmoryRowGloves });
    }
    if (itemType === "ArmorCoating") {
      const updatedArmoryRowCoating = armoryRow.ArmoryRowCoatings.map(obj => ({
        ...obj,
        isHighlighted: obj.Type === itemType && obj.id === newHighlightedId
      }));
      setArmoryRow({ ...armoryRow, ArmoryRowCoatings: updatedArmoryRowCoating });
    }
  };
  
  
  const handleEquipItem = (item) => {
    console.log("handle Equip: ", item.Type)
    if (item.Type === "ArmorCore") {
      setCurrentlyEquipped(prev => ({ ...prev, CurrentlyEquippedCore: item }));
    } else if (item.Type === "ArmorHelmet") {
      console.log("Setting Armor Helmet")
      setCurrentlyEquipped(prev => ({ ...prev, CurrentlyEquippedHelmet: item }));
    }else if (item.Type === "ArmorVisor") {
      console.log("Setting Armor Visor")
      setCurrentlyEquipped(prev => ({ ...prev, CurrentlyEquippedVisor: item }));
    }else if (item.Type === "ArmorGlove") {
      console.log("Setting Glove")
      setCurrentlyEquipped(prev => ({ ...prev, CurrentlyEquippedGlove: item }));
    }else if (item.Type === "ArmorCoating") {
      setCurrentlyEquipped(prev => ({ ...prev, CurrentlyEquippedCoating: item }));
    }
    console.log("Set New Items! ")
  };
  console.log("Armory Row: ", armoryRow)

  const toggleVisibility = (row) => {
    setVisibleRows(prev => ({ ...prev, [row]: !prev[row] }));
  };


  return (
    <div className="main-grid-container-spartan">
      <div className="title-container-home">
        <h1 className="spartan-title-home">ARMORY</h1>
      </div>

      <div className="subheader-container-spartan" onClick={() => toggleVisibility('core')}>
          <svg className="diamond-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22.92 22.92">
          <path className="cls-1" d="M11.46,0L0,11.46l11.46,11.46,11.46-11.46L11.46,0ZM3.41,11.46L11.46,3.41l8.05,8.05-8.05,8.05L3.41,11.46Z"/>
          <rect className="cls-1" x="8.16" y="8.16" width="6.59" height="6.59" transform="translate(-4.75 11.46) rotate(-45)"/>
        </svg>
        <h1 className="spartan-subheader-home">Armor Core {visibleRows.core ? 
        (<svg className="arrow-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          {/* SVG path for down arrow */}
          <path d="M7.41 8.29L12 12.88 16.59 8.29 18 9.71l-6 6-6-6z"/>
        </svg>) : 
        (<svg className="arrow-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          {/* SVG path for right arrow (">") */}
          <path d="M8.29 7.41L12.88 12 8.29 16.59 9.71 18l6-6-6-6z"/>
        </svg>)
      }</h1>

      </div>
      {visibleRows.core? (
      <div className="armory-row">
        <ArmoryRow objects={armoryRow.ArmoryRow} setCurrentlyEquipped={setCurrentlyEquipped} resetHighlight={resetHighlight} fullObjects={armoryRow} gamerInfo={gamerInfo} onEquipItem={handleEquipItem}   currentlyEquipped={currentlyEquipped} highlightedItems={highlightedItems} setHighlightedItems={setHighlightedItems}  />
      </div>
      )  : <div style={{height:50}}></div>}

      <div className="subheader-container-spartan" onClick={() => toggleVisibility('coatings')}>
                      <svg className="diamond-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22.92 22.92">
                      <path className="cls-1" d="M11.46,0L0,11.46l11.46,11.46,11.46-11.46L11.46,0ZM3.41,11.46L11.46,3.41l8.05,8.05-8.05,8.05L3.41,11.46Z"/>
                      <rect className="cls-1" x="8.16" y="8.16" width="6.59" height="6.59" transform="translate(-4.75 11.46) rotate(-45)"/>
                    </svg>
                    <h1 className="spartan-subheader-home">Coatings {visibleRows.coatings ? 
                    (<svg className="arrow-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path d="M7.41 8.29L12 12.88 16.59 8.29 18 9.71l-6 6-6-6z"/>
                    </svg>) : 
                    (<svg className="arrow-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path d="M8.29 7.41L12.88 12 8.29 16.59 9.71 18l6-6-6-6z"/>
                    </svg>)
                  }</h1>

                  </div>
                  {visibleRows.coatings? (
                  <div className="armory-row">
                    <ArmoryRow objects={armoryRow.ArmoryRowCoatings} resetHighlight={resetHighlight} fullObjects={armoryRow} gamerInfo={gamerInfo} onEquipItem={handleEquipItem}   currentlyEquipped={currentlyEquipped} setHighlightedItems={setHighlightedItems} highlightedItems={highlightedItems} />
                  </div>
                  )  : <div style={{height:50}}></div>}


      <div className="subheader-container-spartan" onClick={() => toggleVisibility('helmet')}>
          <svg className="diamond-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22.92 22.92">
          <path className="cls-1" d="M11.46,0L0,11.46l11.46,11.46,11.46-11.46L11.46,0ZM3.41,11.46L11.46,3.41l8.05,8.05-8.05,8.05L3.41,11.46Z"/>
          <rect className="cls-1" x="8.16" y="8.16" width="6.59" height="6.59" transform="translate(-4.75 11.46) rotate(-45)"/>
        </svg>
        <h1 className="spartan-subheader-home">Helmets {visibleRows.helmet ? 
        (<svg className="arrow-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M7.41 8.29L12 12.88 16.59 8.29 18 9.71l-6 6-6-6z"/>
        </svg>) : 
        (<svg className="arrow-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M8.29 7.41L12.88 12 8.29 16.59 9.71 18l6-6-6-6z"/>
        </svg>)
      }</h1>

      </div>
      {visibleRows.helmet? (
      <div className="armory-row">
        <ArmoryRow objects={armoryRow.ArmoryRowHelmets} resetHighlight={resetHighlight} fullObjects={armoryRow} gamerInfo={gamerInfo} onEquipItem={handleEquipItem}   currentlyEquipped={currentlyEquipped} setHighlightedItems={setHighlightedItems} highlightedItems={highlightedItems} />
      </div>
      )  : <div style={{height:50}}></div>}
    
    <div className="subheader-container-spartan" onClick={() => toggleVisibility('visors')}>
          <svg className="diamond-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22.92 22.92">
          <path className="cls-1" d="M11.46,0L0,11.46l11.46,11.46,11.46-11.46L11.46,0ZM3.41,11.46L11.46,3.41l8.05,8.05-8.05,8.05L3.41,11.46Z"/>
          <rect className="cls-1" x="8.16" y="8.16" width="6.59" height="6.59" transform="translate(-4.75 11.46) rotate(-45)"/>
        </svg>
        <h1 className="spartan-subheader-home">Visors {visibleRows.visors ? 
        (<svg className="arrow-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M7.41 8.29L12 12.88 16.59 8.29 18 9.71l-6 6-6-6z"/>
        </svg>) : 
        (<svg className="arrow-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M8.29 7.41L12.88 12 8.29 16.59 9.71 18l6-6-6-6z"/>
        </svg>)
      }</h1>

      </div>
      {visibleRows.visors? (
      <div className="armory-row">
        <ArmoryRow objects={armoryRow.ArmoryRowVisors} resetHighlight={resetHighlight}   fullObjects={armoryRow} gamerInfo={gamerInfo} onEquipItem={handleEquipItem}   currentlyEquipped={currentlyEquipped} setHighlightedItems={setHighlightedItems} highlightedItems={highlightedItems} />
      </div>
      )  : <div style={{height:50}}></div>}
    
    <div className="subheader-container-spartan" onClick={() => toggleVisibility('gloves')}>
          <svg className="diamond-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22.92 22.92">
          <path className="cls-1" d="M11.46,0L0,11.46l11.46,11.46,11.46-11.46L11.46,0ZM3.41,11.46L11.46,3.41l8.05,8.05-8.05,8.05L3.41,11.46Z"/>
          <rect className="cls-1" x="8.16" y="8.16" width="6.59" height="6.59" transform="translate(-4.75 11.46) rotate(-45)"/>
        </svg>
        <h1 className="spartan-subheader-home">Gloves {visibleRows.gloves ? 
        (<svg className="arrow-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M7.41 8.29L12 12.88 16.59 8.29 18 9.71l-6 6-6-6z"/>
        </svg>) : 
        (<svg className="arrow-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M8.29 7.41L12.88 12 8.29 16.59 9.71 18l6-6-6-6z"/>
        </svg>)
      }</h1>

      </div>
      {visibleRows.gloves? (
      <div className="armory-row">
        <ArmoryRow objects={armoryRow.ArmoryRowGloves} resetHighlight={resetHighlight} fullObjects={armoryRow} gamerInfo={gamerInfo} onEquipItem={handleEquipItem}   currentlyEquipped={currentlyEquipped} setHighlightedItems={setHighlightedItems} highlightedItems={highlightedItems} />
      </div>
      )  : <div style={{height:100}}></div>}


    </div>

    
  );
};

export default Spartan;
