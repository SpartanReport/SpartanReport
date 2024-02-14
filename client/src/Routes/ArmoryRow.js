import React, { useState, useEffect, useRef } from 'react';
import './ArmoryRow.css';
import SvgBorderWrapper from '../Styles/Border';
import checkmark from '../checkmark.svg';


// Function to compare equipped items of a custom kit with the global currently equipped state
const isKitFullyEquipped = (kit, currentlyEquipped) => {
  console.log("Comparing kit: ", kit)
  console.log("Currently Equipped: ", currentlyEquipped)
  for (const key in kit) {
    const item = kit[key];
    if (!item) continue; // Skip if item is not defined
    const equippedItem = currentlyEquipped[itemTypeToEquippedProperty[item.Type]];
    if (!equippedItem || item.id !== equippedItem.id) {
      return false; // If any item is not equipped or IDs do not match, kit is not fully equipped
    }
  }
  return true; // All items in kit are equipped
};

// Mapping of Armory Row IDs to the corresponding visId for hash navigation
const visIdConversion = {
  "ArmorCore": "core",
  "ArmorHelmet": "helmet",
  "ArmorVisor": "visors",
  "ArmorGlove": "gloves",
  "ArmorCoating": "coatings",
  "ArmorLeftShoulderPad": "shoulderleft",
  "ArmorRightShoulderPad": "shoulderright",
  "ArmorWristAttachment": "wristattachement",
  "ArmorKneePad": "kneepad",
  "ArmorHipAttachment": "hipattachement",
  "ArmorChestAttachment": "chestattachement",
  "ArmorTheme": "armorkit",
};
const itemTypeToEquippedProperty = {
  "ArmorHelmet": "CurrentlyEquippedHelmet",
  "ArmorCore": "CurrentlyEquippedCore",
  "ArmorVisor": "CurrentlyEquippedVisor",
  "ArmorGlove": "CurrentlyEquippedGlove",
  "ArmorCoating": "CurrentlyEquippedCoating",
  "ArmorLeftShoulderPad": "CurrentlyEquippedLeftShoulderPad",
  "ArmorRightShoulderPad": "CurrentlyEquippedRightShoulderPad",
  "ArmorWristAttachment": "CurrentlyEquippedWristAttachment",
  "ArmorHipAttachment": "CurrentlyEquippedHipAttachment",
  "ArmorChestAttachment": "CurrentlyEquippedChestAttachment",
  "ArmorKneePad": "CurrentlyEquippedKneePad"
};


