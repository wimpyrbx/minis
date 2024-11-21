import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'

const TableButton = ({ 
  icon, 
  onClick, 
  variant = 'primary',
  title,
  className = '',
  disabled = false
}) => {
  const getColorClass = () => {
    switch (variant) {
      case 'danger':
        return 'text-danger'
      case 'success':
        return 'text-success'
      case 'info':
        return 'text-info'
      case 'primary':
      default:
        return 'text-primary'
    }
  }

  return (
    <FontAwesomeIcon
      icon={icon}
      onClick={disabled ? undefined : onClick}
      title={title}
      className={`table-action-icon ${getColorClass()} ${className} ${disabled ? 'disabled' : ''}`}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
      fixedWidth
    />
  )
}

TableButton.propTypes = {
  icon: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
  variant: PropTypes.string,
  title: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool
}

export default TableButton 