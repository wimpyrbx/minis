import React from 'react';
import PropTypes from 'prop-types';
import './Table.css';

const CustomTable = ({ columns, data, renderCell }) => {
  return (
    <div className="table-wrapper">
      <table className="custom-table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index} className={column.className}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column, colIndex) => (
                <td key={colIndex} className={column.className}>
                  {renderCell(row, column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

CustomTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      key: PropTypes.string.isRequired,
      className: PropTypes.string,
    })
  ).isRequired,
  data: PropTypes.array.isRequired,
  renderCell: PropTypes.func.isRequired,
};

export default CustomTable; 