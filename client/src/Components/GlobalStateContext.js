// CurrentlyEquippedContext.js
import React, { createContext, useContext, useState } from 'react';

const CurrentlyEquippedContext = createContext();

export const useCurrentlyEquipped = () => useContext(CurrentlyEquippedContext);

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
    });

    return (
        <CurrentlyEquippedContext.Provider value={{ currentlyEquipped, setCurrentlyEquipped }}>
            {children}
        </CurrentlyEquippedContext.Provider>
    );
};
