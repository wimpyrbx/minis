import React from 'react';
import './Sidebar.css';
import Menu from './Menu';

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Xbox 360 Collector</h3>
      </div>
      <Menu />
    </div>
  );
}

export default Sidebar; 