import "../Styles/Home.css"
import GoogleAd from "../Components/GoogleAds";
import { useEffect, useState } from "react";
import axios from "axios";

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

function DisplayEvent({ season }) {
  if (!season) return null; // Don't render if no season data is present
  let seasonActive = season.IsActive;
    // Determine the class name based on the season's active status
    const titleContainerClassName = seasonActive 
    ? "title-container-event-home-active" 
    : "title-container-event-home-past";
  console.log(season)
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
          <h2 className="event-title-home">{seasonActive ? <span className="live-text">LIVE  </span>: <span className="past-text">PAST  </span>} - <span className="event-date-home">{season.SeasonMetadataDetails.DateRange.value}</span></h2>
      </div>

      <img className="event-image" src={SeasonImage(season.SeasonMetadataDetails.SeasonImage)} alt="Season Logo" />
      <br />
    </div>
  );
}

function Home() {
  const [CurrentSeason, setCurrentSeason] = useState(null);
  const [PreviousSeason, setPreviousSeason] = useState(null);

  useEffect(() => {

    const fetchHome = async () => {
        try {
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080'; // Fallback URL if the env variable is not set
            const response = await axios.get(`${apiUrl}/home`);
            setCurrentSeason(response.data.CurrentSeason);
            setPreviousSeason(response.data.PreviousSeason);
        } catch (error) {
            console.error("Error fetching Home:", error);
        }
    };

    fetchHome();
  }, []);


  return (
      <div className="home-grid-container">
      <div className="title-container-home">
        <h1 className="spartan-title-home">HOME</h1>
      </div>
      <div className="description-container-home">
        <p className="spartan-description-home">
        <span style={{ fontStyle: 'italic', fontSize: 'larger', padding:0}}><p style={{color:"#fffff"}}>Welcome to Spartan Report</p></span> Your premier destination for tracking progression, viewing upcoming operations, and managing your in-game spartan armors with presets in Halo Infinite</p>
      </div>

      <div className="title-container-events-home">
        <h1 className="spartan-title-home">EVENTS</h1>
      </div>
      <div className="events-container-home">
        {/* Event Cards */}
        <div className="event-card">
          <DisplayEvent season={PreviousSeason} />
        </div>
        <div className="event-card">
        <div className="event-card">
          <DisplayEvent season={CurrentSeason} />
        </div>
        </div>
        
      </div>

      <GoogleAd slot="7820477824" googleAdId="ca-pub-9090570730897630"/>

      </div>
  );
}

export default Home;
