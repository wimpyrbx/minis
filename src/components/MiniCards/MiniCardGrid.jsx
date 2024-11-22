import React, { useState } from 'react'
import { Row, Col, Card, Badge } from 'react-bootstrap'
import { faPencil, faTrash, faMapMarkerAlt, faImage } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import TableButton from '../TableButton'
import MiniViewer from '../MiniViewer/MiniViewer'

const MiniCardGrid = ({ minis, onEdit, onDelete, onImageClick, darkMode }) => {
  const [showViewer, setShowViewer] = useState(false)
  const [selectedMini, setSelectedMini] = useState(null)

  const handleMiniClick = (mini) => {
    setSelectedMini(mini)
    setShowViewer(true)
  }

  return (
    <>
      <Row xs={1} md={2} lg={3} xl={4} className="g-4">
        {minis.map(mini => (
          <Col key={mini.id}>
            <Card className={`h-100 shadow-sm ${darkMode ? 'bg-dark text-white' : ''}`}>
              <div className="position-relative">
                {mini.image_path ? (
                  <Card.Img
                    variant="top"
                    src={mini.image_path}
                    style={{ height: '200px', objectFit: 'contain', cursor: 'pointer' }}
                    onClick={() => onImageClick(mini)}
                    className="p-2"
                  />
                ) : (
                  <div 
                    className={`d-flex flex-column align-items-center justify-content-center ${darkMode ? 'bg-dark' : 'bg-light'}`}
                    style={{ 
                      height: '200px', 
                      border: `1px solid ${darkMode ? '#2c3034' : '#dee2e6'}`,
                      borderRadius: '4px'
                    }}
                  >
                    <FontAwesomeIcon 
                      icon={faImage} 
                      className={`${darkMode ? 'text-white-50' : 'text-muted'} mb-2`} 
                      size="2x" 
                    />
                    <span className={`${darkMode ? 'text-white-50' : 'text-muted'} small`}>No Image Available</span>
                  </div>
                )}
                <div 
                  className="position-absolute top-0 end-0 m-2 p-2 bg-dark bg-opacity-75 rounded-pill text-white"
                  style={{ fontSize: '0.8rem' }}
                >
                  QTY: {mini.quantity}
                </div>
              </div>
              <Card.Body className="d-flex flex-column pt-2 pb-0">
                <Card.Title className="h6 mb-2 d-flex justify-content-between align-items-start">
                  <span 
                    className={`text-decoration-none ${darkMode ? 'text-white' : 'text-dark'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleMiniClick(mini)}
                  >
                    {mini.name}
                  </span>
                </Card.Title>

                <div className="info-grid mb-3">
                  {/* Base Info Section */}
                  <div className="d-flex flex-column gap-1 mb-2">
                    {mini.location && (
                      <div className="d-flex align-items-center">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-secondary me-2" size="sm" />
                        <small className={`${darkMode ? 'text-white-50' : 'text-muted'}`}>{mini.location}</small>
                      </div>
                    )}
                    <div className="d-flex flex-wrap gap-2">
                      {mini.base_size_name && (
                        <small className="badge bg-light text-dark">
                          {mini.base_size_name.split('_')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                            .join(' ')}
                        </small>
                      )}
                      {mini.painted_by_name && (
                        <small className="badge bg-light text-dark">
                          {mini.painted_by_name}
                        </small>
                      )}
                    </div>
                  </div>

                  {/* Description Section */}
                  {mini.description && (
                    <div className="mb-2">
                      <small className={`${darkMode ? 'text-white-50' : 'text-muted'} d-block mb-1`}>Description:</small>
                      <p className="small mb-0">{mini.description}</p>
                    </div>
                  )}

                  {/* Categories Section */}
                  {mini.categories?.length > 0 && (
                    <div className="mb-2">
                      <small className={`${darkMode ? 'text-white-50' : 'text-muted'} d-block mb-1`}>Categories:</small>
                      <div className="d-flex flex-wrap gap-1">
                        {mini.categories.map((cat, idx) => (
                          <Badge key={idx} bg="secondary" className="text-white">{cat}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Types Section */}
                  {mini.types?.length > 0 && (
                    <div className="mb-2">
                      <small className={`${darkMode ? 'text-white-50' : 'text-muted'} d-block mb-1`}>Types:</small>
                      <div className="d-flex flex-wrap gap-1">
                        {mini.types.map((type, idx) => (
                          <Badge key={idx} bg="info" className="text-white">{type}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Proxy Types Section */}
                  {mini.proxyTypes?.length > 0 && (
                    <div className="mb-2">
                      <small className={`${darkMode ? 'text-white-50' : 'text-muted'} d-block mb-1`}>Proxy Types:</small>
                      <div className="d-flex flex-wrap gap-1">
                        {mini.proxyTypes.map((type, idx) => (
                          <Badge key={idx} bg="warning" className="text-dark">{type}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags Section */}
                  {mini.tags?.length > 0 && (
                    <div className="mb-2">
                      <small className={`${darkMode ? 'text-white-50' : 'text-muted'} d-block mb-1`}>Tags:</small>
                      <div className="d-flex flex-wrap gap-1">
                        {mini.tags.map((tag, idx) => (
                          <Badge key={idx} bg="primary" pill>{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Product Sets Section */}
                  {mini.formattedProductSets?.length > 0 && (
                    <div className="mb-2 border-top pt-2">
                      <small className={`${darkMode ? 'text-white-50' : 'text-muted'} d-block mb-1`}>Product Sets:</small>
                      {mini.formattedProductSets.map((set, idx) => (
                        <div key={idx} className="mb-1" style={{ fontSize: '0.75rem' }}>
                          <div className="fw-bold text-primary">{set.manufacturer}</div>
                          <div className="text-secondary">· {set.productLine}</div>
                          <div className="text-muted">·· {set.setName}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card.Body>
              <Card.Footer className="bg-transparent border-0 pt-0">
                <div className="d-flex justify-content-end gap-2">
                  <TableButton
                    icon={faPencil}
                    variant="primary"
                    onClick={() => onEdit(mini)}
                    title="Edit Mini"
                  />
                  <TableButton
                    icon={faTrash}
                    variant="danger"
                    onClick={() => onDelete(mini.id)}
                    title="Delete Mini"
                  />
                </div>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>

      <MiniViewer
        show={showViewer}
        onHide={() => setShowViewer(false)}
        mini={selectedMini}
        darkMode={darkMode}
      />
    </>
  )
}

export default MiniCardGrid 