async function fetchImage(path, spartankey) {
  try {
    const proxyBaseUrl = process.env.PROXY_BASE_URL || 'http://localhost:3001/api/';
    const url = `${proxyBaseUrl}/${path}`;
    const headers = new Headers();
    headers.append('X-343-Authorization-Spartan', spartankey);

    const requestOptions = {
      method: 'GET',
      headers: headers,
    };

    const response = await fetch(url, requestOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const imageBlob = await response.blob();
    return URL.createObjectURL(imageBlob);
  } catch (error) {
    console.error('Fetching image failed:', error);
    return null;
  }
}


// Object Card is the individual card rendered for each object in the Armory Row
const ObjectCard = ({ editingObjectId, onEditingChange, onClickCustomKit, gamerInfo, object, isHighlighted, onClick, onNameChange, onImageChange, currentlyEquipped, onRemove }) => {
    // States for the image source, editing mode, and the current image index
  const [imageSrc, setImageSrc] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  let equippedImages = [];
  const inputRef = useRef(null);
  // If the object is a custom kit, get the images of the currently equipped items so we can cycle through them on the card in edit mode
  if (object.Type === "ArmorKitCustom") {
    equippedImages = Object.values(object.currentlyEquipped).filter(eq => eq && eq.Image).map(eq => eq.Image);
  }
  // Fetch Higher Resolution Image if the object is highlighted
    useEffect(() => {
    async function loadImage() {
      if (typeof object.id === 'string' && object.id.startsWith('saveLoadout')) {
        setImageSrc(object.Image ? `data:image/png;base64,${object.Image}` : null);
      } else if (object.ImagePath && gamerInfo.spartankey && object.isHighlighted && object.Type !== "ArmorCore") {
        const imgSrc = await fetchImage("hi/images/file/" + object.ImagePath, gamerInfo.spartankey);
        setImageSrc(imgSrc);
      } else {
        setImageSrc(`data:image/png;base64,${object.Image}`);
      }
    }
    loadImage();
  }, [object, gamerInfo.spartankey, object.Image]);

  // Focus the input field when the card enters edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current?.focus();
    }
  }, [isEditing]);
    // UseEffect to respond to changes in isEditing prop
  useEffect(() => {
    setIsEditing(editingObjectId === object.id);
  }, [editingObjectId, object.id]);

  // Function to cycle through the images of the currently equipped items
  const cycleImage = (direction) => {
    let newIndex = currentImageIndex + (direction === 'next' ? 1 : -1);
    if (newIndex < 0) newIndex = equippedImages.length - 1;
    if (newIndex >= equippedImages.length) newIndex = 0;
    setCurrentImageIndex(newIndex);
    // Update the image of the card
    onImageChange(object.id, equippedImages[newIndex]);
  };

  // Function to handle the name change of the custom kit
  const handleNameChange = (event) => {
    const newName = `${nonEditableIndex} ${event.target.value}`; // Reconstruct the full name with the index
    onNameChange(object.id, newName);
  };

  // Function to toggle the edit mode
  const handleEditToggle = (event) => {
    event.stopPropagation(); // Prevents the event from bubbling up
    // Toggle the edit mode based on whether this card's ID matches the editingObjectId
    const newIsEditing = editingObjectId === object.id ? false : true;
    onEditingChange(newIsEditing, object.id);
  };

  // Handles Enter key press to "save" the custom kit name
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      setIsEditing(!isEditing);
      const newIsEditing = editingObjectId === object.id ? false : true;
      onEditingChange(newIsEditing, object.id);
    }
  };

  // Handles removal of custom kit
  const handleRemoveCard = () => {
    onRemove(object.id);
    setIsEditing(false);
    onEditingChange(false, !isEditing ? object : null);

  };

  // Check to see if card passed in is a Custom Kit
  const isDummyObject = typeof object.id === 'string' && object.id.startsWith('saveLoadout');
  // If the object is a custom kit, we want to allow editing, but not if the card being passed in is the "Save Loadout" card template
  const isEditableDummyObject = isDummyObject && object.id !== 'saveLoadout';

  const rarityClass = object.Rarity;
  const imageClassName = isHighlighted ? 'highlightedImage' : 'unhighlightedImage';
  const cardClassName = `${isHighlighted ? 'highlightedObjectCardRow' : 'objectCard'} cardWithGradient ${rarityClass}`;
  const svgContainerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '150px', width: '185px' };

  // Determine the click handler based on if the card is in edit mode or not
  const handleCardClick = () => {
    if (isEditableDummyObject && !isEditing) {
      onClickCustomKit(object);
    } else {
      onClick(object);
    }
  };
  const nameParts = object.name.split('] '); // Splitting the name into the index and the actual name
  const nonEditableIndex = nameParts[0] + ']'; // The non-editable part, including the closing bracket
  const editableName = nameParts.length > 1 ? nameParts[1] : ''; // The editable part
  return (
    <div className={cardClassName} onClick={handleCardClick}>
          {isEditableDummyObject && isEditing ? (
            <>
              <input
                type="text"
                value={editableName}
                onKeyDown={handleKeyDown}
                onChange={handleNameChange}
                ref={inputRef}
                className="dummy-object-name-input"
              />
              {currentImageIndex > 0 && (
            <button onClick={() => cycleImage('prev')} className="cycle-button-prev">
              &lt; {/* Replace with your left arrow icon */}
            </button>
          )}
          {currentImageIndex < equippedImages.length - 1 && (
            <button onClick={() => cycleImage('next')} className="cycle-button-next">
              &gt; {/* Replace with your right arrow icon */}
            </button>
          )}
        </>
      ) : (
        <p className='card-subheader-mini'>{object.name}</p>
      )}
      {imageSrc !== null ? (
        <img src={imageSrc} alt={object.name} className={`${imageClassName} ImageCard`} />
      ) : (
        object.id.startsWith('saveLoadout') && (
          <div style={svgContainerStyle}>
            <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" fill="#4389BA" viewBox="0 0 16 16">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
            </svg>
          </div>
        )
      )}
        {isEditableDummyObject && (
          <button onClick={(event) => handleEditToggle(event)} className={`checkmark-button ${isEditing ? 'checkmark-button-editing' : ''}`}>
            {isEditing ? (
              <img src={checkmark} className="checkmark-editing" alt="Completed" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="10px" width="20" height="20" viewBox="0 0 50 50">
                <path d="M 43.125 2 C 41.878906 2 40.636719 2.488281 39.6875 3.4375 L 38.875 4.25 L 45.75 11.125 C 45.746094 11.128906 46.5625 10.3125 46.5625 10.3125 C 48.464844 8.410156 48.460938 5.335938 46.5625 3.4375 C 45.609375 2.488281 44.371094 2 43.125 2 Z M 37.34375 6.03125 C 37.117188 6.0625 36.90625 6.175781 36.75 6.34375 L 4.3125 38.8125 C 4.183594 38.929688 4.085938 39.082031 4.03125 39.25 L 2.03125 46.75 C 1.941406 47.09375 2.042969 47.457031 2.292969 47.707031 C 2.542969 47.957031 2.90625 48.058594 3.25 47.96875 L 10.75 45.96875 C 10.917969 45.914063 11.070313 45.816406 11.1875 45.6875 L 43.65625 13.25 C 44.054688 12.863281 44.058594 12.226563 43.671875 11.828125 C 43.285156 11.429688 42.648438 11.425781 42.25 11.8125 L 9.96875 44.09375 L 5.90625 40.03125 L 38.1875 7.75 C 38.488281 7.460938 38.578125 7.011719 38.410156 6.628906 C 38.242188 6.246094 37.855469 6.007813 37.4375 6.03125 C 37.40625 6.03125 37.375 6.03125 37.34375 6.03125 Z"></path>
              </svg>
            )}
          </button>
        )}
      {isEditableDummyObject && isEditing && (
        <>

        <button onClick={handleRemoveCard} className="trash-button">
        <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.5001 6H3.5" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M18.8332 8.5L18.3732 15.3991C18.1962 18.054 18.1077 19.3815 17.2427 20.1907C16.3777 21 15.0473 21 12.3865 21H11.6132C8.95235 21 7.62195 21 6.75694 20.1907C5.89194 19.3815 5.80344 18.054 5.62644 15.3991L5.1665 8.5" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M9.5 11L10 16" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M14.5 11L14 16" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M6.5 6C6.55588 6 6.58382 6 6.60915 5.99936C7.43259 5.97849 8.15902 5.45491 8.43922 4.68032C8.44784 4.65649 8.45667 4.62999 8.47434 4.57697L8.57143 4.28571C8.65431 4.03708 8.69575 3.91276 8.75071 3.8072C8.97001 3.38607 9.37574 3.09364 9.84461 3.01877C9.96213 3 10.0932 3 10.3553 3H13.6447C13.9068 3 14.0379 3 14.1554 3.01877C14.6243 3.09364 15.03 3.38607 15.2493 3.8072C15.3043 3.91276 15.3457 4.03708 15.4286 4.28571L15.5257 4.57697C15.5433 4.62992 15.5522 4.65651 15.5608 4.68032C15.841 5.45491 16.5674 5.97849 17.3909 5.99936C17.4162 6 17.4441 6 17.5 6" stroke="#1C274C" stroke-width="1.5"/>
        </svg>
        </button>
        </>
        
      )}

    </div>
  );
};

