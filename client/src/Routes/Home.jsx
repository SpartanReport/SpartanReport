import "../Styles/Home.css"

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
      </div>
  );
}

export default Home;
