import React from 'react';
import PropTypes from 'prop-types';
import './Table.css';

const TableHeader = ({ columns }) => {
  return (
    <div className="table-header">
      {columns.map((col, index) => (
        <div key={index} className={`table-cell header-cell ${col.className || ''}`}>
          {col.label}
        </div>
      ))}
    </div>
  );
};

TableHeader.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      className: PropTypes.string,
    })
  ).isRequired,
};

export default TableHeader; 