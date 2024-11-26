import React, { useState, useEffect, useRef } from 'react'
import { Overlay, Popover } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

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
  const [position, setPosition] = useState({ left: 0, top: 0 })
  const contentRef = useRef(null)
  const [contentWidth, setContentWidth] = useState(0)
  const timeoutRef = useRef(null)

  // Track content width
  useEffect(() => {
    if (contentRef.current && show) {
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.visibility = 'hidden'
      tempDiv.style.whiteSpace = 'nowrap'
      tempDiv.innerHTML = contentRef.current.innerHTML
      document.body.appendChild(tempDiv)
      
      // Get the width of the content
      const width = Math.max(
        tempDiv.querySelector('.popover-header')?.offsetWidth || 0,
        tempDiv.querySelector('.popover-body')?.offsetWidth || 0
      )
      
      document.body.removeChild(tempDiv)
      setContentWidth(width + 40) // Add padding
    }
  }, [show, children, title])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (show) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        // Update position - offset upward from cursor
        setPosition({ 
          left: e.clientX,
          top: e.clientY - 20  // Move up from cursor more
        })
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [show])

  return (
    <Overlay
      show={show}
      target={target}
      placement="top"
      containerPadding={20}
      popperConfig={{
        strategy: 'fixed',
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [0, -10],
            },
          },
          {
            name: 'preventOverflow',
            options: {
              padding: 8,
            },
          }
        ],
      }}
    >
      <Popover 
        ref={contentRef}
        onMouseEnter={onMouseEnter}
        onMouseLeave={(e) => {
          timeoutRef.current = setTimeout(() => {
            onMouseLeave(e)
          }, 50)
        }}
        style={{
          position: 'fixed',
          left: `${position.left}px`,
          top: `${position.top}px`,
          transform: 'translate(-50%, -100%)',
          width: contentWidth ? `${contentWidth}px` : 'auto',
          minWidth: '200px',
          maxWidth: '400px'
        }}
      >
        <Popover.Header className={`bg-${headerColor} text-white`}>
          {icon && <FontAwesomeIcon icon={icon} className="me-2" />}
          {title}
        </Popover.Header>
        <Popover.Body>
          {children}
        </Popover.Body>
      </Popover>
    </Overlay>
  )
}

export default MouseOverInfo 