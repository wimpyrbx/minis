import React, { useState, useEffect } from 'react'
import { Modal } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faTimes, 
  faDownload, 
  faChevronLeft, 
  faChevronRight,
  faSpinner,
  faSearchPlus,
  faSearchMinus,
  faRotateRight,
  faRotateLeft
} from '@fortawesome/free-solid-svg-icons'

const ImageModal = ({ show, onHide, imagePath, miniName, onPrevious, onNext, hasPrevious, hasNext }) => {
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (show) {
      setLoading(true)
      setZoom(1)
      setRotation(0)
      setPosition({ x: 0, y: 0 })
    }
  }, [show, imagePath])

  const handleImageLoad = () => {
    setLoading(false)
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = imagePath
    link.download = `${miniName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.webp`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleZoom = (delta) => {
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)))
  }

  const handleRotate = (direction) => {
    setRotation(prev => prev + (direction * 90))
  }

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = (e) => {
    if (dragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setDragging(false)
  }

  const handleKeyDown = (e) => {
    switch(e.key) {
      case 'ArrowLeft':
        if (hasPrevious) onPrevious()
        break
      case 'ArrowRight':
        if (hasNext) onNext()
        break
      case '+':
        handleZoom(0.1)
        break
      case '-':
        handleZoom(-0.1)
        break
      case 'Escape':
        onHide()
        break
      default:
        break
    }
  }

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="xl"
      centered
      className="image-modal"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <Modal.Header className="border-0 position-absolute w-100 bg-transparent">
        <div className="d-flex justify-content-between w-100 px-3">
          <h5 className="text-white text-shadow mb-0">{miniName}</h5>
          <div className="d-flex gap-2">
            <button
              className="btn btn-icon btn-sm btn-ghost-light"
              onClick={() => handleRotate(-1)}
              title="Rotate left"
            >
              <FontAwesomeIcon icon={faRotateLeft} />
            </button>
            <button
              className="btn btn-icon btn-sm btn-ghost-light"
              onClick={() => handleRotate(1)}
              title="Rotate right"
            >
              <FontAwesomeIcon icon={faRotateRight} />
            </button>
            <button
              className="btn btn-icon btn-sm btn-ghost-light"
              onClick={() => handleZoom(-0.1)}
              title="Zoom out"
            >
              <FontAwesomeIcon icon={faSearchMinus} />
            </button>
            <button
              className="btn btn-icon btn-sm btn-ghost-light"
              onClick={() => handleZoom(0.1)}
              title="Zoom in"
            >
              <FontAwesomeIcon icon={faSearchPlus} />
            </button>
            <button
              className="btn btn-icon btn-sm btn-ghost-light"
              onClick={handleDownload}
              title="Download original"
            >
              <FontAwesomeIcon icon={faDownload} />
            </button>
            <button
              className="btn btn-icon btn-sm btn-ghost-light"
              onClick={onHide}
              title="Close"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>
      </Modal.Header>
      <Modal.Body 
        className="p-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: zoom > 1 ? 'move' : 'default' }}
      >
        <div className="image-container">
          {loading && (
            <div className="loading-overlay">
              <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-white" />
            </div>
          )}
          <img
            src={imagePath}
            alt={miniName}
            className="img-fluid"
            style={{
              maxHeight: '85vh',
              width: 'auto',
              margin: '0 auto',
              display: 'block',
              transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x/zoom}px, ${position.y/zoom}px)`,
              transition: dragging ? 'none' : 'transform 0.2s ease'
            }}
            onLoad={handleImageLoad}
            draggable={false}
          />
        </div>
        {hasPrevious && (
          <button
            className="nav-button nav-button-left"
            onClick={onPrevious}
            title="Previous image"
          >
            <FontAwesomeIcon icon={faChevronLeft} size="2x" />
          </button>
        )}
        {hasNext && (
          <button
            className="nav-button nav-button-right"
            onClick={onNext}
            title="Next image"
          >
            <FontAwesomeIcon icon={faChevronRight} size="2x" />
          </button>
        )}
      </Modal.Body>
    </Modal>
  )
}

export default ImageModal 