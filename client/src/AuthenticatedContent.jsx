function AuthenticatedContent({ gamerInfo }) {
    if (!gamerInfo) return null;
  
    return (
      <div>
        <div className="card mb-5">
          <div className="card-body">
            <h5 className="card-title">{gamerInfo.gamertag}</h5>
            <div className="row align-items-center">
              <div className="col-3">
                <img src={gamerInfo.gamerpic.medium} alt="Medium Gamerpic" className="rounded" />
              </div>
            </div>
          </div>
        </div>
        <div className="container">
          <h1>Authenticated!</h1>
          <p>Spartan Key: {gamerInfo.spartankey}</p>
          <p>XUID: {gamerInfo.xuid}</p>
          <p>FlightID: {gamerInfo.ClearanceCode}</p>
          <p>Gamertag: {gamerInfo.gamertag}</p>
        </div>
      </div>
    );
  }
  
  export default AuthenticatedContent;
  