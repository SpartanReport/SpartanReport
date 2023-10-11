// Header.jsx
import React from 'react';
import './styles.css';  // Import your styles.css file

const Header = ({ gamerInfo }) => {
    return (
        <div className="header-wrapper">
            <header>
                <p>{gamerInfo ? gamerInfo.gamertag : 'Loading...'}</p>
            </header>
        </div>
    );
};

export default Header;