// HighlightedObjectCard is the individual card rendered for each object in the Armory Row when it is highlighted
const HighlightedObjectCard = ({ gamerInfo, object, isDisplay }) => {
  let [imageSrc, setImageSrc] = useState('');

  useEffect(() => {
    async function loadImage() {
      if (object.ImagePath && gamerInfo.spartankey && isDisplay && object.Type !== "ArmorCore") {
        let url = "hi/images/file/"+object.ImagePath;
        const imgSrc = await fetchImage(url, gamerInfo.spartankey);
        setImageSrc(imgSrc);
      }
      else {
        setImageSrc(`data:image/png;base64,${object.Image}`);
      }
    }
 
    loadImage();
  }, [object.id, object.ImagePath, object.Image, gamerInfo.spartankey, isDisplay]);

  const rarityClass = object.Rarity;
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


// ObjectsDisplay is the container for the Armory Row cards
const ObjectsDisplay = ({setTempHighlightId,tempHighlightId ,handleEditingChange ,editingObjectId, onClickCustomKit,onRemove,onImageChange, editMode, gamerInfo, currentlyEquipped, objects, highlightedId, onObjectClick, onNameChange,onEditingChange }) => {
  // Define a mapping for rarity to sort them in a specific order
  const rarityOrder = { Common: 1, Rare: 2, Epic: 3, Legendary: 4, LegendaryCustom: 5, };
  objects.forEach((object) => {
    // Assume all objects initially not highlighted
    object.isHighlighted = false;
  
    if (object.Type === "ArmorKitCustom") {
      // Determine if the custom kit is fully equipped
      object.isHighlighted = isKitFullyEquipped(object.currentlyEquipped, currentlyEquipped);
    } else {
      // For individual items, not part of a custom kit, use existing logic or adjust as necessary
      object.isHighlighted = object.id === highlightedId;
    }
  });
  // Filter and then sort the objects
  const sortedFilteredArmoryRow = objects.filter(object => {
      // Check if the special edge case applies
  const isSpecialCase = currentlyEquipped.CurrentlyEquippedCore.CoreId === '017-001-hws-c13d0b38';
  const effectiveCoreId = isSpecialCase ? '017-001-olympus-c13d0b38' : currentlyEquipped.CurrentlyEquippedCore.CoreId;

    if (object.Type === "ArmorCoating") {
      return object.Image === "undefined" || 
             object.BelongsToCore === effectiveCoreId || 
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
            isHighlighted={object.isHighlighted}
            onClick={onObjectClick}
            onClickCustomKit={onClickCustomKit}
            onNameChange={onNameChange}
            gamerInfo={gamerInfo}
            requestEditFocus={editMode === object.id}
            currentlyEquipped={currentlyEquipped}
            onImageChange={onImageChange}
            onRemove={onRemove}
            setTempHighlightId={setTempHighlightId}
            tempHighlightId={tempHighlightId}
            editingObjectId={editingObjectId}
            onEditingChange={onEditingChange}
          />
        </SvgBorderWrapper>
      ))}
    </div>
  );
};

