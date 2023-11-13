import { useState, useEffect } from 'react';
import axios from 'axios';

function useFetchChallengeDeck(gamerInfo) {
  const [challengeDeck, setChallengeDeck] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080'; // Fallback URL if the env variable is not set
        const response = await axios.post(`${apiUrl}/challengedeck`, gamerInfo);
        setChallengeDeck(response.data);
        console.log("Challenge Deck!")
      } catch (err) {
        setError(err);
        console.log("Challenge Deck Error: ", err)

      } finally {
        setIsLoading(false);
      }
    };

    if (gamerInfo) {
      fetchData();
    }
  }, [gamerInfo]);

  return [challengeDeck, isLoading, error];
}

export default useFetchChallengeDeck;
