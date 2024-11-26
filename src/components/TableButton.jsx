import React from 'react'
import { faCircleMinus, faFileEdit } from '@fortawesome/free-solid-svg-icons'
import TableIcon from './TableIcon/TableIcon'

// Common variants definition
const VARIANTS = {
  edit: {
    icon: faFileEdit,
    variant: 'primary',
    title: 'Edit',
    size: 'sm'
  },
  delete: {
    icon: faCircleMinus,
    variant: 'danger',
    title: 'Delete',
    size: 'sm'
  }
}

const TableButton = ({ 
  type,              
  icon,              
  variant = 'primary',
  onClick,
  title,
  className = '',
  disabled = false,
  size
}) => {
  // If type is provided, use predefined variant
  const variantProps = type ? VARIANTS[type] : { icon, variant, title }

  return (
    <TableIcon
      icon={variantProps.icon}
      variant={variantProps.variant}
      onClick={disabled ? undefined : onClick}
      title={title || variantProps.title}
      className={`${className} ${disabled ? 'disabled' : ''}`}
      size={size || variantProps.size}
    />
  )
}

export default TableButton 