// ArmoryRow is the main component for the Armory Row
const ArmoryRow = ({ visId, objects, fullObjects, resetHighlight, gamerInfo, onEquipItem,setCurrentlyEquipped ,currentlyEquipped, highlightedItems, setHighlightedItems }) => {
  // States
  const [editingObjectId, setEditingObjectId] = useState(null);  
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editingObject, setEditingObject] = useState(null);
  const [tempHighlightId, setTempHighlightId] = useState(null);
  useEffect(() => {
    if (editingObjectId) {
      const currentEditingObject = objects.find(obj => obj.id === editingObjectId);
      setEditingObject(currentEditingObject);
    } else {
      setEditingObject(null); // Reset editingObject when not in editing mode
    }
  }, [editingObjectId, objects]); // Listen for changes in editingObjectId and objects array
  // Function to handle the change of editing mode. This gets drilled down to the ObjectCard
  const handleEditingChange = (isEditing, objectId = null) => {
    if (isEditing) {
      // Enable editing mode for this object and disable for others
      setEditingObjectId(objectId); // Track the currently editing object by ID
    } else {
      // Disable editing mode if this card was in edit mode
      setEditingObjectId(null);
    }
    setIsEditingMode(isEditing);
  };
    // UseEffect that detects hash changes. Currently, when a hash changes it means the user has clicked on "change" button in the custom kit modal
  useEffect(() => {
    const handleHashChange = () => {
      console.log("Hash changed!");
      console.log("tempHighlightId in hash change ", tempHighlightId)
      const hash = window.location.hash.replace('#', '');
      const itemType = Object.keys(visIdConversion).find(key => visIdConversion[key] === hash);
      console.log(itemType)
    };
  
    // Add event listener
    window.addEventListener('hashchange', handleHashChange);  
    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [objects]); // Dependency array includes 'objects' if it's expected to change

    // Add a dummy object to initialObjects if visId is 'armorkit'
  const modifiedInitialObjects = visId === 'armorkit' ? [...objects, { id: 'saveLoadout', Type: 'ArmorKit', name: 'Save Loadout', Rarity:"LegendaryCustom", IsCrossCore: true,currentlyEquipped:currentlyEquipped }]: objects;
  const [currentObjects, setCurrentObjects] = useState(modifiedInitialObjects);

  // Sends equip payload to the backend with the currently equipped items
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
  
  // Sends custom kit to backend with the items in the custom kit
  const handleSendingCustomKit = async (object) => {
    let dataToSend = object.currentlyEquipped;
    dataToSend.CurrentlyEquippedCore.GetInv = false;
    await sendEquip(gamerInfo, dataToSend);
  
    // Define a helper function to safely attempt actions on equipped items
    const safelyEquipItem = (equippedItem, itemType) => {
      if (equippedItem) { // Check if the item is not null
        setHighlightedItems(items => ({ ...items, [`${itemType.toLowerCase()}Id`]: equippedItem.id }));
        resetHighlight(equippedItem.id, itemType);
        onEquipItem(equippedItem);
      }
    };
  
    // Now using safelyEquipItem for each type of equipment
    safelyEquipItem(object.currentlyEquipped.CurrentlyEquippedCore, "ArmorCore");
    safelyEquipItem(object.currentlyEquipped.CurrentlyEquippedHelmet, "ArmorHelmet");
    safelyEquipItem(object.currentlyEquipped.CurrentlyEquippedVisor, "ArmorVisor");
    safelyEquipItem(object.currentlyEquipped.CurrentlyEquippedGlove, "ArmorGlove");
    safelyEquipItem(object.currentlyEquipped.CurrentlyEquippedCoating, "ArmorCoating");
    safelyEquipItem(object.currentlyEquipped.CurrentlyEquippedLeftShoulderPad, "ArmorLeftShoulderPad");
    safelyEquipItem(object.currentlyEquipped.CurrentlyEquippedRightShoulderPad, "ArmorRightShoulderPad");
    safelyEquipItem(object.currentlyEquipped.CurrentlyEquippedWristAttachment, "ArmorWristAttachment");
    safelyEquipItem(object.currentlyEquipped.CurrentlyEquippedChestAttachment, "ArmorChestAttachment");
    safelyEquipItem(object.currentlyEquipped.CurrentlyEquippedKneePad, "ArmorKneePad");
    
    // Once all items are equipped, highlight the object
    setHighlightedItems(items => ({ ...items, armorthemeId: object.id }));
    console.log("Type: ", object)

  };

  const handleObjectClick = async (object) => {
    console.log(object.Type.toLowerCase())
    // If the object is not highlighted
    if (object.id !== highlightedItems[`${object.Type.toLowerCase()}Id`]) {
        object.isHighlighted = true;

        // Sends newly equipped item back to parent Component
        onEquipItem(object);
        let dataToSend = { ...currentlyEquipped };
        // Search what type the object being clicked on is. For most cases, it will send the currently equipped items with the compatable type. 
        // If the object is a core, it will equip that core, send a request to the backend to see what items are equipped currently for that core
        // and then send those items back to the parent component, and highlight the items that are equipped, and reset the highlight for the core
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
      console.log(object)
    }
  }
};
const [customKitCount, setCustomKitCount] = useState(0);
const handleCustomKit = (object) => {
  if (currentlyEquipped && currentlyEquipped.CurrentlyEquippedCore && object.id === 'saveLoadout') {
    setCustomKitCount(customKitCount + 1); // Increment the counter

    const uniqueId = `saveLoadout-${new Date().getTime()}`;
    const newKitName = `[${customKitCount + 1}] New Loadout`; // Use the new count for naming

    const newDummyObject = {
      id: uniqueId,
      Type: 'ArmorKitCustom',
      Rarity: 'LegendaryCustom',
      name: newKitName,
      IsCrossCore: true,
      Image: currentlyEquipped.CurrentlyEquippedCore.Image,
      currentlyEquipped: currentlyEquipped,
    };

    setHighlightedItems(items => ({ ...items, armorthemeId: uniqueId }));

    // Adding the new dummy object to the ArmoryRowKits array
    fullObjects.ArmoryRowKits.push(newDummyObject);
    // Creating a copy of the currentObjects to update
    const updatedObjects = [...currentObjects];
    // Calculate the index before the last element
    const insertBeforeLastIndex = updatedObjects.length - 1;
    // Using splice to insert the newDummyObject right before the last element
    updatedObjects.splice(insertBeforeLastIndex, 0, newDummyObject);
    // Setting the editing object ID to the uniqueId of the new dummy object
    setEditingObjectId(uniqueId);
    // Updating the currentObjects state to include the new dummy object
    setCurrentObjects(updatedObjects);
  }
};

