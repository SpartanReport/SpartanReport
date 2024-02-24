import React, { useState, useRef } from 'react';
import '../Styles/Navbar.css';
import { useNavigate,useLocation } from 'react-router-dom';
import axios from 'axios';
import Emblem from './Emblem';

const Navbar = ({ isAuthenticated, startAuth }) => {
  const [activeButton, setActiveButton] = useState('Command Center');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const location = useLocation(); // Add this line
  const routes = [
    { name: 'HOME', path: '/' },
    ...(isAuthenticated ? [{ name: 'COMMAND CENTER', path: '/commandcenter' }] : []),
    { name: 'PROGRESSION', path: '/progression' },
    { name: 'BATTLE LOG', path: '/stats' },
    { name: 'OPERATIONS', path: '/operations' },
    { name: 'ARMORY', path: '/spartan' },
    { name: 'STORE', path: '/store' }
  ];

  const handleLogout = async () => {
    try {
      console.log("Signing out");
      localStorage.clear();
      const apiUrl = process.env.REACT_APP_REDIRECT_URL || 'http://localhost:3000';
      await axios.get(`${apiUrl}/logout`, { withCredentials: true });
      window.location.href = `${apiUrl}/`;
    } catch (error) {
      const apiUrl = process.env.REACT_APP_REDIRECT_URL || 'http://localhost:3000';
      console.error('Logout failed:', error);
      window.location.href = `${apiUrl}/`;
    }
  };

  const handleNavigation = (routeName, routePath) => {
    setActiveButton(routeName);
    navigate(routePath);
    setShowMobileNav(false);
    setShowDropdown(false);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
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

  const toggleMobileNav = () => {
    setShowMobileNav(!showMobileNav);
    setShowDropdown(false);
  };
  const HamburgerIcon = () => (
      <svg  viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6H20M4 12H20M4 18H20" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
  );

 const CancelIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 6L18 18M6 18L18 6" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
   );
  
  const dropdownRoutes = ['PROGRESSION', 'BATTLE LOG', 'ARMORY'];
  const isHomeRoute = location.pathname === '/'; // Check if the current route is HOME
  return (
    <div>
      <div className={`title-container `}>    
         <h1 className="spartan-title">SPARTAN REPORT</h1>
         <button className={`hamburger ${showMobileNav ? 'full-width' : ''}`} onClick={toggleMobileNav}>
         {showMobileNav ? <CancelIcon /> : <HamburgerIcon />}
        </button>
      </div>
      <div className="navbar-container">
      <nav className={`App-nav ${showMobileNav ? 'show' : ''}`}>
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
               onMouseLeave={isAuthenticated ? handleMouseLeave : null}
               onClick={isAuthenticated ? toggleDropdown : startAuth}>
            <button className={`nav-button hamburger-button ${dropdownRoutes.includes(activeButton) ? 'active' : ''}`}>
              {isAuthenticated ? 'SPARTAN' : 'SIGN IN'}
            </button>
            {showDropdown && (
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
                <button className="nav-button" onClick={handleLogout}>
                      SIGN OUT
                </button>
              </div>
            )}
          </div>
          <Emblem gamerInfo={JSON.parse(localStorage.getItem('gamerInfo'))} />
        </nav>
        
      </div>
    </div>
  );
};

export default Navbar;
