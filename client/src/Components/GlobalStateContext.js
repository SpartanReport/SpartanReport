// CurrentlyEquippedContext.js
import React, { createContext, useContext, useState } from 'react';

const CurrentlyEquippedContext = createContext();
const AuthContext = createContext();

export const useCurrentlyEquipped = () => useContext(CurrentlyEquippedContext);
export const useAuth = () => useContext(AuthContext);

export const CurrentlyEquippedProvider = ({ children }) => {
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
        CurrentlyEquippedChestAttachment: null,
        CurrentlyEquippedArmorKit: null,
        CurrentlyEquippedArmorMythicFx: null,
        CurrentlyEquippedArmorFx: null,
        CurrentlyEquippedArmorEmblem: null,

    });
    const [isAuthenticated, setIsAuthenticated] = useState(false);
        return (
        <CurrentlyEquippedContext.Provider value={{ currentlyEquipped, setCurrentlyEquipped }}>
            <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}> 
                {children}
            </AuthContext.Provider>
        </CurrentlyEquippedContext.Provider>
    );
};
