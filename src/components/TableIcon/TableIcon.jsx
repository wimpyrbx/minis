import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import './TableIcon.css'

const TableIcon = ({ 
  icon, 
  variant = 'primary',
  size = 'sm',
  className = '',
  onClick,
  title
}) => {
  return (
    <FontAwesomeIcon
      icon={icon}
      className={`table-action-icon ${variant} ${className} ${onClick ? '' : 'disabled'}`}
      size={size}
      onClick={onClick}
      title={title}
    />
  )
}

export default TableIcon 