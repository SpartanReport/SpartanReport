import React, { useState, useEffect,useRef } from 'react';
import './ArmoryRow.css'; // Make sure to import your CSS file here
import SvgBorderWrapper from '../Styles/Border';
async function fetchImage(path, spartankey) {
  try {
    // Base URL of your proxy server
    const proxyBaseUrl = process.env.PROXY_BASE_URL || 'http://localhost:3001/api/'; // Fallback to a default
    // Complete URL with the proxy base URL
    const url = `${proxyBaseUrl}/${path}`;
    // Setting up the headers
    const headers = new Headers();
    headers.append('X-343-Authorization-Spartan', spartankey);

    // Preparing the request options
    const requestOptions = {
      method: 'GET',
      headers: headers
    };

    // Making the request through the proxy server
    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Since the response is a raw image file, we get it as a blob
    const imageBlob = await response.blob();

    // Converting blob to a local URL
    return URL.createObjectURL(imageBlob);
  } catch (error) {
    console.error('Fetching image failed:', error);
    return null; // or a default image URL or some error handling mechanism
  }
}
const ObjectCard = ({gamerInfo, object, isHighlighted, onClick }) => {
  let [imageSrc, setImageSrc] = useState('');

  useEffect(() => {
    async function loadImage() {
      if (object.ImagePath && gamerInfo.spartankey && object.isHighlighted && object.Type !== "ArmorCore") {
        let url = "hi/images/file/"+object.ImagePath;

        const imgSrc = await fetchImage(url, gamerInfo.spartankey);
        setImageSrc(imgSrc);
      }
      else {
        setImageSrc(`data:image/png;base64,${object.Image}`);
      }
    }

    loadImage();
  }, [object.ImagePath, gamerInfo.spartankey]);
  const rarityClass = object.Rarity; // e.g., "Common", "Rare", "Epic", "Legendary"
  const cardClassName = `${isHighlighted ? 'highlightedObjectCardRow' : 'objectCard'} cardWithGradient ${rarityClass}`;
  const imageClassName = isHighlighted ? 'highlightedImage' : 'unhighlightedImage';
  return (
    <div className={cardClassName} onClick={() => onClick(object)}>
      <p className='card-subheader-mini'>{object.name}</p>
      <img src={imageSrc} alt="Spartan Image Highlighted" className={`${imageClassName} ImageCard`}/>
    </div>
  );
};

const HighlightedObjectCard = ({ gamerInfo, object, isDisplay }) => {
  let [imageSrc, setImageSrc] = useState('');

  useEffect(() => {
    async function loadImage() {
      if (object.ImagePath && gamerInfo.spartankey && isDisplay && object.Type !== "ArmorCore") {
        let url = "hi/images/file/"+object.ImagePath;

        const imgSrc = await fetchImage(url, gamerInfo.spartankey); // complete the fetchImage function
        setImageSrc(imgSrc);
      }
      else {
        setImageSrc(`data:image/png;base64,${object.Image}`);
      }
    }

    loadImage();
  }, [object.id, object.ImagePath, object.Image, gamerInfo.spartankey, isDisplay]); // Updated dependencies
  const rarityClass = object.Rarity; // Assuming HighlightedObjectCard also has a Rarity
  const cardClassName = `highlightedObjectCard cardWithGradient ${rarityClass}`;
  return (
    <SvgBorderWrapper height={410} width={410} rarity="Highlight">
      <div className={cardClassName}>
        <p className='card-subheader'>Equipped | {object.name} | {object.Rarity}</p>
        <img src={imageSrc} alt="Spartan Core" className="bigHighlightedImage HighlightedImageCard"/>
        </div>
    </SvgBorderWrapper>
  );
};


