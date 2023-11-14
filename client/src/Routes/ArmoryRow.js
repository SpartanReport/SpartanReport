import React, { useState, useEffect,useRef } from 'react';
import './ArmoryRow.css'; // Make sure to import your CSS file here
import SvgBorderWrapper from '../Styles/Border';

const ObjectCard = ({ object, isHighlighted, onClick }) => {
  const [isImageVisible, setImageVisible] = useState(false);
  const imageRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setImageVisible(true);
        observer.disconnect();
      }
    });

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const cardClassName = isHighlighted ? 'highlightedObjectCardRow' : 'objectCard';
  const base64ImageData = object.Image;
  let imageSrc = `data:image/jpeg;base64,${base64ImageData}`;

  if (!isImageVisible) {
    imageSrc = ''; // Placeholder or a loading image
  }

  if (imageSrc === "undefined") {
    return null;
  }

  return (
    <div className={cardClassName} onClick={() => onClick(object)}>
      <p className='card-subheader-mini'>{object.name}</p>
      <img ref={imageRef} src={imageSrc} alt="Spartan Core" className="ImageCard"/>
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
    <SvgBorderWrapper height={410} width={410} rarity="Highlight">
    <div className="highlightedObjectCard">
      <p className='card-subheader'>Equipped | {object.name} | {object.Rarity}</p>
      <img src={imageSrc} alt="Spartan Core" className="HighlightedImageCard" />
    </div>
    </SvgBorderWrapper>
  );
};

const ObjectsDisplay = ({ currentlyEquipped, objects, highlightedId, onObjectClick }) => {

  // Define a mapping for rarity to sort them in a specific order
  const rarityOrder = { Common: 1, Rare: 2, Epic: 3, Legendary: 4 };

  // Filter and then sort the objects
  const sortedFilteredArmoryRow = objects.filter(object => {
    if (object.Type === "ArmorCoating") {
      return object.Image === "undefined" || 
             object.BelongsToCore === currentlyEquipped.CurrentlyEquippedCore.CoreId || 
             object.Type === "ArmorCore";
    } else {
      return object.IsCrossCore || 
             object.Image === "undefined" || 
             object.BelongsToCore === currentlyEquipped.CurrentlyEquippedCore.CoreId || 
             object.Type === "ArmorCore";
    }
  }).sort((a, b) => {
    // First sort by name alphabetically
    const rarityCompare = rarityOrder[a.Rarity] - rarityOrder[b.Rarity];
    if (rarityCompare !== 0) {
      return rarityCompare;
    }

    // Then sort by name alphabetically
    return a.name.localeCompare(b.name);  });

  console.log(objects);

  // Calculate the number of columns needed for two rows
  const columns = Math.ceil(sortedFilteredArmoryRow.length / 2);

  return (
    <div className="objectsDisplay" style={{ gridTemplateColumns: `repeat(${columns}, 150px)` }}>
      {sortedFilteredArmoryRow.map((object) => (
        <SvgBorderWrapper height={200} width={200} rarity={object.Rarity}>
          <ObjectCard
            key={object.id}
            object={object}
            isHighlighted={object.id === highlightedId}
            onClick={onObjectClick}
          />
        </SvgBorderWrapper>
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
