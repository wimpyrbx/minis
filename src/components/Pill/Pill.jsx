import React from 'react'
import './Pill.css'

const Pill = ({ 
  text, 
  variant = 'primary',
  className = '',
  onClick
}) => {
  return (
    <span 
      className={`
        pill 
        pill_${variant} 
        ${onClick ? 'pill_clickable' : ''} 
        ${className}
      `}
      onClick={onClick}
    >
      {text}
    </span>
  )
}

export default Pill 