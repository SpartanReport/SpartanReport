import React, { useState, useEffect } from 'react';
import './ArmoryRow.css'; // Make sure to import your CSS file here

const ObjectCard = ({ object, isHighlighted, onClick }) => {
  const cardClassName = isHighlighted ? 'highlightedObjectCardRow' : 'objectCard';
  const base64ImageData = object.Image;
  let imageSrc;

  if (object.Type !== "ArmorCore"){
    imageSrc = `data:image/jpeg;base64,${base64ImageData}`;
  }else{
    imageSrc = `data:image/png;base64,${base64ImageData}`;

  }

  return (
    <div className={cardClassName} onClick={() => onClick(object)}>
      <p className='card-subheader'>{object.name}</p>
      <img src={imageSrc} alt="Spartan Core" className="ImageCard"/>

    </div>
  );
};

const HighlightedObjectCard = ({ object }) => {
  const base64ImageData = object.Image;
  let imageSrc;

  if (object.Type !== "ArmorCore"){
    imageSrc = `data:image/jpeg;base64,${base64ImageData}`;

  }else{
    imageSrc = `data:image/png;base64,${base64ImageData}`;

  }
  return (
    <div className="highlightedObjectCard">
      <p className='card-subheader'>Equipped | {object.name}</p>
      <img src={imageSrc} alt="Spartan Core" className="HighlightedImageCard" />

    </div>
  );
};

const ObjectsDisplay = ({ objects, highlightedId, onObjectClick }) => {
  // Calculate the number of columns needed for two rows, making sure we round up.
  const columns = Math.ceil(objects.length / 2);
  return (
    <div className="objectsDisplay" style={{
      gridTemplateColumns: `repeat(${columns}, 150px)`,
    }}>
      {objects.map((object) => (
        <ObjectCard
          key={object.id}
          object={object}
          isHighlighted={object.id === highlightedId}
          onClick={onObjectClick}
        />
      ))}
    </div>
  );
};

const ArmoryRow = ({ objects, fullObjects, resetHighlight, gamerInfo, onEquipItem, currentlyEquipped, highlightedId, setHighlightedCoreId,setHighlightedHelmetId }) => {


  const sendEquip = async (gamerInfo, currentlyEquipped) => {
    const payload = {
      GamerInfo: gamerInfo,
      CurrentlyEquipped: currentlyEquipped
    };

    console.log("Sending ", payload)
    try {
      const response = await fetch('http://localhost:8080/armorcore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      return data
    } catch (error) {
      console.error('There was an error!', error);
    }
  };
  const handleObjectClick = async (object) => {
    if (object.id !== highlightedId) {
        object.isHighlighted = true;
        onEquipItem(object); // Call the handler when an item is clicked

        let dataToSend = { ...currentlyEquipped };
        if (object.Type === "ArmorHelmet") {
          dataToSend.CurrentlyEquippedCore.GetInv = false;

            dataToSend.CurrentlyEquippedHelmet = object;
            await sendEquip(gamerInfo, dataToSend);
              resetHighlight(object.id, object.Type);
              setHighlightedHelmetId(object.id); // Update highlighted helmet ID
          } else if (object.Type === "ArmorCore") {
            console.log("Fetching Core Inventory!!!!!")
            dataToSend.CurrentlyEquippedCore = object;
            dataToSend.CurrentlyEquippedCore.GetInv = true;
            setHighlightedCoreId(object.id); // Update highlighted core ID

            // Backend request
            const response = await sendEquip(gamerInfo, dataToSend);
            console.log("Received!!! ", response)

            if (response && response.Themes[0].HelmetPath) {
              // Find the new highlighted helmet
              const newHighlightedHelmet = fullObjects.ArmoryRowHelmets.find(helmet => helmet.CorePath === response.Themes[0].HelmetPath);
              if (newHighlightedHelmet) {
                setHighlightedHelmetId(newHighlightedHelmet.id); // Update highlighted helmet ID
                resetHighlight(newHighlightedHelmet.id, "ArmorHelmet");
              }
            }
        }
    }
};


  const highlightedObject = objects.find(obj => obj.id === highlightedId);

  
  return (
    <div className="container">
      <div className="highlightedCardContainer">
        {highlightedObject && <HighlightedObjectCard object={highlightedObject} />}
      </div>
      <div className="cardContainer">
        <ObjectsDisplay objects={objects} highlightedId={highlightedId} onObjectClick={handleObjectClick} />
      </div>
    </div>
  );
};

export default ArmoryRow;
