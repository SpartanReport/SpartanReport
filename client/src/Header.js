import React, { useState, useEffect } from 'react';
import './header.css';
import useFetchSpartanInventory from "./useFetchSpartanInventory";
import { useNavigate, useLocation } from 'react-router-dom';

const Header = ({ gamerInfo }) => {
  const [spartanInventory, isLoading, fetchSpartanInventory] = useFetchSpartanInventory(gamerInfo);
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
      document.documentElement.style.setProperty('--primary-color', primary);
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
    <div className="header-wrapper">
      <header>
        <div className="image-container">
          {renderImages()}
          <p className="gamertag">{gamerInfo ? gamerInfo.gamertag : 'Loading...'}</p>
          <p className="servicetag">{gamerInfo ? serviceTag : 'Loading...' }</p>
        </div>
      </header>
    </div>
  );
};

export default Header;
