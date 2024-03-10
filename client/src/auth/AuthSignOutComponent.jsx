import { useMsal } from '@azure/msal-react';
import { useAuth } from '../Components/GlobalStateContext'; // Adjust the import path as needed

const useSignOut = () => {
    const { instance } = useMsal();
    const { setIsAuthenticated } = useAuth(); // Destructure setIsAuthenticated

    const signOut = () => {
        // Optional: Clear any application-specific storage or state
        localStorage.removeItem('gamerInfo'); // For example, clearing local storage item
        // More cleanup actions can be performed here

        // Sign out using MSAL
        const logoutRequest = {
            // You can specify post logout redirect uri after signing out if necessary
            postLogoutRedirectUri: "/", // Adjust according to your app's routing
            // Optionally, specify which account to log out
            account: instance.getAllAccounts()[0] // If multiple accounts, ensure to select the correct one
        };

        instance.logoutPopup(logoutRequest).then(()=>{
            window.location.assign('/');
        }).catch(e => {
            console.error('Logout failed', e);
        });

        // Update application state to reflect that the user is no longer authenticated
        setIsAuthenticated(false);
        
    };

    return signOut;
};

export default useSignOut;