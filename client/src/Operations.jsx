import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './operations.css';
import SelectedOperation from './SelectedOperation';

const Operations = ({ gamerInfo }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [operationsData, setOperations] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState(null);
    useEffect(() => {
        const fetchOperations = async () => {
            try {
                const response = await axios.post('http://localhost:8080/operations', gamerInfo);
                setOperations(response.data.Seasons.Seasons);
                console.log(response.data.Seasons.Seasons)
            } catch (error) {
                console.error("Error fetching Spartan inventory:", error);
            }
            setIsLoading(false);
        };

        fetchOperations();
    }, [gamerInfo]);

    if (isLoading) {
        return <div>Loading...</div>;
    }
    function SeasonImage(base64ImageData){
        return `data:image/png;base64,${base64ImageData}`;
    }


    const handleCardClick = (index) => {
        setSelectedSeason(index);
    };
    
    const handleBackClick = () => {
        setTimeout(() => {
            setSelectedSeason(null);
        }, 300);
    };
    return (
        <div>
            <h1 className="ops-title">Operations</h1>
            {selectedSeason === null ? (
                <div className="operations-container">
                    {operationsData.map((season, index) => (
                        <div
                            key={index}
                            className="season-card"
                            onClick={() => handleCardClick(index)}
                        >
                            {season.IsActive && <span className="live-banner">LIVE</span>}
                            <h3 className="season-name">{season.SeasonMetadataDetails.Name.value}</h3>
                            <img className="season-img" src={SeasonImage(season.SeasonMetadataDetails.SeasonImage)} alt="Season Logo" />
                            <p className="season-date">{season.SeasonMetadataDetails.DateRange.value}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <SelectedOperation
                    gamerInfo={gamerInfo}
                    seasonData={operationsData[selectedSeason]}
                    handleBackClick={handleBackClick}
                    SeasonImage={SeasonImage}
                />
            )}
        </div>
    );
};

export default Operations;