const ObjectsDisplay = ({gamerInfo, currentlyEquipped, objects, highlightedId, onObjectClick }) => {

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
            gamerInfo={gamerInfo}
          />
        </SvgBorderWrapper>
      ))}
    </div>
  );
};
const ArmoryRow = ({ objects, fullObjects, resetHighlight, gamerInfo, onEquipItem,setCurrentlyEquipped ,currentlyEquipped, highlightedItems, setHighlightedItems }) => {

  const sendEquip = async (gamerInfo, currentlyEquipped) => {
    const payload = {
      GamerInfo: gamerInfo,
      CurrentlyEquipped: currentlyEquipped
    };

    console.log("Sending ", payload)
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';

      const response = await fetch(`${apiUrl}/armorcore`, {
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
                const newHighlightedCore = fullObjects.ArmoryRow.find(core => core.CorePath === response.Themes[0].CoreId);

                const newHighlightedHelmet = fullObjects.ArmoryRowHelmets.find(helmet => helmet.CorePath === response.Themes[0].HelmetPath);
                const newHighlightedVisor = fullObjects.ArmoryRowVisors.find(visor => visor.CorePath === response.Themes[0].VisorPath);
                const newHighlightedGlove = fullObjects.ArmoryRowGloves.find(glove => glove.CorePath === response.Themes[0].GlovePath);
                const newHighlightedCoating = fullObjects.ArmoryRowCoatings.find(coating => coating.CorePath === response.Themes[0].CoatingPath);
                const newHighlightedLeftShoulderPad = fullObjects.ArmoryRowLeftShoulderPads.find(leftshoulderpad => leftshoulderpad.CorePath === response.Themes[0].LeftShoulderPadPath);
                const newHighlightedRightShoulderPad = fullObjects.ArmoryRowRightShoulderPads.find(rightshoulderpad => rightshoulderpad.CorePath === response.Themes[0].RightShoulderPadPath);
                const newHighlightedWristAttachment = fullObjects.ArmoryRowWristAttachments.find(wristattachment => wristattachment.CorePath === response.Themes[0].WristAttachmentPath);
                const newHighlightedHipAttachment = fullObjects.ArmoryRowHipAttachments.find(hipattachment => hipattachment.CorePath === response.Themes[0].HipAttachmentPath);
                const newHighlightedChestAttachment = fullObjects.ArmoryRowChestAttachments.find(chestattachment => chestattachment.CorePath === response.Themes[0].ChestAttachmentPath);
                const newHighlightedKneePad = fullObjects.ArmoryRowKneePads.find(kneepad => kneepad.CorePath === response.Themes[0].KneePadPath);
                if (newHighlightedCore) {
                  setHighlightedItems(items => ({ ...items, armorcoreId: object.id }));
                  resetHighlight(newHighlightedCore.id, "ArmorHelmet");
                  onEquipItem(newHighlightedCore); // Call the handler when an item is clicked

                }
                if (newHighlightedHelmet) {
                  setHighlightedItems(items => ({ ...items, armorhelmetId: object.id }));
                  resetHighlight(newHighlightedHelmet.id, "ArmorHelmet");
                  onEquipItem(newHighlightedHelmet); // Call the handler when an item is clicked

                }
                if (newHighlightedVisor) {
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
                if (newHighlightedLeftShoulderPad) {
                  setHighlightedItems(items => ({ ...items, armorleftshoulderpadId: object.id }));
                  resetHighlight(newHighlightedLeftShoulderPad.id, "ArmorLeftShoulderPad");
                  onEquipItem(newHighlightedLeftShoulderPad);
                }
                if (newHighlightedRightShoulderPad) {
                  setHighlightedItems(items => ({ ...items, armorrightshoulderpadId: object.id }));
                  resetHighlight(newHighlightedRightShoulderPad.id, "ArmorRightShoulderPad");
                  onEquipItem(newHighlightedRightShoulderPad);
                }
                if (newHighlightedWristAttachment) {
                  setHighlightedItems(items => ({ ...items, armorwristattachmentId: object.id }));
                  resetHighlight(newHighlightedWristAttachment.id, "ArmorWristAttachment");
                  onEquipItem(newHighlightedWristAttachment);
                }
                if (newHighlightedHipAttachment) {
                  setHighlightedItems(items => ({ ...items, armorhipattachmentId: object.id }));
                  resetHighlight(newHighlightedHipAttachment.id, "ArmorHipAttachment");
                  onEquipItem(newHighlightedHipAttachment);
                }
                if (newHighlightedChestAttachment) {
                  setHighlightedItems(items => ({ ...items, armorchestattachmentId: object.id }));
                  resetHighlight(newHighlightedChestAttachment.id, "ArmorChestAttachment");
                  onEquipItem(newHighlightedChestAttachment);
                }
                if (newHighlightedKneePad) {
                  setHighlightedItems(items => ({ ...items, armorkneepadId: object.id }));
                  resetHighlight(newHighlightedKneePad.id, "ArmorKneePad");
                  onEquipItem(newHighlightedKneePad);
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
        }else if (object.Type === "ArmorLeftShoulderPad") {
          dataToSend.CurrentlyEquippedCore.GetInv = false;
          dataToSend.CurrentlyEquippedLeftShoulderPad = object;
          await sendEquip(gamerInfo, dataToSend);
            resetHighlight(object.id, object.Type);
            setHighlightedItems(items => ({ ...items, armorleftshoulderpadId: object.id }));
      }else if (object.Type === "ArmorRightShoulderPad") {
        dataToSend.CurrentlyEquippedCore.GetInv = false;
        dataToSend.CurrentlyEquippedRightShoulderPad = object;
        await sendEquip(gamerInfo, dataToSend);
          resetHighlight(object.id, object.Type);
          setHighlightedItems(items => ({ ...items, armorrightshoulderpadId: object.id }));
    }
    else if (object.Type === "ArmorWristAttachment") {
      dataToSend.CurrentlyEquippedCore.GetInv = false;
      dataToSend.CurrentlyEquippedWristAttachment = object;
      await sendEquip(gamerInfo, dataToSend);
        resetHighlight(object.id, object.Type);
        setHighlightedItems(items => ({ ...items, armorwristattachmentId: object.id }));
    }
    else if (object.Type === "ArmorHipAttachment") {
      dataToSend.CurrentlyEquippedCore.GetInv = false;
      dataToSend.CurrentlyEquippedHipAttachment = object;
      await sendEquip(gamerInfo, dataToSend);
        resetHighlight(object.id, object.Type);
        setHighlightedItems(items => ({ ...items, armorhipattachmentId: object.id }));
    }
    else if (object.Type === "ArmorChestAttachment") {
      dataToSend.CurrentlyEquippedCore.GetInv = false;
      dataToSend.CurrentlyEquippedChestAttachment = object;
      await sendEquip(gamerInfo, dataToSend);
        resetHighlight(object.id, object.Type);
        setHighlightedItems(items => ({ ...items, armorchestattachmentId: object.id }));
    }
    else if (object.Type === "ArmorKneePad") {
      dataToSend.CurrentlyEquippedCore.GetInv = false;
      dataToSend.CurrentlyEquippedKneePad = object;
      await sendEquip(gamerInfo, dataToSend);
        resetHighlight(object.id, object.Type);
        setHighlightedItems(items => ({ ...items, armorkneepadId: object.id }));
    }
    else {
      console.log("Error: No object type found");
    }
  }
};
const highlightedObject = objects.find(obj => obj.id === highlightedItems[`${obj.Type.toLowerCase()}Id`]);
  
return (
    <div className="container-cores">
      <div className="highlightedCardContainer">
        {highlightedObject && <HighlightedObjectCard gamerInfo={gamerInfo} object={highlightedObject} isDisplay={true} />}
      </div>
      <div className="cardContainer">
        <ObjectsDisplay gamerInfo={gamerInfo} currentlyEquipped={currentlyEquipped} objects={objects} highlightedId={highlightedItems[`${objects[0].Type.toLowerCase()}Id`]}  onObjectClick={handleObjectClick} />
      </div>
    </div>
  );
};

export default ArmoryRow;
