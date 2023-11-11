import React from 'react';
import "../Styles/UnauthenticatedContent.css"
const UnauthenticatedContent = ({ startAuth }) => {
  return (

  <div className="main-grid-container-unauth">
  <div className="title-container-home">
    <h1 className="spartan-title-home">COMMAND CENTER</h1>
  </div>
  <div className="subheader-container-home">
  <svg className="diamond-icon" id="Layer_2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22.92 22.92"><defs></defs><g id="Layer_3"><g><path class="cls-1" d="M11.46,0L0,11.46l11.46,11.46,11.46-11.46L11.46,0ZM3.41,11.46L11.46,3.41l8.05,8.05-8.05,8.05L3.41,11.46Z"/><rect class="cls-1" x="8.16" y="8.16" width="6.59" height="6.59" transform="translate(-4.75 11.46) rotate(-45)"/></g></g></svg>
    <h1 className="spartan-subheader-home">SIGN IN TO SEE YOUR SPARTAN</h1>
  </div>

  <div className="button-container">
          <button onClick={startAuth} className='button-sign-in log'>
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Xbox_Logo.svg/256px-Xbox_Logo.svg.png" alt="Xbox Logo" width="30" />
          </button>
    </div>
    
  </div>




  );
};

export default UnauthenticatedContent;
