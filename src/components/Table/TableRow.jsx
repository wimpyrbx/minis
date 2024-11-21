import React from 'react';
import PropTypes from 'prop-types';
import './Table.css';

const TableRow = ({ rowData }) => {
  return (
    <div className="table-row">
      {rowData.map((cell, index) => (
        <div key={index} className={`table-cell ${cell.className || ''}`}>
          {cell.content}
        </div>
      ))}
    </div>
  );
};

TableRow.propTypes = {
  rowData: PropTypes.arrayOf(
    PropTypes.shape({
      content: PropTypes.node.isRequired,
      className: PropTypes.string,
    })
  ).isRequired,
};

export default TableRow; 