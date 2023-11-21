import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../Styles/operations.css';
import GoogleAd from '../Components/GoogleAds';
import SelectedOperation from './SelectedOperation';
import { useNavigate, Link } from 'react-router-dom';


const Operations = ({ gamerInfo }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [operationsData, setOperations] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOperations = async () => {
            try {
                const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080'; // Fallback URL if the env variable is not set
                const response = await axios.post(`${apiUrl}/operations`, gamerInfo || {});
                setOperations(response.data.Seasons.Seasons);
                console.log(response.data.Seasons.Seasons);
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



    function SeasonImage(base64ImageData) {
        return `data:image/png;base64,${base64ImageData}`;
    }
    const getSeasonLink = (season) => {
      let seasonMetadata = season.OperationTrackPath;
      if (seasonMetadata.endsWith('.json')) {
          seasonMetadata = seasonMetadata.replace(/\.json$/, '');
      }
      if (seasonMetadata.startsWith('RewardTracks/Operations/')) {
          seasonMetadata = seasonMetadata.replace(/^RewardTracks\/Operations\//, '');
      }
      return `/operations/${seasonMetadata}`;
  };
    function DisplayEvent({ season }) {
        if (!season) return null; // Don't render if no season data is present
      
        // Get the current date and the start date of the season
        const currentDate = new Date();
        const startDate = new Date(season.StartDate.ISO8601Date);
      
        // Determine whether the season is past, present, or future
        let seasonStatus;
        if (startDate > currentDate) {
          seasonStatus = "FUTURE";
        } else if (season.IsActive) {
          seasonStatus = "ACTIVE";
        } else {
          seasonStatus = "PAST";
        }
      
        // Determine the class name based on the season's status
        const titleContainerClassName = `title-container-event-home-${seasonStatus.toLowerCase()}`;
      
        return (
          <div className="event-card">
            <h3 className="event-subheader">         
              <svg className="diamond-icon-home" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22.92 22.92">
                <path className="cls-1" d="M11.46,0L0,11.46l11.46,11.46,11.46-11.46L11.46,0ZM3.41,11.46L11.46,3.41l8.05,8.05-8.05,8.05L3.41,11.46Z"/>
                <rect className="cls-1" x="8.16" y="8.16" width="6.59" height="6.59" transform="translate(-4.75 11.46) rotate(-45)"/>
              </svg> 
              {season.SeasonMetadataDetails.Name.value}
            </h3>
            <div className={titleContainerClassName}>
              <h2 className="event-title-home">
                {seasonStatus === "ACTIVE" && <span className="live-text">LIVE </span>}
                {seasonStatus === "PAST" && <span className="past-text">PAST </span>}
                {seasonStatus === "FUTURE" && <span className="future-text">FUTURE </span>} - 
                <span className="event-date-home">{season.SeasonMetadataDetails.DateRange.value}</span>
              </h2>
            </div>
      
            <img className="event-image" src={SeasonImage(season.SeasonMetadataDetails.SeasonImage)} alt="Season Logo" />
            <br />
          </div>
        );
      }
    return (
        <div>
            <div className="title-container-operations">
                <h1 className="operations-title-operations">OPERATIONS</h1>
            </div>  
            <div className="operations-container">
                {operationsData.map((season, index) => (
                  <Link to={`${getSeasonLink(season)}`} key={index} className="season-card" style={{ textDecoration: 'none' }}                  >
                      <DisplayEvent season={season} />
                  </Link>
              ))}

            </div>

            <GoogleAd slot="7820477824" googleAdId="ca-pub-9090570730897630"/>
        </div>
    );
};

export default Operations;
