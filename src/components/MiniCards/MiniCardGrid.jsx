import React from 'react'
import { Row, Col, Card, Button } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faImage, faPencil, faTrash } from '@fortawesome/free-solid-svg-icons'

const MiniCardGrid = ({ minis, onEdit, onDelete, onImageClick, darkMode }) => {
  return (
    <Row xs={1} md={2} lg={3} xl={4} className="g-4">
      {minis.map(mini => (
        <Col key={mini.id}>
          <Card className={`h-100 ${darkMode ? 'bg-dark text-white' : ''}`}>
            <div className="position-relative">
              {mini.image_path ? (
                <Card.Img
                  variant="top"
                  src={mini.image_path}
                  style={{ height: '200px', objectFit: 'contain', cursor: 'pointer' }}
                  onClick={() => onImageClick(mini)}
                />
              ) : (
                <div 
                  className="bg-light d-flex align-items-center justify-content-center"
                  style={{ height: '200px' }}
                >
                  <span className="text-muted">No Image</span>
                </div>
              )}
              <div 
                className="position-absolute top-0 end-0 m-2 p-1 bg-dark bg-opacity-75 rounded text-white"
                style={{ fontSize: '0.8rem' }}
              >
                QTY: {mini.quantity}
              </div>
            </div>
            <Card.Body className="d-flex flex-column">
              <Card.Title className="h6">
                <a 
                  href={`https://www.miniscollector.com/minis/gallery?title=${encodeURIComponent(mini.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-decoration-none"
                >
                  {mini.name}
                </a>
              </Card.Title>
              
              {mini.location && (
                <div className="mb-2">
                  <small className="text-muted">Location:</small> {mini.location}
                </div>
              )}

              {mini.formattedProductSets?.length > 0 && (
                <div className="mb-2">
                  <small className="text-muted">Product Sets:</small>
                  {mini.formattedProductSets.map((set, idx) => (
                    <div key={idx} className="ms-2 mt-1" style={{ fontSize: '0.75rem' }}>
                      <div className="fw-bold">{set.manufacturer}</div>
                      <div>· {set.productLine}</div>
                      <div>·· {set.setName}</div>
                    </div>
                  ))}
                </div>
              )}

              {mini.categories?.length > 0 && (
                <div className="mb-2">
                  <small className="text-muted">Categories:</small>
                  <div className="d-flex flex-wrap gap-1">
                    {mini.categories.map((cat, idx) => (
                      <span key={idx} className="badge bg-secondary">{cat}</span>
                    ))}
                  </div>
                </div>
              )}

              {mini.types?.length > 0 && (
                <div className="mb-2">
                  <small className="text-muted">Types:</small>
                  <div className="d-flex flex-wrap gap-1">
                    {mini.types.map((type, idx) => (
                      <span key={idx} className="badge bg-info">{type}</span>
                    ))}
                  </div>
                </div>
              )}

              {mini.proxyTypes?.length > 0 && (
                <div className="mb-2">
                  <small className="text-muted">Proxy Types:</small>
                  <div className="d-flex flex-wrap gap-1">
                    {mini.proxyTypes.map((type, idx) => (
                      <span key={idx} className="badge bg-warning text-dark">{type}</span>
                    ))}
                  </div>
                </div>
              )}

              {mini.tags?.length > 0 && (
                <div className="mb-2">
                  <small className="text-muted">Tags:</small>
                  <div className="d-flex flex-wrap gap-1">
                    {mini.tags.map((tag, idx) => (
                      <span key={idx} className="badge bg-primary">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </Card.Body>
            <Card.Footer className="d-flex justify-content-end gap-2">
              <Button
                size="sm"
                variant="outline-info"
                onClick={() => onImageClick(mini)}
                disabled={!mini.image_path}
              >
                <FontAwesomeIcon icon={faImage} />
              </Button>
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() => onEdit(mini)}
              >
                <FontAwesomeIcon icon={faPencil} />
              </Button>
              <Button
                size="sm"
                variant="outline-danger"
                onClick={() => onDelete(mini.id)}
              >
                <FontAwesomeIcon icon={faTrash} />
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      ))}
    </Row>
  )
}

export default MiniCardGrid 