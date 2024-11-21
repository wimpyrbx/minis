import React from 'react';
import PropTypes from 'prop-types';
import TableButton from '../TableButton';
import './Table.css';

const ActionCell = ({ actions }) => {
  return (
    <div className="action-cell">
      {actions.map((action, index) => (
        <TableButton
          key={index}
          icon={action.icon}
          variant={action.variant}
          onClick={action.onClick}
          title={action.title}
          disabled={action.disabled}
          className={action.className}
        />
      ))}
    </div>
  );
};

ActionCell.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.object.isRequired,
      variant: PropTypes.string,
      onClick: PropTypes.func.isRequired,
      title: PropTypes.string,
      disabled: PropTypes.bool,
      className: PropTypes.string,
    })
  ).isRequired,
};

export default ActionCell; 