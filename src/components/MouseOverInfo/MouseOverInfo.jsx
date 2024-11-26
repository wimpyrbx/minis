import React, { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Overlay } from 'react-bootstrap'
import './MouseOverInfo.css'

const MouseOverInfo = ({ 
  show, 
  target, 
  title, 
  icon, 
  headerColor = 'primary',
  children,
  onMouseEnter,
  onMouseLeave
}) => {
  const [showOverlay, setShowOverlay] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    setShowOverlay(show)
  }, [show])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (show) {
        setMousePosition({ x: e.clientX, y: e.clientY })
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [show])

  const handleMouseEnter = () => {
    if (typeof onMouseEnter === 'function') {
      onMouseEnter()
    }
  }

  const handleMouseLeave = () => {
    if (typeof onMouseLeave === 'function') {
      onMouseLeave()
    }
  }

  return (
    <Overlay
      show={showOverlay}
      target={target}
      placement="left"
      offset={[-10, 0]}
      popperConfig={{
        modifiers: [
          {
            name: 'preventOverflow',
            options: {
              boundary: 'viewport',
              padding: 8
            }
          }
        ]
      }}
    >
      {({
        placement: _placement,
        arrowProps: _arrowProps,
        show: _show,
        popper: _popper,
        hasDoneInitialMeasure: _hasDoneInitialMeasure,
        ...props
      }) => (
        <div
          {...props}
          className="mouse-over-info"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            ...props.style,
            position: 'fixed',
            left: `${mousePosition.x - 10}px`,
            top: `${mousePosition.y - 10}px`,
            transform: 'translate(-100%, -100%)',
            zIndex: 9999
          }}
        >
          <div className={`mouse-over-info-header bg-${headerColor}`}>
            {icon && <FontAwesomeIcon icon={icon} className="me-2" />}
            {title}
          </div>
          <div className="mouse-over-info-body">
            {children}
          </div>
        </div>
      )}
    </Overlay>
  )
}

export default MouseOverInfo 