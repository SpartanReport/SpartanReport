import { useEffect, useRef } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from './authConfig';

const useAutoRenewToken = () => {
    const { instance, accounts } = useMsal();
    // Use a ref to track the renewal timer setup
    const renewalTimerSetup = useRef(false);

    useEffect(() => {
        const renewToken = async () => {
            if (accounts.length > 0) {
                const silentRequest = {
                    ...loginRequest,
                    account: accounts[0],
                };

                try {
                    const response = await instance.acquireTokenSilent(silentRequest);
                    console.log("Token renewed silently", response.accessToken);
                    // Schedule the next renewal
                    scheduleTokenRenewal(response.expiresOn);
                } catch (error) {
                    console.error("Error renewing token silently", error);
                    // Handle fallback or error (e.g., show login prompt)
                }
            }
        };

        const scheduleTokenRenewal = (expiresOn) => {
            if (renewalTimerSetup.current) {
                // Exit if we've already set up the renewal timer
                return;
            }
            const now = new Date();
            const expirationTime = new Date(expiresOn * 1000); // assumes expiresOn is in seconds
            const timeUntilExpiration = expirationTime.getTime() - now.getTime();
            const offsetBeforeExpiration = 5 * 60 * 1000; // Renew 5 minutes before expiration

            if (timeUntilExpiration > offsetBeforeExpiration) {
                // Only set timeout if the expiration is further away than the offset
                setTimeout(renewToken, timeUntilExpiration - offsetBeforeExpiration);
                renewalTimerSetup.current = true; // Mark that the renewal timer has been set up
            } else {
                // Consider immediate renewal or handling for already expired/near expiration tokens
                console.log("Token is already near expiration or expired, consider renewing immediately or handling accordingly.");
            }
        };

        // Only attempt to renew token if we haven't set up a timer yet
        if (!renewalTimerSetup.current) {
            renewToken(); // Initial call to renew the token
        }

        // Cleanup function to reset the renewal setup flag when the component unmounts or accounts change
        return () => {
            renewalTimerSetup.current = false;
        };
    }, [accounts, instance]); // Consider if dependencies are correct for your use case

    // No return statement is needed unless you want to expose something specific
};

export default useAutoRenewToken;
