import "../Styles/Home.css"
import GoogleAd from "../Components/GoogleAds";

function Home() {
  return (
      <div className="home-grid-container">
      <div className="title-container-home">
        <h1 className="spartan-title-home">HOME</h1>
      </div>
      <div className="description-container-home">
        <p className="spartan-description-home">
        <span style={{ fontStyle: 'italic', fontSize: 'larger', padding:0}}><p style={{color:"#fffff"}}>Welcome to Spartan Report</p></span> Your premier destination for tracking progression, viewing upcoming operations, and managing your in-game spartan armors with presets in Halo Infinite</p>
      </div>
      <GoogleAd slot="7820477824" googleAdId="ca-pub-9090570730897630"/>

      </div>
  );
}

export default Home;
