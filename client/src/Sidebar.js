// Sidebar.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Styles/Sidebar.css';

const Sidebar = ({ clearCookie, isAuthenticated, startAuth }) => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div id="sidebar-wrapper">
      <div className="sidebar-heading">Spartan Report</div>
      <div className="list-group list-group-flush flex-grow-1">
        <button onClick={() => handleNavigation("/")} className="list-group-item list-group-item-action">Account</button>
        <button onClick={() => handleNavigation("/progression")} className="list-group-item list-group-item-action">Progression</button>
        <button onClick={() => handleNavigation("/stats")} className="list-group-item list-group-item-action">Battle History</button>
        <button onClick={() => handleNavigation("/operations")} className="list-group-item list-group-item-action">Operations</button>
        <button onClick={() => handleNavigation("/spartan")} className="list-group-item list-group-item-action">Spartan</button>
        <button onClick={() => handleNavigation("/store")} className="list-group-item list-group-item-action">Store</button>

      </div>
      <div className="right-aligned">
        <button className="clear-cookie-button btn btn-danger" onClick={isAuthenticated ? clearCookie : startAuth}>
            {isAuthenticated ? 'Sign Out' : 'Sign In'}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;