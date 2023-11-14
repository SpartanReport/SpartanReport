import React, { useState, useEffect, useRef } from 'react';
import useFetchSpartanInventory from '../Components/useFetchSpartanInventory';
import ArmoryRow from "./ArmoryRow"
import "../Styles/styles.css";
import "../Styles/spartan.css";

const RenderArmoryRow = ({toggleVisibility,visId,isLast, rowType, isVisible, objects, fullObjects, gamerInfo, onEquipItem, currentlyEquipped, setHighlightedItems, highlightedItems, resetHighlight }) => {
  return (
    <>
      <div className="subheader-container-spartan" onClick={() => toggleVisibility(visId)}>
        <svg className="diamond-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22.92 22.92">
          <path className="cls-1" d="M11.46,0L0,11.46l11.46,11.46,11.46-11.46L11.46,0ZM3.41,11.46L11.46,3.41l8.05,8.05-8.05,8.05L3.41,11.46Z"/>
          <rect className="cls-1" x="8.16" y="8.16" width="6.59" height="6.59" transform="translate(-4.75 11.46) rotate(-45)"/>
        </svg>

        <h1 className="spartan-subheader-home">{rowType} {isVisible ? (<div className='dropdown-arrow-container'><svg className="arrow-icon-open" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <svg id="dropdown" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12.44 12.44"><g id="Layer_3"><g id="Login_Button"><polygon class="cls-1" points="12.44 0 12.44 12.44 0 12.44 12.44 0"/></g></g></svg>
        </svg></div>): (<div className='dropdown-arrow-container'><svg className="arrow-icon-collapsed" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <svg id="dropdown" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12.44 12.44"><g id="Layer_3"><g id="Profile"><polygon class="cls-1" points="12.44 12.44 12.44 0 0 0 12.44 12.44"/></g></g></svg>
              </svg></div>)}</h1>
      </div>
      {isVisible ? (
        <div className="armory-row">
          <ArmoryRow objects={objects} resetHighlight={resetHighlight} fullObjects={fullObjects} gamerInfo={gamerInfo} onEquipItem={onEquipItem} currentlyEquipped={currentlyEquipped} setHighlightedItems={setHighlightedItems} highlightedItems={highlightedItems} />
        </div>
      ) : <div style={{height:isLast ? 100:50}}></div>}
    </>
  );
};
const Spartan = ({ gamerInfo }) => {
  const [visibleRows, setVisibleRows] = useState({
    core: true,
    helmet: true,
    visors: true,
    gloves: true,
    coatings: true,
    shoulderleft: true,
    shoulderright: true,
    wristattachement: true,
    kneepad: true,
    hipattachement: true,
    chestattachement: true,
  });
  const [highlightedItems, setHighlightedItems] = useState({
    armorcoreId: null,
    armorhelmetId: null,
    armorvisorId: null,
    armorgloveId: null,
    armorcoatingId: null,
    armorleftshoulderpadId: null,
    armorrightshoulderpadId: null,
    armorwristattachmentId: null,
    armorkneepadId: null,
    armorhipattachmentId: null,
    armorchestattachmentId: null,


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
    // Update the highlightedItems state
    setHighlightedItems(prev => ({
      ...prev,
      [`${itemType.toLowerCase()}Id`]: newHighlightedId
    }));
  
    // Function to update ArmoryRow based on itemType
    const updateArmoryRow = (armoryType, armoryRowKey) => {
      const updatedArmoryRow = armoryRow[armoryRowKey].map(obj => ({
        ...obj,
        isHighlighted: obj.Type === itemType && obj.id === newHighlightedId
      }));
      setArmoryRow({ ...armoryRow, [armoryRowKey]: updatedArmoryRow });
    };
  
    // Mapping of item types to armory row keys
    const armoryRowKeys = {
      "ArmorCore": "ArmoryRow",
      "ArmorHelmet": "ArmoryRowHelmets",
      "ArmorVisor": "ArmoryRowVisors",
      "ArmorGlove": "ArmoryRowGloves",
      "ArmorCoating": "ArmoryRowCoatings",
      "ArmorLeftShoulderPad": "ArmoryRowLeftShoulderPads",
      "ArmorRightShoulderPad": "ArmoryRowRightShoulderPads",
      "ArmorWristAttachment": "ArmoryRowWristAttachments",
      "ArmorKneePad": "ArmoryRowKneePads",
      "ArmorHipAttachment": "ArmoryRowHipAttachments",
      "ArmorChestAttachment": "ArmoryRowChestAttachments",
    };
  
    // Update the appropriate armory row if the itemType matches
    if (armoryRowKeys[itemType]) {
      updateArmoryRow(itemType, armoryRowKeys[itemType]);
    }
  };
  
  
  
  const handleEquipItem = (item) => {
    console.log("handle Equip: ", item.Type);
  
    // Function to update the currently equipped item based on its type
    const updateCurrentlyEquipped = (itemType, item) => {
      setCurrentlyEquipped(prev => ({ ...prev, [itemType]: item }));
    };
  
    // If the item is an Armor Core, reset all other equipped items
    if (item.Type === "ArmorCore") {
      setCurrentlyEquipped({
        CurrentlyEquippedCore: item,
        CurrentlyEquippedHelmet: null,
        CurrentlyEquippedGlove: null,
        CurrentlyEquippedVisor: null,
        CurrentlyEquippedCoating: null,
        CurrentlyEquippedLeftShoulderPad: null,
        CurrentlyEquippedRightShoulderPad: null,
        CurrentlyEquippedWristAttachment: null,
        CurrentlyEquippedKneePad: null,
        CurrentlyEquippedHipAttachment: null,
        CurrentlyEquippedChestAttachment: null,
      });
      console.log("Armor Core equipped, other items reset.");
    } else {
      // For other item types, update the currently equipped item
      const currentlyEquippedKey = `CurrentlyEquipped${item.Type.replace('Armor', '')}`;
      updateCurrentlyEquipped(currentlyEquippedKey, item);
      console.log(`Setting ${item.Type}`);
    }
  };
  

  const toggleVisibility = (row) => {
    setVisibleRows(prev => ({ ...prev, [row]: !prev[row] }));
  };


  return (
    <div className="main-grid-container-spartan">
      <div className="title-container-home">
        <h1 className="spartan-title-home">ARMORY</h1>
      </div>

      <RenderArmoryRow 
        rowType="Armor Core" 
        visId = "core"
        isVisible={visibleRows.core} 
        objects={armoryRow.ArmoryRow} 
        fullObjects={armoryRow}
        gamerInfo={gamerInfo}
        onEquipItem={handleEquipItem}
        currentlyEquipped={currentlyEquipped}
        setHighlightedItems={setHighlightedItems}
        highlightedItems={highlightedItems}
        resetHighlight={resetHighlight}
        toggleVisibility={toggleVisibility}
      />


      <RenderArmoryRow 
        rowType="Coatings" 
        visId = "coatings"

        isVisible={visibleRows.coatings} 
        objects={armoryRow.ArmoryRowCoatings} 
        fullObjects={armoryRow}
        gamerInfo={gamerInfo}
        onEquipItem={handleEquipItem}
        currentlyEquipped={currentlyEquipped}
        setHighlightedItems={setHighlightedItems}
        highlightedItems={highlightedItems}
        resetHighlight={resetHighlight}
        toggleVisibility={toggleVisibility}
      />

      <RenderArmoryRow 
        rowType="Helmets"
        visId = "helmet"
 
        isVisible={visibleRows.helmet} 
        objects={armoryRow.ArmoryRowHelmets} 
        fullObjects={armoryRow}
        gamerInfo={gamerInfo}
        onEquipItem={handleEquipItem}
        currentlyEquipped={currentlyEquipped}
        setHighlightedItems={setHighlightedItems}
        highlightedItems={highlightedItems}
        resetHighlight={resetHighlight}
        toggleVisibility={toggleVisibility}
      />

      <RenderArmoryRow 
        rowType="Visors" 
        visId = "visors"

        isVisible={visibleRows.visors} 
        objects={armoryRow.ArmoryRowVisors} 
        fullObjects={armoryRow}
        gamerInfo={gamerInfo}
        onEquipItem={handleEquipItem}
        currentlyEquipped={currentlyEquipped}
        setHighlightedItems={setHighlightedItems}
        highlightedItems={highlightedItems}
        resetHighlight={resetHighlight}
        toggleVisibility={toggleVisibility}
      />
            <RenderArmoryRow 
        rowType="Chest Attachments"
        visId = "chestattachement"
        isVisible={visibleRows.chestattachement} 
        objects={armoryRow.ArmoryRowChestAttachments} 
        fullObjects={armoryRow}
        gamerInfo={gamerInfo}
        onEquipItem={handleEquipItem}
        currentlyEquipped={currentlyEquipped}
        setHighlightedItems={setHighlightedItems}
        highlightedItems={highlightedItems}
        resetHighlight={resetHighlight}
        toggleVisibility={toggleVisibility}
        />
          <RenderArmoryRow 
            rowType="Left Shoulder Pads" 
            visId = "shoulderleft"
            isVisible={visibleRows.shoulderleft} 
            objects={armoryRow.ArmoryRowLeftShoulderPads} 
            fullObjects={armoryRow}
            gamerInfo={gamerInfo}
            onEquipItem={handleEquipItem}
            currentlyEquipped={currentlyEquipped}
            setHighlightedItems={setHighlightedItems}
            highlightedItems={highlightedItems}
            resetHighlight={resetHighlight}
            toggleVisibility={toggleVisibility}
          />

        <RenderArmoryRow 
                    rowType="Right Shoulder Pads" 
                    visId = "shoulderright"
                    isVisible={visibleRows.shoulderright} 
                    objects={armoryRow.ArmoryRowRightShoulderPads} 
                    fullObjects={armoryRow}
                    gamerInfo={gamerInfo}
                    onEquipItem={handleEquipItem}
                    currentlyEquipped={currentlyEquipped}
                    setHighlightedItems={setHighlightedItems}
                    highlightedItems={highlightedItems}
                    resetHighlight={resetHighlight}
                    toggleVisibility={toggleVisibility}
                  />

      <RenderArmoryRow 
        rowType="Gloves" 
        visId = "gloves"
        isLast={true}

        isVisible={visibleRows.gloves} 
        objects={armoryRow.ArmoryRowGloves} 
        fullObjects={armoryRow}
        gamerInfo={gamerInfo}
        onEquipItem={handleEquipItem}
        currentlyEquipped={currentlyEquipped}
        setHighlightedItems={setHighlightedItems}
        highlightedItems={highlightedItems}
        resetHighlight={resetHighlight}
        toggleVisibility={toggleVisibility}
      />
      <RenderArmoryRow 
        rowType="Wrist Attachments" 
        visId = "wristattachement"
        isVisible={visibleRows.wristattachement} 
        objects={armoryRow.ArmoryRowWristAttachments} 
        fullObjects={armoryRow}
        gamerInfo={gamerInfo}
        onEquipItem={handleEquipItem}
        currentlyEquipped={currentlyEquipped}
        setHighlightedItems={setHighlightedItems}
        highlightedItems={highlightedItems}
        resetHighlight={resetHighlight}
        toggleVisibility={toggleVisibility}
        />
              <RenderArmoryRow 
        rowType="Hip Attachments"
        visId = "hipattachement"
        isVisible={visibleRows.hipattachement} 
        objects={armoryRow.ArmoryRowHipAttachments}
        fullObjects={armoryRow}
        gamerInfo={gamerInfo}
        onEquipItem={handleEquipItem}
        currentlyEquipped={currentlyEquipped}
        setHighlightedItems={setHighlightedItems}
        highlightedItems={highlightedItems}
        resetHighlight={resetHighlight}
        toggleVisibility={toggleVisibility}
        />

      <RenderArmoryRow 
        rowType="Knee Pads"
        visId = "kneepad"
        isVisible={visibleRows.kneepad} 
        objects={armoryRow.ArmoryRowKneePads}
        fullObjects={armoryRow}
        gamerInfo={gamerInfo}
        onEquipItem={handleEquipItem}
        currentlyEquipped={currentlyEquipped}
        setHighlightedItems={setHighlightedItems}
        highlightedItems={highlightedItems}
        resetHighlight={resetHighlight}
        toggleVisibility={toggleVisibility}
        />

  </div>

    
  );
};

export default Spartan;
