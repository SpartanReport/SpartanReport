import React from 'react';

const UnauthenticatedContent = ({ startAuth }) => {
  return (
    <div>
      <h1>You are not authenticated</h1>
      <button onClick={startAuth} style={{ backgroundColor: '#0F7C10', color: 'white', display: 'flex', alignItems: 'center' }}>
  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Xbox_Logo.svg/256px-Xbox_Logo.svg.png" alt="Xbox Logo" width="20" />
  Sign in with Xbox Live
</button>
    </div>
  );
};

export default UnauthenticatedContent;
