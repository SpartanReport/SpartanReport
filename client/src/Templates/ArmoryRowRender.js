const renderArmoryRow = ({ title, type, armoryRowData }) => {
    return (
      <React.Fragment>
        <div className="subheader-container-home" onClick={() => toggleVisibility(type)}>
            <svg className="diamond-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22.92 22.92">
            <path className="cls-1" d="M11.46,0L0,11.46l11.46,11.46,11.46-11.46L11.46,0ZM3.41,11.46L11.46,3.41l8.05,8.05-8.05,8.05L3.41,11.46Z"/>
            <rect className="cls-1" x="8.16" y="8.16" width="6.59" height="6.59" transform="translate(-4.75 11.46) rotate(-45)"/>
            </svg>
            <h1 className="spartan-subheader-home">          {title} {visibleRows[type] ? 
            (<svg className="arrow-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            {/* SVG path for down arrow */}
            <path d="M7.41 8.29L12 12.88 16.59 8.29 18 9.71l-6 6-6-6z"/>
            </svg>) : 
            (<svg className="arrow-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            {/* SVG path for right arrow (">") */}
            <path d="M8.29 7.41L12.88 12 8.29 16.59 9.71 18l6-6-6-6z"/>
            </svg>)
        }</h1>
        </div>
        {visibleRows[type] ? <div style={{height:50}}></div> : (
          <div className="armory-row">
                    <ArmoryRow objects={armoryRow.ArmoryRow}  resetHighlight={resetHighlight} fullObjects={armoryRow} gamerInfo={gamerInfo} onEquipItem={handleEquipItem}   currentlyEquipped={currentlyEquipped} setHighlightedCoreId={setHighlightedCoreId} setHighlightedHelmetId={setHighlightedHelmetId} highlightedId={highlightedCoreId}   />

            <ArmoryRow objects={armoryRowData} resetHighlight={resetHighlight} /* ... other props */ />
          </div>
        )}
      </React.Fragment>
    );
  };
  