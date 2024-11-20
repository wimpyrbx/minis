import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function MenuItem({ to, icon, label }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <li className={isActive ? 'active' : ''}>
      <Link to={to}>
        <i className={icon}></i> {label}
      </Link>
    </li>
  );
}

export default MenuItem; 