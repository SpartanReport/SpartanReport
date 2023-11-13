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
  if (imageSrc == "undefined"){
    return
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

const ObjectsDisplay = ({ currentlyEquipped, objects, highlightedId, onObjectClick }) => {


  // Filter the objects based on the given conditions
  const filteredArmoryRow = objects.filter(object =>
    object.IsCrossCore ||object.Image === "undefined" || object.BelongsToCore === currentlyEquipped.CurrentlyEquippedCore.CoreId || object.Type === "ArmorCore"
  );

    console.log(objects)
  // Calculate the number of columns needed for two rows, making sure we round up.
  // Use the length of the filtered array instead of the original objects array
  const columns = Math.ceil(filteredArmoryRow.length / 2);

  // Get Objects type from the first object in the filtered array, if it exists
  const objType = filteredArmoryRow.length > 0 ? filteredArmoryRow[0].Type : '';


  return (
    <div className="objectsDisplay" style={{ gridTemplateColumns: `repeat(${columns}, 150px)` }}>
      {filteredArmoryRow.map((object) => (
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
const ArmoryRow = ({ objects, fullObjects, resetHighlight, gamerInfo, onEquipItem, currentlyEquipped, highlightedItems, setHighlightedItems }) => {

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
    console.log(object.Type.toLowerCase())
    if (object.id !== highlightedItems[`${object.Type.toLowerCase()}Id`]) {
        object.isHighlighted = true;
        onEquipItem(object); // Call the handler when an item is clicked

        let dataToSend = { ...currentlyEquipped };
        if (object.Type === "ArmorHelmet") {
          dataToSend.CurrentlyEquippedCore.GetInv = false;
            dataToSend.CurrentlyEquippedHelmet = object;
            await sendEquip(gamerInfo, dataToSend);
              resetHighlight(object.id, object.Type);
              setHighlightedItems(items => ({ ...items, armorhelmetId: object.id }));
            } else if (object.Type === "ArmorCore") {
              console.log("Fetching Core Inventory!!!!!")
              dataToSend.CurrentlyEquippedCore = object;
              dataToSend.CurrentlyEquippedCore.GetInv = true;
              
              setHighlightedItems(items => ({ ...items, armorcoreId: object.id }));
              // Backend request
              const response = await sendEquip(gamerInfo, dataToSend);
              console.log("Received!!! ", response)

              if (response && response.Themes[0].HelmetPath) {
                // Find the new highlighted helmet

                const newHighlightedHelmet = fullObjects.ArmoryRowHelmets.find(helmet => helmet.CorePath === response.Themes[0].HelmetPath);
                const newHighlightedVisor = fullObjects.ArmoryRowVisors.find(visor => visor.CorePath === response.Themes[0].VisorPath);
                const newHighlightedGlove = fullObjects.ArmoryRowGloves.find(glove => glove.CorePath === response.Themes[0].GlovePath);
                const newHighlightedCoating = fullObjects.ArmoryRowCoatings.find(coating => coating.CorePath === response.Themes[0].CoatingPath);

                if (newHighlightedHelmet) {
                  setHighlightedItems(items => ({ ...items, armorhelmetId: object.id }));
                  resetHighlight(newHighlightedHelmet.id, "ArmorHelmet");
                  onEquipItem(newHighlightedHelmet); // Call the handler when an item is clicked

                }
                if (newHighlightedVisor) {
                  console.log("New Visor received : ",object.id )
                  setHighlightedItems(items => ({ ...items, armorvisorId: object.id }));
                  resetHighlight(newHighlightedVisor.id, "ArmorVisor");
                  onEquipItem(newHighlightedVisor);

                }
                if (newHighlightedGlove) {
                  setHighlightedItems(items => ({ ...items, armorgloveId: object.id }));
                  resetHighlight(newHighlightedGlove.id, "ArmorGlove");
                  onEquipItem(newHighlightedGlove);
                }
                if (newHighlightedCoating) {
                  setHighlightedItems(items => ({ ...items, armorcoatingId: object.id }));
                  resetHighlight(newHighlightedCoating.id, "ArmorCoating");
                  onEquipItem(newHighlightedCoating);

                }
              }
            
            }else if (object.Type === "ArmorVisor") {
                dataToSend.CurrentlyEquippedCore.GetInv = false;
                dataToSend.CurrentlyEquippedVisor = object;
                await sendEquip(gamerInfo, dataToSend);
                  resetHighlight(object.id, object.Type);
                  setHighlightedItems(items => ({ ...items, armorvisorId: object.id }));
            }else if (object.Type === "ArmorGlove") {
              dataToSend.CurrentlyEquippedCore.GetInv = false;
              dataToSend.CurrentlyEquippedGlove = object;
              await sendEquip(gamerInfo, dataToSend);
                resetHighlight(object.id, object.Type);
                setHighlightedItems(items => ({ ...items, armorgloveId: object.id }));
          }else if (object.Type === "ArmorCoating") {
            dataToSend.CurrentlyEquippedCore.GetInv = false;
            dataToSend.currentlyEquippedCoating = object;
            await sendEquip(gamerInfo, dataToSend);
              resetHighlight(object.id, object.Type);
              setHighlightedItems(items => ({ ...items, armorcoatingId: object.id }));
        }
    }
};


const highlightedObject = objects.find(obj => obj.id === highlightedItems[`${obj.Type.toLowerCase()}Id`]);
  console.log("Error with: ", objects);
  return (
    <div className="container">
      <div className="highlightedCardContainer">
        {highlightedObject && <HighlightedObjectCard object={highlightedObject} />}
      </div>
      <div className="cardContainer">
        <ObjectsDisplay currentlyEquipped={currentlyEquipped} objects={objects} highlightedId={highlightedItems[`${objects[0].Type.toLowerCase()}Id`]}  onObjectClick={handleObjectClick} />
      </div>
    </div>
  );
};

export default ArmoryRow;
