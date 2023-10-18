import { useState } from 'react';
import axios from 'axios';

const useFetchSpartanInventory = (gamerInfo) => {
  const [isLoading, setIsLoading] = useState(true);
  const [spartanInventory, setSpartanInventory] = useState(null);
  const [isFetched, setIsFetched] = useState(false);

  const fetchSpartanInventory = async (force = false) => {
    if (isFetched && !force) return;

    try {
      const response = await axios.post('http://localhost:8080/spartan', gamerInfo);
      console.log("ImageData:", response.data.CoreDetails.CommonData.ImageData);
      console.log(response.data);
      setSpartanInventory(response.data);
      setIsLoading(false);
      setIsFetched(true); // Set the flag
    } catch (error) {
      console.error("Error fetching Spartan inventory:", error);
      setIsLoading(false);
    }
  };

  return [spartanInventory, isLoading, fetchSpartanInventory]; // Return the function as part of the array
};

export default useFetchSpartanInventory;
