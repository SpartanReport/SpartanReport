import React from 'react';
import './footer.css';
import useFetchSpartanInventory from "./useFetchSpartanInventory";
import { useEffect } from "react";
import { useNavigate } from 'react-router-dom';  // <-- Import useNavigate

const Header = ({ gamerInfo }) => {
  const [spartanInventory, isLoading, fetchSpartanInventory] = useFetchSpartanInventory(gamerInfo);
  const navigate = useNavigate();  // <-- Use the useNavigate hook

  useEffect(() => {
    if (gamerInfo) {
      fetchSpartanInventory();
    }

    // Instead of listening to history, directly fetch data when a new route is clicked
    fetchSpartanInventory();

  }, [gamerInfo, fetchSpartanInventory]);  // <-- Removed history from the dependency array

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

  return (
    <div className="header-wrapper">
      <header>
        <div className="image-container">
          {renderImages()}
          <p className="gamertag">{gamerInfo ? gamerInfo.gamertag : 'Loading...'}</p>
        </div>
      </header>
    </div>
  );
};

export default Header;
