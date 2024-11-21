import React from 'react';
import PropTypes from 'prop-types';
import './Table.css';

const TableContainer = ({ children, className = '' }) => {
  return <div className={`table-container ${className}`}>{children}</div>;
};

TableContainer.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default TableContainer; 