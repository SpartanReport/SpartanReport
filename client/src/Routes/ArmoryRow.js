import React, { useState, useEffect, useRef } from 'react';
import './ArmoryRow.css';
import SvgBorderWrapper from '../Styles/Border';
import checkmark from '../checkmark.svg';
import axios from 'axios';
import { useCurrentlyEquipped } from '../Components/GlobalStateContext';
import ObjectCard from "./ObjectCard";
import HighlightedObjectCard from "./HighlightedObjectCard";

// Function to compare equipped items of a custom kit with the global currently equipped state
const isKitFullyEquipped = (kit, currentlyEquipped) => {
  for (const key in kit) {
    if (key === "CurrentlyEquippedArmorKit"){
      continue
    }
    
    const item = kit[key];
       // Assuming `itemTypeToEquippedProperty` maps item types to their corresponding properties in `currentlyEquipped`
       if (!item) continue; // Skip if item is not defined
       const equippedItemProperty = itemTypeToEquippedProperty[item.Type];
       if (!equippedItemProperty) {
         continue; // Skip if there's no mapping for this item type
       }
       const equippedItem = currentlyEquipped[itemTypeToEquippedProperty[item.Type]];
    if (!equippedItem) {
      continue; // Skip this item if it's not equipped
    }
    if (item.id !== equippedItem.id) {
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
  "ArmorMythicFx" : "mythicfx",
  "ArmorFx": "fx",
  "ArmorEmblem": "emblem",
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
  "ArmorKneePad": "CurrentlyEquippedKneePad",
  "ArmorMythicFx": "CurrentlyEquippedArmorMythicFx",
  "ArmorFx": "CurrentlyEquippedArmorFx",
  "ArmorEmblem": "CurrentlyEquippedArmorEmblem",

};







// ObjectsDisplay is the container for the Armory Row cards
/**
 * Renders a display of armor piece with various properties.
 *
 * @param {Object} props - The component props.
 * @param {number} props.customKitCount - The count of custom kits.
 * @param {function} props.setCustomKitCount - The function to set the count of custom kits.
 * @param {function} props.setTempHighlightId - The function to set the temporary highlight ID.
 * @param {string} props.tempHighlightId - The temporary highlight ID.
 * @param {function} props.handleEditingChange - The function to handle editing change.
 * @param {string} props.editingObjectId - The ID of the armor piece being edited.
 * @param {function} props.onClickCustomKit - The function to handle click on custom kit.
 * @param {function} props.onRemove - The function to handle armor piece removal.
 * @param {function} props.onImageChange - The function to handle image change.
 * @param {boolean} props.editMode - Indicates if the component is in edit mode.
 * @param {Object} props.gamerInfo - The gamer information.
 * @param {Object} props.currentlyEquipped - The currently equipped armor pieces.
 * @param {Array} props.objects - The array of armor pieces to display.
 * @param {string} props.highlightedId - The ID of the highlighted armor piece.
 * @param {function} props.onObjectClick - The function to handle object click.
 * @param {function} props.onNameChange - The function to handle name change.
 * @param {function} props.onEditingChange - The function to handle editing change.
 * @returns {JSX.Element} The rendered ObjectsDisplay component.
 */
const ObjectsDisplay = ({ customKitCount, setCustomKitCount, setTempHighlightId, tempHighlightId, editingObjectId, onClickCustomKit, onRemove, onImageChange, editMode, gamerInfo, objects, highlightedId, onObjectClick, onNameChange, onEditingChange }) => {
  // Define a mapping for rarity to sort them in a specific order
  const { currentlyEquipped } = useCurrentlyEquipped();

  const rarityOrder = { Common: 1, Rare: 2, Epic: 3, Legendary: 4, LegendaryCustom: 5, };
  objects.forEach((object) => {
    if (object !== null){
      // Assume all objects initially not highlighted
      object.isHighlighted = false;
  
      if (object.Type === "ArmorKitCustom" && object !== null) {
        // Determine if the custom kit is fully equipped
        object.isHighlighted = isKitFullyEquipped(object.currentlyEquipped, currentlyEquipped);
      } else {
        // For individual items, not part of a custom kit, use existing logic or adjust as necessary
        object.isHighlighted = object.id === highlightedId;
      }
    
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
    return a.name.localeCompare(b.name);
  });


  // Calculate the number of columns needed for two rows
  const columns = Math.ceil(sortedFilteredArmoryRow.length / 2);
  return (
    <div className="objectsDisplay" style={{ gridTemplateColumns: `repeat(${columns}, 150px)` }}>
      {sortedFilteredArmoryRow.map((object) => (
        <SvgBorderWrapper key={object.id} height={200} width={200} rarity={object.Rarity}>
          <ObjectCard
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
            customKitCount={customKitCount}
            setCustomKitCount={setCustomKitCount}
          />
        </SvgBorderWrapper>
      ))}
    </div>
  );
};


// ArmoryRow is the main component for the Armory Row
/**
 * Represents a row in the Armory component.
 *
 * @param {Object} props - The props for the ArmoryRow component.
 * @param {string} props.visId - The ID of the visualization.
 * @param {Array} props.objects - The array of armor pieces.
 * @param {Array} props.fullObjects - The array of all armor pieces in the player inventory.
 * @param {Function} props.resetHighlight - The function to reset the highlight.
 * @param {Object} props.gamerInfo - The gamer information.
 * @param {Function} props.onEquipItem - The function to handle equipping an item.
 * @param {Function} props.setCurrentlyEquipped - The function to set the currently equipped item.
 * @param {Object} props.currentlyEquipped - The currently equipped item.
 * @param {Object} props.highlightedItems - The highlighted items.
 * @param {Function} props.setHighlightedItems - The function to set the highlighted items.
 * @returns {JSX.Element} The ArmoryRow component.
 */
const ArmoryRow = ({ visId, objects, fullObjects, resetHighlight, gamerInfo, onEquipItem, highlightedItems, setHighlightedItems }) => {
  // States
  const { currentlyEquipped, setCurrentlyEquipped } = useCurrentlyEquipped();
  const [customKitCount, setCustomKitCount] = useState(0);
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
  const handleEditingChange = async (isEditing, objectId = null,ImageIndex = 0, ImageType = "", KitName = "") => {
    if (isEditing) {
      // Enable editing mode for this object and disable for others
      setEditingObjectId(objectId); // Track the currently editing object by ID
    } else {
      // Disable editing mode if this card was in edit mode
      setEditingObjectId(null);
      // Upload to backend
      editingObject.ImageIndex = ImageIndex;
      if (ImageIndex === 0){
        editingObject.ImageType = "ArmorHelmet"
      }else{
        editingObject.ImageType = ImageType;
      }
      editingObject.name = KitName;
      console.log("Sending custom kit to backend")
      console.log(editingObject)

      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080'; // Fallback URL if the env variable is not set

        // Prepare the payload for API, excluding images from currentlyEquipped
        const payload = {
          gamerInfo,
          newDummyObject: {
            ...(() => {
              const { Image, ...rest } = editingObject;
              return rest;
            })(),
            currentlyEquipped: Object.entries(editingObject.currentlyEquipped).reduce((acc, [key, value]) => {
              if (value) { // Ensure value exists before attempting to destructure
                const { Image, ...rest } = value; // Exclude the Image property
                acc[key] = rest; // Add the rest of the properties to the accumulator
              } else {
                acc[key] = value; // If value is null or undefined, just copy it as is
              }
              return acc;
            }, {}),
                    },
        };
        const response = await axios.post(`${apiUrl}/updateCustomKit`, payload);

        // Handle response here (e.g., updating state with response data, logging success)
        console.log(response.data); // Example action
      } catch (error) {
        // Handle error here (e.g., error notifications, logging)
        console.error('Failed to save progression:', error);
      }


    }
    setIsEditingMode(isEditing);
  };
  // UseEffect that detects hash changes. Currently, when a hash changes it means the user has clicked on "change" button in the custom kit modal
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const itemType = Object.keys(visIdConversion).find(key => visIdConversion[key] === hash);
    };

    // Add event listener
    window.addEventListener('hashchange', handleHashChange);
    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [objects]); // Dependency array includes 'objects' if it's expected to change
    useEffect(() => {
        // Calculate the total number of custom kits
        const totalCustomKits = objects.reduce((count, object) => 
        object.Type === "ArmorKitCustom" ? count + 1 : count, 0);

      // Assuming objects is the state that holds your ArmoryRowKits
      const processedObjects = objects.map(object => {
        if (object.Type === "ArmorKitCustom") {
          if (totalCustomKits !== customKitCount) {
            setCustomKitCount(totalCustomKits);
          }
        }
        return object;
      });
    
    }, [objects, currentlyEquipped]);
  // Add a dummy object to initialObjects if visId is 'armorkit'
  const modifiedInitialObjects = visId === 'armorkit' ? [...objects, { id: 'saveLoadout', Type: 'ArmorKit', name: 'Save Loadout', Rarity: "LegendaryCustom", IsCrossCore: true, currentlyEquipped: currentlyEquipped }] : objects;
  const [currentObjects, setCurrentObjects] = useState(modifiedInitialObjects);

  // Sends equip payload to the backend with the currently equipped items
  const sendEquip = async (gamerInfo, currentlyEquipped) => {
    if (currentlyEquipped.CurrentlyEquippedCore.GetInv === true) {
      currentlyEquipped.CurrentlyEquippedHelmet = null;
      currentlyEquipped.CurrentlyEquippedVisor = null;
      currentlyEquipped.CurrentlyEquippedGlove = null;
      currentlyEquipped.CurrentlyEquippedCoating = null;
      currentlyEquipped.CurrentlyEquippedLeftShoulderPad = null;
      currentlyEquipped.CurrentlyEquippedRightShoulderPad = null;
      currentlyEquipped.CurrentlyEquippedWristAttachment = null;
      currentlyEquipped.CurrentlyEquippedChestAttachment = null;
      currentlyEquipped.CurrentlyEquippedKneePad = null;
      currentlyEquipped.CurrentlyEquippedHipAttachment = null;
      currentlyEquipped.CurrentlyEquippedKit = null;
      currentlyEquipped.CurrentlyEquippedKitCustom = null;
      currentlyEquipped.CurrentlyEquippedArmorMythicFx = null;
      currentlyEquipped.CurrentlyEquippedArmorFx = null;
      currentlyEquipped.CurrentlyEquippedArmorEmblem = null;


    }
    const payload = {
      GamerInfo: gamerInfo,
      CurrentlyEquipped: currentlyEquipped
    };
    console.log("Sending equip payload to backend", payload)
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
    safelyEquipItem(object.currentlyEquipped.CurrentlyEquippedArmorEmblem, "ArmorEmblem");
    safelyEquipItem(object.currentlyEquipped.CurrentlyEquippedArmorFx, "ArmorFx");
    safelyEquipItem(object.currentlyEquipped.CurrentlyEquippedArmorMythicFx, "ArmorMythicFx");


    // Once all items are equipped, highlight the object
    
    setHighlightedItems(items => ({ ...items, armorthemeId: object.id }));
    resetHighlight(object.id, "ArmorTheme");
  
    object.isHighlighted = true;
  };

  const handleObjectClick = async (object) => {
    console.log("clicked object!!!!")
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
        dataToSend.CurrentlyEquippedCore = object;
        dataToSend.CurrentlyEquippedCore.GetInv = true;

        setHighlightedItems(items => ({ ...items, armorcoreId: object.id }));
        // Backend request
        const response = await sendEquip(gamerInfo, dataToSend);
        console.log("Received response from backend", response)
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
          const newHighlightedArmorFx = fullObjects.ArmoryRowFxs.find(fx => fx.CorePath === response.Themes[0].ArmorFxPath);
          const newHighlightedMythicFx = fullObjects.ArmoryRowMythicFxs.find(mythicfx => mythicfx.CorePath === response.Themes[0].MythicFxPath);
          if (newHighlightedArmorFx) {
            setHighlightedItems(items => ({ ...items, armorfxId: newHighlightedArmorFx.id }));
            resetHighlight(newHighlightedArmorFx.id, "ArmorFx");
            await onEquipItem(newHighlightedArmorFx);
          }
          if (newHighlightedMythicFx) {
            setHighlightedItems(items => ({ ...items, armormythicfxId: newHighlightedMythicFx.id }));
            resetHighlight(newHighlightedMythicFx.id, "ArmorMythicFx");
            await onEquipItem(newHighlightedMythicFx);
          }
          if (newHighlightedCore) {
            setHighlightedItems(items => ({ ...items, armorcoreId: object.id }));
            resetHighlight(newHighlightedCore.id, "ArmorCore");
            await onEquipItem(newHighlightedCore); // Call the handler when an item is clicked

          }
          if (newHighlightedHelmet) {
            setHighlightedItems(items => ({ ...items, armorhelmetId: object.id }));
            resetHighlight(newHighlightedHelmet.id, "ArmorHelmet");
            await onEquipItem(newHighlightedHelmet); // Call the handler when an item is clicked

          }
          if (newHighlightedVisor) {
            setHighlightedItems(items => ({ ...items, armorvisorId: object.id }));
            resetHighlight(newHighlightedVisor.id, "ArmorVisor");
            await onEquipItem(newHighlightedVisor);

          }
          if (newHighlightedGlove) {
            setHighlightedItems(items => ({ ...items, armorgloveId: object.id }));
            resetHighlight(newHighlightedGlove.id, "ArmorGlove");
            await onEquipItem(newHighlightedGlove);
          }
          if (newHighlightedCoating) {
            setHighlightedItems(items => ({ ...items, armorcoatingId: object.id }));
            resetHighlight(newHighlightedCoating.id, "ArmorCoating");
            await onEquipItem(newHighlightedCoating);
          }
          if (newHighlightedLeftShoulderPad) {
            setHighlightedItems(items => ({ ...items, armorleftshoulderpadId: object.id }));
            resetHighlight(newHighlightedLeftShoulderPad.id, "ArmorLeftShoulderPad");
            await onEquipItem(newHighlightedLeftShoulderPad);
          }
          if (newHighlightedRightShoulderPad) {
            setHighlightedItems(items => ({ ...items, armorrightshoulderpadId: object.id }));
            resetHighlight(newHighlightedRightShoulderPad.id, "ArmorRightShoulderPad");
            await onEquipItem(newHighlightedRightShoulderPad);
          }
          if (newHighlightedWristAttachment) {
            setHighlightedItems(items => ({ ...items, armorwristattachmentId: object.id }));
            resetHighlight(newHighlightedWristAttachment.id, "ArmorWristAttachment");
            await onEquipItem(newHighlightedWristAttachment);
          }
          if (newHighlightedHipAttachment) {
            setHighlightedItems(items => ({ ...items, armorhipattachmentId: object.id }));
            resetHighlight(newHighlightedHipAttachment.id, "ArmorHipAttachment");
            await onEquipItem(newHighlightedHipAttachment);
          }
          if (newHighlightedChestAttachment) {
            setHighlightedItems(items => ({ ...items, armorchestattachmentId: object.id }));
            resetHighlight(newHighlightedChestAttachment.id, "ArmorChestAttachment");
            await onEquipItem(newHighlightedChestAttachment);
          }
          if (newHighlightedKneePad) {
            setHighlightedItems(items => ({ ...items, armorkneepadId: object.id }));
            resetHighlight(newHighlightedKneePad.id, "ArmorKneePad");
            await onEquipItem(newHighlightedKneePad);
          }
        }

      } else if (object.Type === "ArmorVisor") {
        dataToSend.CurrentlyEquippedCore.GetInv = false;
        dataToSend.CurrentlyEquippedVisor = object;
        await sendEquip(gamerInfo, dataToSend);
        resetHighlight(object.id, object.Type);
        setHighlightedItems(items => ({ ...items, armorvisorId: object.id }));
      } else if (object.Type === "ArmorGlove") {
        dataToSend.CurrentlyEquippedCore.GetInv = false;
        dataToSend.CurrentlyEquippedGlove = object;
        await sendEquip(gamerInfo, dataToSend);
        resetHighlight(object.id, object.Type);
        setHighlightedItems(items => ({ ...items, armorgloveId: object.id }));
      } else if (object.Type === "ArmorCoating") {
        dataToSend.CurrentlyEquippedCore.GetInv = false;
        dataToSend.currentlyEquippedCoating = object;
        await sendEquip(gamerInfo, dataToSend);
        resetHighlight(object.id, object.Type);
        setHighlightedItems(items => ({ ...items, armorcoatingId: object.id }));
      } else if (object.Type === "ArmorLeftShoulderPad") {
        dataToSend.CurrentlyEquippedCore.GetInv = false;
        dataToSend.CurrentlyEquippedLeftShoulderPad = object;
        await sendEquip(gamerInfo, dataToSend);
        resetHighlight(object.id, object.Type);
        setHighlightedItems(items => ({ ...items, armorleftshoulderpadId: object.id }));
      } else if (object.Type === "ArmorRightShoulderPad") {
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
      else if (object.Type === "ArmorMythicFx") {
        dataToSend.CurrentlyEquippedCore.GetInv = false;
        dataToSend.CurrentlyEquippedArmorMythicFx = object;
        await sendEquip(gamerInfo, dataToSend);
        resetHighlight(object.id, object.Type);
        setHighlightedItems(items => ({ ...items, armormythicfxId: object.id }));
      }
      else if (object.Type === "ArmorFx") {
        dataToSend.CurrentlyEquippedCore.GetInv = false;
        dataToSend.CurrentlyEquippedArmorFx = object;
        await sendEquip(gamerInfo, dataToSend);
        resetHighlight(object.id, object.Type);
        setHighlightedItems(items => ({ ...items, armorfxId: object.id }));
      }
      else if (object.Type === "ArmorEmblem") {
        dataToSend.CurrentlyEquippedCore.GetInv = false;
        dataToSend.CurrentlyEquippedArmorEmblem = object;
        await sendEquip(gamerInfo, dataToSend);
        resetHighlight(object.id, object.Type);
        setHighlightedItems(items => ({ ...items, armoremblemId: object.id }));
      }


    }
  };
  const handleCustomKit = async (object) => {
    if (currentlyEquipped && currentlyEquipped.CurrentlyEquippedCore && object.id === 'saveLoadout') {
      setCustomKitCount(customKitCount + 1); // Increment the counter
      object.isHighlighted = true;

      // Sends newly equipped item back to parent Component
      onEquipItem(object);

      const uniqueId = `saveLoadout-${new Date().getTime()}`;
      const newKitName = `[${customKitCount + 1}] New Loadout`; // Use the new count for naming
      const newDummyObject = {
        id: uniqueId,
        Type: 'ArmorKitCustom',
        Rarity: 'LegendaryCustom',
        name: newKitName,
        IsCrossCore: true,
        ImageType: "ArmorHelmet",
        Image: currentlyEquipped.CurrentlyEquippedHelmet.Image,
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
      

      newDummyObject.currentlyEquipped = currentlyEquipped;
      // Send API Request
      // Use gamerInfo in the Axios POST request
      console.log("currently equipped is: ", currentlyEquipped)
      console.log("Sending dummy object: ", newDummyObject, " to backend")
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080'; // Fallback URL if the env variable is not set

        // Prepare the payload for API, excluding images from currentlyEquipped
        const payload = {
          gamerInfo,
          newDummyObject: {
            ...newDummyObject,
            currentlyEquipped: Object.entries(currentlyEquipped).reduce((acc, [key, value]) => {
              if (value === null) {
                // Handle the case when the value is null
                // For example, you might want to skip adding this entry
                // or set it to a default value
                acc[key] = {}; // Example: setting to an empty object as a default case
                return acc;
              }
              const { Image, ...rest } = value; // Exclude the Image property
              acc[key] = rest; // Add the rest of the properties to the accumulator
              return acc;
            }, {}),
          },
        };
        await axios.post(`${apiUrl}/saveCustomKit`, payload);

      } catch (error) {
        // Handle error here (e.g., error notifications, logging)
        console.error('Failed to save progression:', error);
      }
    }
  };

  const handleImageChange = (objectId, newImage) => {
    setCurrentObjects(currentObjects.map(obj =>
      obj.id === objectId ? { ...obj, Image: newImage } : obj
    ));
  };
  const handleRemoveCard = async (idToRemove) => {
    setCurrentObjects(currentObjects.filter(obj => obj.id !== idToRemove));
    let removedItem = fullObjects.ArmoryRowKits.filter(obj => obj.id !== idToRemove);
    fullObjects.ArmoryRowKits = removedItem;

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080'; // Fallback URL if the env variable is not set
      const payload = {
        gamerInfo,
        idToRemove
      };
      await axios.post(`${apiUrl}/deleteCustomKit`, payload);

    } catch (error) {
      // Handle error here (e.g., error notifications, logging)
      console.error('Failed to save progression:', error);
    }

  };

  // Decide which function to use on object click
  const onObjectClick = (object) => {
    if (object.Type === 'ArmorKit' && (typeof object.id === 'string' &&  object.id.startsWith('saveLoadout'))) {
      handleCustomKit(object);
    } else {
      handleObjectClick(object);
    }
  };

  const onClickCustomKit = (object) => {
    console.log("Click custom kit")
    setCurrentlyEquipped(object.currentlyEquipped);
    handleSendingCustomKit(object);
    resetHighlight(object.id, "ArmorKitCustom");
    setHighlightedItems(items => ({ ...items, armorthemeId: object.id }));

    console.log("Set highlight: ", fullObjects)
  }
  const handleObjectNameChange = (objectId, newName) => {
    setCurrentObjects(currentObjects.map(obj =>
      obj.id === objectId ? { ...obj, name: newName } : obj
    ));
  };

  // First, ensure that the 'objects' array is not empty before trying to access its elements
  const highlightedObject = objects.length > 0 ? objects.find(obj => {
    // Check if the object type is 'ArmorKitCustom'
    if (obj.Type === "ArmorKitCustom") {
      // If so, search for a matching 'ArmorTheme' ID in 'highlightedItems'
      return highlightedItems["armorthemeId"] && highlightedItems["armorthemeId"] === obj.id;
    } else {
      // For other types, proceed as before
      const key = `${obj.Type.toLowerCase()}Id`;
      return highlightedItems[key] && highlightedItems[key] === obj.id;
    }
  }) : undefined;
  // Similarly, for highlightedId, check if objects array is not empty
  const highlightedId = objects.length > 0 ? highlightedItems[`${objects[0].Type.toLowerCase()}Id`] : undefined;
  const sharedProps = {
    setTempHighlightId: setTempHighlightId,
    tempHighlightId: tempHighlightId,
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
    editingObjectId: editingObjectId,
    editingObject: editingObject,
    customKitCount: customKitCount,
    setCustomKitCount: setCustomKitCount,
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
  );
};


