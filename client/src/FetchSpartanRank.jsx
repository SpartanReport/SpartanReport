import { useState } from 'react';
import axios from 'axios';

const useFetchSpartanRank = (gamerInfo) => {
    const [spartanRank, setSpartanRank] = useState(null);
    const [isFetched, setIsFetched] = useState(false);
  
    const fetchSpartanRank = async (force = false) => {
      if (isFetched && !force) return;
  
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080'; // Fallback URL if the env variable is not set
        const response = await axios.post(`${apiUrl}/ranking`, gamerInfo);
        console.log(response.data);
        setSpartanRank(response.data);
        setIsFetched(true);
      } catch (error) {
        console.error("Error fetching Spartan Rank:", error);
      }
    };
  
    return [spartanRank, fetchSpartanRank];
  };
  
  export default useFetchSpartanRank;
  