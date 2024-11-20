import React from 'react';
import { NavLink } from 'react-router-dom';

function Menu() {
  return (
    <nav>
      <div className="menu-section">Main</div>
      <ul className="list-unstyled">
        <li>
          <NavLink to="/collection">
            <i className="fas fa-gamepad"></i>
            Collection
          </NavLink>
        </li>
        <li>
          <NavLink to="/products">
            <i className="fas fa-box"></i>
            Products
          </NavLink>
        </li>
      </ul>

      <div className="menu-section">System</div>
      <ul className="list-unstyled">
        <li>
          <NavLink to="/admin">
            <i className="fas fa-cog"></i>
            Admin
          </NavLink>
        </li>
        <li>
          <NavLink to="/database">
            <i className="fas fa-database"></i>
            Database
          </NavLink>
        </li>
        <li>
          <NavLink to="/ui-elements">
            <i className="fas fa-palette"></i>
            UI Elements
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}

export default Menu; 