const handleImageChange = (objectId, newImage) => {
  setCurrentObjects(currentObjects.map(obj => 
    obj.id === objectId ? { ...obj, Image: newImage } : obj
  ));
};
const handleRemoveCard = (idToRemove) => {
  setCurrentObjects(currentObjects.filter(obj => obj.id !== idToRemove));
  let removedItem = fullObjects.ArmoryRowKits.filter(obj => obj.id !== idToRemove);
  fullObjects.ArmoryRowKits = removedItem;

};

    // Decide which function to use on object click
    const onObjectClick = (object) => {
      if (object.Type === 'ArmorKit' && object.id.startsWith('saveLoadout')) {
        handleCustomKit(object);
      } else {
        handleObjectClick(object);
      }
    };

    const onClickCustomKit = (object) => {
      currentlyEquipped = object.currentlyEquipped;
      handleSendingCustomKit(object);

    }
    const handleObjectNameChange = (objectId, newName) => {
      setCurrentObjects(currentObjects.map(obj => 
        obj.id === objectId ? { ...obj, name: newName } : obj
      ));
    };


// First, ensure that the 'objects' array is not empty before trying to access its elements
const highlightedObject = objects.length > 0 ? objects.find(obj => obj.id === highlightedItems[`${obj.Type.toLowerCase()}Id`]) : undefined;

