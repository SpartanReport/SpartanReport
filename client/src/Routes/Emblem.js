import React, { useState, useEffect } from 'react';
import '../Styles/header.css';
import useFetchSpartanInventory from "../Components/useFetchSpartanInventory";
import { useNavigate, useLocation } from 'react-router-dom';
function hexToRgb(hex) {
  // Remove the hash at the start if it's there
  hex = hex.charAt(0) === '#' ? hex.substr(1) : hex;

  // Parse out the r, g, b values
  let bigint = parseInt(hex, 16);
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;

  return `${r}, ${g}, ${b}`;
}
const Emblem = ({ gamerInfo }) => {
  const { spartanInventory, armoryRow,helmetRow, isLoading, fetchSpartanInventory } = useFetchSpartanInventory(gamerInfo);
  const [forceFetch, setForceFetch] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setForceFetch(true);
  }, [location]);

  useEffect(() => {
    if (gamerInfo && forceFetch) {
      fetchSpartanInventory(true);
      setForceFetch(false);
    }
  }, [gamerInfo, forceFetch]);

  useEffect(() => {
    if (spartanInventory && spartanInventory.EmblemColors) {
      const { primary, secondary, tertiary } = spartanInventory.EmblemColors;
      const primaryRgb = hexToRgb(primary);
      document.documentElement.style.setProperty('--primary-color', primary);
      document.documentElement.style.setProperty('--primary-color-rgb', primaryRgb);
      document.documentElement.style.setProperty('--secondary-color', secondary);
      document.documentElement.style.setProperty('--tertiary-color', tertiary);
    }
  }, [spartanInventory]);

  const renderImages = () => {
    if (!spartanInventory || !spartanInventory.EmblemInfo) {
      return null;
    }

    const base64emblemData = spartanInventory.EmblemInfo.EmblemImageData;
    const emblemSrc = `data:image/png;base64,${base64emblemData}`;
    const base64nameplatedata = spartanInventory.EmblemInfo.NameplateImageData;
    const nameplateSrc = `data:image/png;base64,${base64nameplatedata}`;

    return (
      <>
        <img className="base-image" src={nameplateSrc} alt="Spartan Core" />
        <img className="overlay-image" src={emblemSrc} alt="Spartan Emblem" />
      </>
    );
  };

  const serviceTag = spartanInventory?.Appearance?.ServiceTag;

  return (
      <header>
        <div className="image-container">
          {renderImages()}
          <p className="gamertag">{gamerInfo ? gamerInfo.gamertag : 'Loading...'}</p>
          <p className="servicetag">{gamerInfo ? serviceTag : 'Loading...' }</p>
        </div>
      </header>
  );
};

export default Emblem;
