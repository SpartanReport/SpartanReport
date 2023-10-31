import { useState } from 'react';
import axios from 'axios';

const useFetchSpartanRank = (gamerInfo) => {
    const [spartanRank, setSpartanRank] = useState(null);
    const [isFetched, setIsFetched] = useState(false);
  
    const fetchSpartanRank = async (force = false) => {
      if (isFetched && !force) return;
  
      try {
        const response = await axios.post('http://localhost:8080/ranking', gamerInfo);
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
  