// Similarly, for highlightedId, check if objects array is not empty
const highlightedId = objects.length > 0 ? highlightedItems[`${objects[0].Type.toLowerCase()}Id`] : undefined;

const sharedProps = {
  setTempHighlightId:setTempHighlightId,
  tempHighlightId:tempHighlightId,
  onClickCustomKit,
  onRemove: handleRemoveCard,
  onImageChange: handleImageChange,
  visId,
  onObjectClick,
  onNameChange: handleObjectNameChange,
  gamerInfo,
  currentlyEquipped,
  objects: currentObjects,
  resetHighlight: resetHighlight,
  highlightedItems: highlightedItems,
  highlightedId: highlightedId,
  editMode: editingObjectId,
  editingObjectId:editingObjectId,
};
return (
  <div className="armory-row-flex-container">
    <div className={isEditingMode ? "container-cores-custom-kits" : "container-cores"}>
      <div className="highlightedCardContainer">
        {highlightedObject && <HighlightedObjectCard visId={visId} gamerInfo={gamerInfo} object={highlightedObject} isDisplay={true} />}
      </div>
      <div className="cardContainer">
        <ObjectsDisplay {...sharedProps} onEditingChange={handleEditingChange} />
      </div>
      {isEditingMode && editingObject && renderEditingDetails(handleEditingChange, sharedProps, editingObject)}
    </div>
  </div>
);};


