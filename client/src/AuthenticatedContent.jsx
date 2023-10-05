function AuthenticatedContent({ gamerInfo }) {
  console.log("gamerInfo: ", gamerInfo);
  if (!gamerInfo) return null;

  const cardData = [
    { title: 'Authenticated', spartanKey: "too long to show.. but acquired!", xuid: gamerInfo.xuid, clearanceCode: gamerInfo.ClearanceCode, gamertag: gamerInfo.gamertag },
    { title: 'Card 2', data: "hi" },
    // ... other cards
  ];

  return (
    <div className="main-grid-container">
      {cardData.map((card, index) => (
        <div key={index} className="main-cards">
          <div className="card-title">{card.title}</div>
          {card.spartanKey && <p>Spartan Key: {card.spartanKey}</p>}
          {card.xuid && <p>XUID: {card.xuid}</p>}
          {card.clearanceCode && <p>FlightID: {card.clearanceCode}</p>}
          {card.gamertag && <p>Gamertag: {card.gamertag}</p>}
          {card.data && <p>Data: {card.data}</p>}
        </div>
      ))}
    </div>      
  );
}

export default AuthenticatedContent;
