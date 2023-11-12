import React, { useState, useRef } from 'react';
import '../Styles/Navbar.css';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ clearCookie, isAuthenticated, startAuth }) => {
  const [activeButton, setActiveButton] = useState('Command Center');
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const routes = [
    { name: 'HOME', path: '/' },
    ...(isAuthenticated ? [{ name: 'COMMAND CENTER', path: '/commandcenter' }] : []),
    { name: 'PROGRESSION', path: '/progression' },
    { name: 'BATTLE LOG', path: '/stats' },
    { name: 'OPERATIONS', path: '/operations' },
    { name: 'ARMORY', path: '/spartan' },
    { name: 'STORE', path: '/store' }
  ];

  const handleNavigation = (routeName, routePath) => {
    setActiveButton(routeName);
    navigate(routePath);
  };

  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setShowDropdown(true);
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => {
      setShowDropdown(false);
    }, 100);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const dropdownRoutes = ['PROGRESSION', 'BATTLE LOG', 'ARMORY'];

  return (
    <div>
    <div className="title-container">
    <h1 className="spartan-title">SPARTAN REPORT</h1>
  </div>
    <div className="navbar-container">

      <nav className="App-nav">
        {routes.filter(route => !dropdownRoutes.includes(route.name)).map(route => (
          <div key={route.name} className={`nav-button-wrapper ${activeButton === route.name ? 'active-wrapper' : ''}`}>
            <button 
              className={`nav-button ${activeButton === route.name ? 'active' : ''}`} 
              onClick={() => handleNavigation(route.name, route.path)}>
              {route.name}
            </button>
          </div>
        ))}
        <div className="nav-button-wrapper"
             onMouseEnter={isAuthenticated ? handleMouseEnter : null} 
             onMouseLeave={isAuthenticated ? handleMouseLeave : null}>
          <button className={`nav-button hamburger-button ${dropdownRoutes.includes(activeButton) ? 'active' : ''}`}
                  onClick={isAuthenticated ? null : startAuth}>
            {isAuthenticated ? 'SPARTAN' : 'SIGN IN'}
          </button>
          {isAuthenticated && showDropdown && (
            <div className="dropdown-menu">
              {routes.filter(route => dropdownRoutes.includes(route.name)).map(route => (
                <button 
                  key={route.name}
                  className={`nav-button ${activeButton === route.name ? 'active' : ''}`}
                  onClick={() => handleNavigation(route.name, route.path)}
                >
                  {route.name}
                </button>
              ))}
              <button className="nav-button" onClick={clearCookie}>
                SIGN OUT
              </button>
            </div>
          )}
        </div>
      </nav>
    </div>
    </div>
  );
};

export default Navbar;
