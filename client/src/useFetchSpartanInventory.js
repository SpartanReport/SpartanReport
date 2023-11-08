import { useState } from 'react';
import axios from 'axios';

const useFetchSpartanInventory = (gamerInfo, includeArmory = false) => {
  const [isLoading, setIsLoading] = useState(true);
  const [spartanInventory, setSpartanInventory] = useState(null);
  const [isFetched, setIsFetched] = useState(false);
  const [armoryRow, setArmoryRow] = useState(null); // State for ArmoryRow data

  const fetchSpartanInventory = async (force = false) => {
    if (isFetched && !force) return;

    try {
      const queryParams = includeArmory ? '?includeArmory=true' : '';
      const response = await axios.post(`http://localhost:8080/spartan${queryParams}`, gamerInfo);

      console.log(response);

      setSpartanInventory(response.data.PlayerInventory[0]);
      if (includeArmory) {
        setArmoryRow(response.data.ArmoryRow); // This will only be set if includeArmory is true
      }
      setIsLoading(false);
      setIsFetched(true); // Set the flag
    } catch (error) {
      console.error("Error fetching Spartan inventory:", error);
      setIsLoading(false);
    }
  };

  return { spartanInventory, armoryRow, isLoading, fetchSpartanInventory };
};

export default useFetchSpartanInventory;
