import React, { useState, useEffect } from 'react';
import './ArmoryRow.css'; // Make sure to import your CSS file here

const ObjectCard = ({ object, isHighlighted, onClick }) => {
  const cardClassName = isHighlighted ? 'highlightedObjectCardRow' : 'objectCard';
  const base64ImageData = object.Image;
  const imageSrc = `data:image/png;base64,${base64ImageData}`;

  return (
    <div className={cardClassName} onClick={() => onClick(object)}>
      <p className='card-subheader'>{object.name}</p>
      <img src={imageSrc} alt="Spartan Core" className="ImageCard"/>

    </div>
  );
};

const HighlightedObjectCard = ({ object }) => {
  const base64ImageData = object.Image;
  const imageSrc = `data:image/png;base64,${base64ImageData}`;

  return (
    <div className="highlightedObjectCard">
      <p className='card-subheader'>{object.name}</p>
      <img src={imageSrc} alt="Spartan Core" className="HighlightedImageCard" />

    </div>
  );
};

const ObjectsDisplay = ({ objects, highlightedId, onObjectClick }) => {
  // Calculate the number of columns needed for two rows, making sure we round up.
  const columns = Math.ceil(objects.length / 2);
  return (
    <div className="objectsDisplay" style={{
      gridTemplateColumns: `repeat(${columns}, 150px)`,
    }}>
      {objects.map((object) => (
        <ObjectCard
          key={object.id}
          object={object}
          isHighlighted={object.id === highlightedId}
          onClick={onObjectClick}
        />
      ))}
    </div>
  );
};

const ArmoryRow = ({ objects,gamerInfo }) => {
  const [highlightedId, setHighlightedId] = useState(null);

  useEffect(() => {
    const highlightedObject = objects.find(obj => obj.isHighlighted) || objects[0];
    if (highlightedObject) {
      setHighlightedId(highlightedObject.id);
    }
  }, [objects]);


  const sendCoreSelection = async (gamerInfo, coreId) => {
    const payload = {
      GamerInfo: gamerInfo,
      Core: coreId,
    };

    try {
      const response = await fetch('http://localhost:8080/armorcore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
    } catch (error) {
      console.error('There was an error!', error);
    }
  };


  const handleObjectClick = (object) => {
    if (object.id !== highlightedId) {
      console.log(`Clicked object ID: ${object.CoreId}`); // Log the ID to the console
      sendCoreSelection(gamerInfo, object.CoreId);
      setHighlightedId(object.id);
    }
  };

  const highlightedObject = objects.find(obj => obj.id === highlightedId);

  return (
    <div className="container">
      <div className="highlightedCardContainer">
        {highlightedObject && <HighlightedObjectCard object={highlightedObject} />}
      </div>
      <div className="cardContainer">
        <ObjectsDisplay objects={objects} highlightedId={highlightedId} onObjectClick={handleObjectClick} />
      </div>
    </div>
  );
};

export default ArmoryRow;