function renderEditingDetails(handleEditingChange,sharedProps,editingObject) {
  console.log("Viewing: " , editingObject.currentlyEquipped)
  const kitIsFullyEquipped = isKitFullyEquipped(editingObject.currentlyEquipped, sharedProps.currentlyEquipped);
  return (
    <div className="editing-details">
        <div className="subheader-container-edit">
          <svg className="diamond-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22.92 22.92">
            <path className="cls-1" d="M11.46,0L0,11.46l11.46,11.46,11.46-11.46L11.46,0ZM3.41,11.46L11.46,3.41l8.05,8.05-8.05,8.05L3.41,11.46Z"/>
            <rect className="cls-1" x="8.16" y="8.16" width="6.59" height="6.59" transform="translate(-4.75 11.46) rotate(-45)"/>
          </svg>

        <h1 className="spartan-subheader-home">Custom Armor Kit</h1>
      </div>

      <div className="scrollable-container">
        {Object.values(editingObject.currentlyEquipped).map(item => 
          item && item.Image ? renderEquippedItem(handleEditingChange, item, {
            ...sharedProps,
            isHighlighted: kitIsFullyEquipped // Pass this as part of the sharedProps or directly to the component
          }, editingObject.id) : null
        )}
        <p>ID: {editingObject.id}</p>
      </div>
    </div>
  );
}
function renderEquippedItem(handleEditingChange,item, sharedProps,parentID) {
  const handleButtonClick = (item) => {
    console.log("backclick item: ", item)
    handleEditingChange(false);
    const visId = visIdConversion[item.Type];
    if (visId) {
      console.log(visId)
      window.location.hash = visId;
    }
  };

  let currentlyEquippedCategory = itemTypeToEquippedProperty[item.Type];
  let isHighlighted = false;

// Check if the currently equipped item in the category exists and has an ID
if (sharedProps.currentlyEquipped[currentlyEquippedCategory] && 
  sharedProps.currentlyEquipped[currentlyEquippedCategory].hasOwnProperty('id')) {
      // Check if the currently equipped item's ID matches the item's ID
  if (sharedProps.currentlyEquipped[currentlyEquippedCategory].id === item.id) {
    isHighlighted = true;

  }
} else{
  isHighlighted = true;
}
  console.log("ItemID: ", item.id)
  console.log("Shared Props: " , currentlyEquippedCategory)
  return (
    <SvgBorderWrapper height={200} width={200} rarity={item.Rarity}>
      <ObjectCard
        onEditingChange={sharedProps.onEditingChange}
        key={item.id}
        object={item}
        isHighlighted={isHighlighted}
        onClick={sharedProps.onObjectClick}
        onClickCustomKit={sharedProps.onClickCustomKit}
        onNameChange={sharedProps.onNameChange}
        gamerInfo={sharedProps.gamerInfo}
        requestEditFocus={sharedProps.editMode === item.id}
        currentlyEquipped={sharedProps.currentlyEquipped}
        onImageChange={sharedProps.onImageChange}
        onRemove={sharedProps.onRemove}
      />
      <button className='change-custom-kit-btn' onClick={() => handleButtonClick(item)}>
        <h4 className='change-text'>View</h4>
      </button>
    </SvgBorderWrapper>
  );
}
export default ArmoryRow;
