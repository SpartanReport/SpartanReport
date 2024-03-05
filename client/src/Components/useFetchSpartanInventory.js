import { useState } from 'react';
import axios from 'axios';
import { useCurrentlyEquipped } from './GlobalStateContext';
const customConversion = {
  "ArmorChestAttachment": "ArmoryRowChestAttachments",
  "ArmorCoating": "ArmoryRowCoatings",
  "ArmorCore": "ArmoryRow",
  "ArmorHelmet": "ArmoryRowHelmets",
  "ArmorKit": "ArmoryRowKits",
  "ArmorVisor": "ArmoryRowVisors",
  "ArmorGlove": "ArmoryRowGloves",
  "ArmorLeftShoulderPad": "ArmoryRowLeftShoulderPads",
  "ArmorRightShoulderPad": "ArmoryRowRightShoulderPads",
  "ArmorWristAttachment": "ArmoryRowWristAttachments",
  "ArmorHipAttachment": "ArmoryRowHipAttachments",
  "ArmorKneePad": "ArmoryRowKneePads",
};


const useFetchSpartanInventory = (gamerInfo, includeArmory = false, setHighlightedItems = null) => {
  const [isLoading, setIsLoading] = useState(true);
  const [spartanInventory, setSpartanInventory] = useState(null);
  const [isFetched, setIsFetched] = useState(false);
  const [armoryRow, setArmoryRow] = useState(null); // State for ArmoryRow data
  const { currentlyEquipped, setCurrentlyEquipped } = useCurrentlyEquipped();
  const fetchSpartanInventory = async (force = false) => {
    if (isFetched && !force) return;
  
    try {
      const queryParams = includeArmory ? '?includeArmory=true' : '';
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const storedGamerInfo = localStorage.getItem('gamerInfo');
      const parsedGamerInfo = JSON.parse(storedGamerInfo);
      const response = await axios.post(`${apiUrl}/spartan${queryParams}`, storedGamerInfo);

      if (response.data.GamerInfo){
        if (storedGamerInfo) {
          localStorage.setItem('isSignedIn', "true");
          if (response.data.GamerInfo.spartankey === ""){
            console.log("No spartankey, logging out")
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
            const storedGamerInfo = localStorage.getItem('gamerInfo');
            const parsedGamerInfo = JSON.parse(storedGamerInfo);
            await axios.post(`${apiUrl}/logout`, parsedGamerInfo);
            localStorage.clear();
            window.location.href = `${apiUrl}/`;
            return
    
            
          }
          if (response.data.GamerInfo.spartankey !== parsedGamerInfo.spartankey){
            console.log("New GamerInfo!")
            localStorage.setItem('gamerInfo', JSON.stringify(response.data.GamerInfo));
          }
        }    
      }
      setSpartanInventory(response.data.PlayerInventory[0]);
      if (includeArmory) {
        const equippedData = response.data.CurrentlyEquipped;
        console.log("Setting current equip")
        setCurrentlyEquipped({
          CurrentlyEquippedCore: equippedData.CurrentlyEquippedCore,
          CurrentlyEquippedHelmet: equippedData.CurrentlyEquippedHelmet,
          CurrentlyEquippedGlove: equippedData.CurrentlyEquippedGlove,
          CurrentlyEquippedVisor: equippedData.CurrentlyEquippedVisor,
          CurrentlyEquippedCoating: equippedData.CurrentlyEquippedCoating,
          CurrentlyEquippedLeftShoulderPad: equippedData.CurrentlyEquippedLeftShoulderPad,
          CurrentlyEquippedRightShoulderPad: equippedData.CurrentlyEquippedRightShoulderPad,
          CurrentlyEquippedWristAttachment: equippedData.CurrentlyEquippedWristAttachment,
          CurrentlyEquippedHipAttachment: equippedData.CurrentlyEquippedHipAttachment,
          CurrentlyEquippedChestAttachment: equippedData.CurrentlyEquippedChestAttachment,
          CurrentlyEquippedKneePad: equippedData.CurrentlyEquippedKneePad,
          CurrentlyEquippedArmorKit: equippedData.CurrentlyEquippedKit,

        });
  
        // Set initial highlightedId here
        const initialCoreHighlight = response.data.ArmoryRow.find(obj => obj.isHighlighted);
        const initialHelmetHighlight = response.data.ArmoryRowHelmets.find(obj => obj.isHighlighted);
        const initialVisorHighlight = response.data.ArmoryRowVisors.find(obj => obj.isHighlighted);
        const initialGloveHighlight = response.data.ArmoryRowGloves.find(obj => obj.isHighlighted);
        const initialCoatingHighlight = response.data.ArmoryRowCoatings.find(obj => obj.isHighlighted);
        const initialLeftShoulderPadHighlight = response.data.ArmoryRowLeftShoulderPads.find(obj => obj.isHighlighted);
        const initialRightShoulderPadHighlight = response.data.ArmoryRowRightShoulderPads.find(obj => obj.isHighlighted);
        const initialWristAttachmentHighlight = response.data.ArmoryRowWristAttachments.find(obj => obj.isHighlighted);
        const initialHipAttachmentHighlight = response.data.ArmoryRowHipAttachments.find(obj => obj.isHighlighted);
        const initialChestAttachmentHighlight = response.data.ArmoryRowChestAttachments.find(obj => obj.isHighlighted);
        const initialKneePadHighlight = response.data.ArmoryRowKneePads.find(obj => obj.isHighlighted);
        const initialArmorKitHighlight = response.data.ArmoryRowKits.find(obj => obj.isHighlighted);


        if (initialCoreHighlight) {
          setHighlightedItems(items => ({ ...items, armorcoreId: initialCoreHighlight.id }));
        }
        if (initialHelmetHighlight) {
          setHighlightedItems(items => ({ ...items, armorhelmetId: initialHelmetHighlight.id }));
        }
        if (initialVisorHighlight) {
          setHighlightedItems(items => ({ ...items, armorvisorId: initialVisorHighlight.id }));
        }
        if (initialGloveHighlight) {
          setHighlightedItems(items => ({ ...items, armorgloveId: initialGloveHighlight.id }));
        }
        if (initialCoatingHighlight) {
          setHighlightedItems(items => ({ ...items, armorcoatingId: initialCoatingHighlight.id }));
        }
        if (initialLeftShoulderPadHighlight){
          setHighlightedItems(items => ({ ...items, armorleftshoulderpadId: initialLeftShoulderPadHighlight.id }));

        }
        if (initialRightShoulderPadHighlight){
          setHighlightedItems(items => ({ ...items, armorrightshoulderpadId: initialRightShoulderPadHighlight.id }));

        }
        if (initialWristAttachmentHighlight){
          setHighlightedItems(items => ({ ...items, armorwristattachmentId: initialWristAttachmentHighlight.id }));

        }
        if (initialHipAttachmentHighlight){
          setHighlightedItems(items => ({ ...items, armorhipattachmentId: initialHipAttachmentHighlight.id }));

        }
        if (initialChestAttachmentHighlight){
          setHighlightedItems(items => ({ ...items, armorchestattachmentId: initialChestAttachmentHighlight.id }));

        }
        if (initialKneePadHighlight){
          setHighlightedItems(items => ({ ...items, armorkneepadId: initialKneePadHighlight.id }));

        }
        if (initialArmorKitHighlight){
          setHighlightedItems(items => ({ ...items, armorthemeId: initialArmorKitHighlight.id }));

        }
        const customKits = await fetchCustomKit();
        console.log("Got custom kits: ", customKits);
        customKits.forEach((kit) => {
          // Check currentlyEquipped, and for each item in there, grab the image from the response.data.CorrespondingArmoryRow
          let KitItems = kit.currentlyEquipped;
          // Loop through each kit item
          console.log(KitItems)
          // Kit Items is an Object arary, loop through and print out each item
          Object.keys(KitItems).forEach((key) => {
            console.log("item type: ", KitItems[key].Type)
            let row = customConversion[KitItems[key].Type]
            // row is now a string. search for response.data.row for the item with the id of key.Id, when found, set the image of the item to the image of the item in the response.data.row
            console.log("Row: ", row)
            if (row === undefined){
              return
            }
            if (response.data.hasOwnProperty(row)) {
              // Access the specific object using the row key and find the item
              let items = response.data[row]; // Access the array of items within the specified object
              console.log("Items: ", items)
              // loop through items
              items.forEach((item) => {
                if (item.id === KitItems[key].id) {
                  console.log("Found item: ", item)
                  KitItems[key].Image = item.Image;
                  if (kit.ImageType == item.Type){

                    kit.Image = item.Image;
                  
                  }
                }
              });
            }
          });
        });

        // Ensure ArmoryRowKits is an array and append customKits to it
        if (Array.isArray(response.data.ArmoryRowKits) || customKits.length > 0) {
          response.data.ArmoryRowKits = [...response.data.ArmoryRowKits, ...customKits];
        } else {
          // Handle the case where ArmoryRowKits is not an array or undefined
          response.data.ArmoryRowKits = customKits;
        }
    
        // Now, the response.data includes the updated ArmoryRowKits
        console.log(response.data.ArmoryRowKits);
        setArmoryRow(response.data);
      }
  
      setIsLoading(false);
      setIsFetched(true);
    } catch (error) {
      if (error.response && error.response.status === 403) {
        // Handle the 403 Forbidden status code
        console.error("Forbidden: ", error.response.data);
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
        const storedGamerInfo = localStorage.getItem('gamerInfo');
        const gamerInfo = JSON.parse(storedGamerInfo);
        console.log("Got gamerinfo: ", gamerInfo)
        localStorage.clear();
        window.location.href = `${apiUrl}/`;

        await axios.get(`${apiUrl}/logout`, gamerInfo);
        return

      }
      console.error("Error fetching Spartan inventory:", error);
      setIsLoading(false);
    }
  };

  const fetchCustomKit = async () => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    try {
      const storedGamerInfo = localStorage.getItem('gamerInfo');
      const gamerInfo = JSON.parse(storedGamerInfo || '{}'); // Ensure this is an object
  
      const response = await axios.post(`${apiUrl}/getCustomKit`, gamerInfo, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      // Safely access .data ensuring it exists and defaults to an empty object if not
      const data = response.data || [];
  
      // Check if data is an array and has at least one element
      if (Array.isArray(data) && data.length > 0) {
        return data[0].loadouts || [];
      }
      return [];
    } catch (error) {
      console.error("Error fetching custom kits:", error);
      return [];
    }
  };
  
  
  return { spartanInventory, armoryRow, setArmoryRow, isLoading, fetchSpartanInventory };
};

export default useFetchSpartanInventory;
