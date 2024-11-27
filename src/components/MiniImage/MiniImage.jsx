import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faImage } from '@fortawesome/free-regular-svg-icons'
import { useTheme } from '../../context/ThemeContext'
import './MiniImage.css'

const MiniImage = ({ 
  src, 
  alt, 
  onClick, 
  size = 40,  // Default size reduced to 40px
  className = '',
  showHoverEffect = true,
  useOriginal = false  // New prop to determine which URL to use
}) => {
  const [hasError, setHasError] = useState(false)
  const { darkMode } = useTheme()

  // Convert the src URL to use either original or thumbnail path
  const getImageUrl = (url) => {
    if (!url) return null
    if (useOriginal) {
      return url.replace('/minis/', '/minis/originals/')
    } else {
      return url.replace('/minis/originals/', '/minis/')
    }
  }

  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`
  }

  const iconStyle = {
    fontSize: `${size * 0.4}px`  // Icon size relative to container
  }

  return (
    <div 
      className={`mini-image-container ${darkMode ? 'dark' : ''} ${showHoverEffect && src && !hasError ? 'hover-effect' : ''} ${className}`}
      style={containerStyle}
      onClick={() => src && !hasError && onClick?.()}
    >
      {!hasError && src ? (
        <img 
          src={getImageUrl(src)} 
          alt={alt}
          onError={() => setHasError(true)}
          className="mini-image"
        />
      ) : (
        <div className="placeholder-container">
          <FontAwesomeIcon 
            icon={faImage} 
            style={iconStyle}
          />
        </div>
      )}
    </div>
  )
}

export default MiniImage 