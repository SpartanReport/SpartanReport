import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../Styles/operations.css';
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
    const calculateDays = (dateRange) => {
        const today = new Date();
        const [startDateString, endDateString] = dateRange.split(' - ');
        
        // Assuming the date format is 'MMM DD, YYYY'
        const startDate = new Date(startDateString);
        const endDate = new Date(endDateString);
      
        let days;
        if (today < startDate) {
          // If operation hasn't started
          days = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
          return `Starts in ${days} Days`;
        } else if (today >= startDate && today <= endDate) {
          // If the operation is live
          days = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
          return `${days} Days Left`;
        } else {
          return 'Operation Ended';
        }
      };
      

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
                            <br></br>
                            <p className='ops-date'>{season.SeasonMetadataDetails.DateRange.value}</p>

                            <p className='ops-days'>{calculateDays(season.SeasonMetadataDetails.DateRange.value)}</p>
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