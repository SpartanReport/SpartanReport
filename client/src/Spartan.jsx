import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useFetchSpartanInventory from './useFetchSpartanInventory';

// Include gamerInfo in the function signature
const Spartan = ({ gamerInfo}) => {
  // Function to convert byte array to Base64

    const [spartanInventory,isLoading,fetchSpartanInventory] = useFetchSpartanInventory(gamerInfo)
    useEffect(() => {
      fetchSpartanInventory();
    }, []);  // Empty dependency array, so it only runs once after the initial render
    // Letttsss not make microsoft angry... for now
        /* Set up the interval to fetch data every 5 seconds
        const intervalId = setInterval(() => {
          fetchSpartanInventory();
        }, 5000);

        // Clear the interval when the component unmounts
        return () => clearInterval(intervalId);
        */
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!spartanInventory) {
    return <div>No Spartan Inventory Data</div>;
  }

  const coreDetails = spartanInventory.CoreDetails;
  const base64ImageData = spartanInventory.CoreDetails.CommonData.ImageData;
  const imageSrc = `data:image/png;base64,${base64ImageData}`;
  return (
    <div className="card">
      <div className="card-header">
        <h1>Spartan Inventory</h1>
      </div>
      <div>
          <h2>Core Details</h2>
          <p>ID: {coreDetails.CommonData.Id}</p>
          <p>Title: {coreDetails.CommonData.Title.value}</p>
          <p>Description: {coreDetails.CommonData.Description.value}</p>
          <img src={imageSrc} alt="Spartan Core" />
        </div>
      <div className="card-body">
        <h2 className="card-title">Current Spartan Armor</h2>      <ul>
        {spartanInventory.ArmorCores.ArmorCores.map((core, index) => (
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
      <p>Body Type: {spartanInventory.SpartanBody.BodyType}</p>
      <h2>Appearance</h2>
      <p>Service Tag: {spartanInventory.Appearance.ServiceTag}</p>
      <h2>Weapon Cores</h2>
      <ul>
        {spartanInventory.WeaponCores.WeaponCores.map((core, index) => (
          <li key={index}>Core ID: {core.CoreId}, Core Type: {core.CoreType}</li>
        ))}
      </ul>
      <h2>AI Cores</h2>
      <ul>
        {spartanInventory.AiCores.AiCores.map((core, index) => (
          <li key={index}>Core ID: {core.CoreId}, Core Type: {core.CoreType}</li>
        ))}
      </ul>
      <h2>Vehicle Cores</h2>
      <ul>
        {spartanInventory.VehicleCores.VehicleCores.map((core, index) => (
          <li key={index}>Core ID: {core.CoreId}, Core Type: {core.CoreType}</li>
        ))}
      </ul>
    </div>
    </div>
  );
};

export default Spartan;