import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Include gamerInfo in the function signature
const Spartan = ({ gamerInfo }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [spartanInventory, setSpartanInventory] = useState(null);

  useEffect(() => {
    const fetchSpartanInventory = async () => {
      try {
        // Use gamerInfo.spartanKey in the Axios request
        const response = await axios.get('http://localhost:8080/spartan', {
          headers: {
            'SpartanKey': gamerInfo.spartanKey,
          },
        });

        console.log(response.data);
        setSpartanInventory(response.data);
      } catch (error) {
        console.error("Error fetching Spartan inventory:", error);
      }
      setIsLoading(false);
    };

    fetchSpartanInventory();
  }, [gamerInfo.spartanKey]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Spartan Inventory</h1>
      <h2>Current Spartan Armor</h2>
      <ul>
        {spartanInventory.playerInventory.ArmorCores.ArmorCores.map((core, index) => (
          <li key={index}>
            Core Path: {core.CorePath}, Is Equipped: {core.IsEquipped ? 'Yes' : 'No'}, Core ID: {core.CoreId}, Core Type: {core.CoreType}
            <ul>
              {core.Themes.map((theme, index) => (
                <li key={index}>
                  <strong>Theme:</strong>
                  <ul>
                    <li>First Modified Date: {theme.FirstModifiedDateUtc.ISO8601Date}</li>
                    <li>Last Modified Date: {theme.LastModifiedDateUtc.ISO8601Date}</li>
                    <li>Is Equipped: {theme.IsEquipped ? 'Yes' : 'No'}</li>
                    <li>Is Default: {theme.IsDefault ? 'Yes' : 'No'}</li>
                    <li>Theme Path: {theme.ThemePath}</li>
                    <li>Coating Path: {theme.CoatingPath}</li>
                    <li>Glove Path: {theme.GlovePath}</li>
                    <li>Helmet Path: {theme.HelmetPath}</li>
                    <li>Helmet Attachment Path: {theme.HelmetAttachmentPath}</li>
                    <li>Chest Attachment Path: {theme.ChestAttachmentPath}</li>
                    <li>Knee Pad Path: {theme.KneePadPath}</li>
                    <li>Left Shoulder Pad Path: {theme.LeftShoulderPadPath}</li>
                    <li>Right Shoulder Pad Path: {theme.RightShoulderPadPath}</li>
                    <li>Armor Fx Path: {theme.ArmorFxPath}</li>
                    <li>Mythic Fx Path: {theme.MythicFxPath}</li>
                    <li>Visor Path: {theme.VisorPath}</li>
                    <li>Hip Attachment Path: {theme.HipAttachmentPath}</li>
                    <li>Wrist Attachment Path: {theme.WristAttachmentPath}</li>
                  </ul>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <h2>Spartan Body</h2>
      <p>Body Type: {spartanInventory.playerInventory.SpartanBody.BodyType}</p>
      <h2>Appearance</h2>
      <p>Service Tag: {spartanInventory.playerInventory.Appearance.ServiceTag}</p>
      <h2>Weapon Cores</h2>
      <ul>
        {spartanInventory.playerInventory.WeaponCores.WeaponCores.map((core, index) => (
          <li key={index}>Core ID: {core.CoreId}, Core Type: {core.CoreType}</li>
        ))}
      </ul>
      <h2>AI Cores</h2>
      <ul>
        {spartanInventory.playerInventory.AiCores.AiCores.map((core, index) => (
          <li key={index}>Core ID: {core.CoreId}, Core Type: {core.CoreType}</li>
        ))}
      </ul>
      <h2>Vehicle Cores</h2>
      <ul>
        {spartanInventory.playerInventory.VehicleCores.VehicleCores.map((core, index) => (
          <li key={index}>Core ID: {core.CoreId}, Core Type: {core.CoreType}</li>
        ))}
      </ul>
    </div>
  );
};

export default Spartan;