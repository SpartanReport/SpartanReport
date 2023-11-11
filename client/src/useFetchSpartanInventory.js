import { useState } from 'react';
import axios from 'axios';

const useFetchSpartanInventory = (gamerInfo, includeArmory = false, setHighlightedCoreId= null ,setHighlightedHelmetId = null) => {
    const [isLoading, setIsLoading] = useState(true);
  const [spartanInventory, setSpartanInventory] = useState(null);
  const [isFetched, setIsFetched] = useState(false);
  const [armoryRow, setArmoryRow] = useState(null); // State for ArmoryRow data
  const [currentlyEquipped, setCurrentlyEquipped] = useState({
    CurrentlyEquippedCore: null,
    CurrentlyEquippedHelmet: null
  }); // Added state for CurrentlyEquipped
  const fetchSpartanInventory = async (force = false) => {
    if (isFetched && !force) return;
  
    try {
      const queryParams = includeArmory ? '?includeArmory=true' : '';
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const response = await axios.post(`${apiUrl}/spartan${queryParams}`, gamerInfo);
      console.log(response)
      setSpartanInventory(response.data.PlayerInventory[0]);
      if (includeArmory) {
        setArmoryRow(response.data);
        const equippedData = response.data.CurrentlyEquipped;
        setCurrentlyEquipped({
          CurrentlyEquippedCore: equippedData.CurrentlyEquippedCore,
          CurrentlyEquippedHelmet: equippedData.CurrentlyEquippedHelmet
        });
  
        // Set initial highlightedId here
        const initialCoreHighlight = response.data.ArmoryRow.find(obj => obj.isHighlighted);
        const initialHelmetHighlight = response.data.ArmoryRowHelmets.find(obj => obj.isHighlighted);
        if (initialCoreHighlight) {
          setHighlightedCoreId(initialCoreHighlight.id);
          
        }
        if (initialHelmetHighlight) {
          setHighlightedHelmetId(initialHelmetHighlight.id);
        }
      }
  
      setIsLoading(false);
      setIsFetched(true);
    } catch (error) {
      console.error("Error fetching Spartan inventory:", error);
      setIsLoading(false);
    }
  };
  

  return { spartanInventory, armoryRow, setArmoryRow, isLoading, fetchSpartanInventory, currentlyEquipped, setCurrentlyEquipped };
};

export default useFetchSpartanInventory;
