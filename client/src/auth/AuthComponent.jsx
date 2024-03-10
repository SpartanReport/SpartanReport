import { useMsal } from '@azure/msal-react';
import { loginRequest } from './authConfig';
import axios from 'axios';
import { useAuth } from '../Components/GlobalStateContext'; // Adjust the import path as needed

const useStartAuth = () => {
    const { instance, accounts } = useMsal();
    const { setIsAuthenticated } = useAuth(); // Destructure setIsAuthenticated

    const getToken = async () => {
        const silentRequest = {
            ...loginRequest,
            account: accounts[0] // Make sure to pick the correct account from the accounts array
        };

        try {
            // Attempt to acquire token silently
            const response = await instance.acquireTokenSilent(silentRequest);
            console.log("Silently acquired token:", response.accessToken);
            return response.accessToken;
        } catch (error) {
            console.error('Silent token acquisition failed, acquiring token using popup', error);
            // Fallback to interactive method if silent acquisition fails
            const response = await instance.acquireTokenPopup(loginRequest);
            console.log("Interactively acquired token:", response.accessToken);
            return response.accessToken;
        }
    };

    const startAuth = () => {
        getToken().then(async token => {
            let resp;
            try {
                const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
                resp = await axios.post(`${apiUrl}/startAuth`, { token: token });
            } catch (error) {
                console.error('Failed to save progression:', error);
            }
            console.log("resp: ", resp);
            localStorage.setItem('gamerInfo', JSON.stringify(resp.data));
            setIsAuthenticated(true);


        }).catch(e => {
            console.error(e);
            setIsAuthenticated(false);

        });
    };

    return startAuth;
};

export default useStartAuth;
