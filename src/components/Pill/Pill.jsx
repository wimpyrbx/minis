import React from 'react'
import './Pill.css'

const Pill = ({ 
  text, 
  variant = 'primary',
  className = '',
  onClick,
  style
}) => {
  const getVariantClass = () => {
    if (variant === 'expand') {
      return 'pill_expand'
    }
    return `pill_${variant}`
  }

  return (
    <span 
      className={`
        pill 
        ${getVariantClass()}
        ${onClick ? 'pill_clickable' : ''} 
        ${className}
      `}
      onClick={onClick}
      style={{
        fontSize: variant === 'expand' ? '0.65rem' : '0.75em',
        padding: variant === 'expand' ? '0.25em 0.5em' : '0.35em 0.65em',
        ...style
      }}
    >
      {text}
    </span>
  )
}

export default Pill 