function renderEditingDetails(handleEditingChange, sharedProps, editingObject) {
  const kitIsFullyEquipped = isKitFullyEquipped(editingObject.currentlyEquipped, sharedProps.currentlyEquipped);
  console.log(editingObject.currentlyEquipped)
  return (
    <div className="editing-details">
      <div className="subheader-container-edit">
        <svg className="diamond-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22.92 22.92">
          <path className="cls-1" d="M11.46,0L0,11.46l11.46,11.46,11.46-11.46L11.46,0ZM3.41,11.46L11.46,3.41l8.05,8.05-8.05,8.05L3.41,11.46Z" />
          <rect className="cls-1" x="8.16" y="8.16" width="6.59" height="6.59" transform="translate(-4.75 11.46) rotate(-45)" />
        </svg>

        <h1 className="spartan-subheader-home">Custom Armor Kit</h1>
      </div>

      <div className="scrollable-container">

        {Object.values(editingObject.currentlyEquipped).map(item =>
          item && item.CorePath ? renderEquippedItem(handleEditingChange, item, {
            ...sharedProps,
            isHighlighted: kitIsFullyEquipped // Pass this as part of the sharedProps or directly to the component
          }, editingObject.id) : null
        )}
      </div>
    </div>
  );
}
function renderEquippedItem(handleEditingChange, item, sharedProps, parentID) {
  const handleButtonClick = (item) => {
    handleEditingChange(false);
    const visId = visIdConversion[item.Type];
    if (visId) {
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
  } else {
    isHighlighted = true;
  }
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
