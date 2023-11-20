import { useState } from 'react';
import axios from 'axios';

const useFetchSpartanInventory = (gamerInfo, includeArmory = false, setHighlightedItems = null) => {
  const [isLoading, setIsLoading] = useState(true);
  const [spartanInventory, setSpartanInventory] = useState(null);
  const [isFetched, setIsFetched] = useState(false);
  const [armoryRow, setArmoryRow] = useState(null); // State for ArmoryRow data
  const [currentlyEquipped, setCurrentlyEquipped] = useState({
    CurrentlyEquippedCore: null,
    CurrentlyEquippedHelmet: null,
    CurrentlyEquippedVisor: null,
    CurrentlyEquippedGlove: null,
    CurrentlyEquippedCoating: null,
    CurrentlyEquippedLeftShoulderPad: null,
    CurrentlyEquippedRightShoulderPad: null,
    CurrentlyEquippedWristAttachment: null,
    CurrentlyEquippedHipAttachment: null,
    CurrentlyEquippedChestAttachment : null,
  }); // Added state for CurrentlyEquipped
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
        setArmoryRow(response.data);
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
      }
  
      setIsLoading(false);
      setIsFetched(true);
    } catch (error) {
      if (error.response && error.response.status === 403) {
        // Handle the 403 Forbidden status code
        console.error("Forbidden: ", error.response.data);
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
        const storedGamerInfo = localStorage.getItem('gamerInfo');
        const parsedGamerInfo = JSON.parse(storedGamerInfo);
        console.log("Got gamerinfo: ", parsedGamerInfo)
        await axios.post(`${apiUrl}/logout`, parsedGamerInfo);
        localStorage.clear();
        window.location.href = `${apiUrl}/`;
        return

      }
      console.error("Error fetching Spartan inventory:", error);
      setIsLoading(false);
    }
  };
  
  return { spartanInventory, armoryRow, setArmoryRow, isLoading, fetchSpartanInventory, currentlyEquipped, setCurrentlyEquipped };
};

export default useFetchSpartanInventory;
