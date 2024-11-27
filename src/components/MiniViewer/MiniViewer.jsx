import React from 'react'
import { Modal, Row, Col, Badge } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMapMarkerAlt, faBox, faPaintBrush, faRuler, faTags, faLayerGroup, faShapes, faMagicWandSparkles, faIndustry, faDragon } from '@fortawesome/free-solid-svg-icons'
import MiniImage from '../MiniImage/MiniImage'
import './MiniViewer.css'

const MiniViewer = ({ show, onHide, mini, darkMode }) => {
  if (!mini) return null

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="lg"
      centered
      className={`mini-viewer ${darkMode ? 'dark-mode' : ''}`}
    >
      {mini.id && (
        <div 
          className="modal-background-image"
          style={{
            backgroundImage: `url(/images/minis/originals/${mini.id.toString()[0]}/${mini.id.toString()[1] || '0'}/${mini.id}.webp)`
          }}
        />
      )}
      <Modal.Header closeButton>
        <Modal.Title className="w-100">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <FontAwesomeIcon icon={faDragon} className="me-2 text-light" />
              <h5 className="mb-0">{mini.name}</h5>
            </div>
            {mini.manufacturer_name && (
              <img 
                src={`/images/manufacturers/${mini.manufacturer_name.toLowerCase()}.webp`}
                alt={mini.manufacturer_name}
                className="header-manufacturer-logo"
                onError={(e) => {
                  if (e.target) {
                    e.target.style.display = 'none'
                  }
                }}
              />
            )}
          </div>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col md={5} className="mini-image-section">
            <div className="mini-image-container">
              <MiniImage
                src={mini.image_path}
                alt={mini.name}
                size={300}
                showHoverEffect={false}
                useOriginal={true}
              />
              <div className="quantity-pill position-absolute top-0 end-0 m-2">
                QTY: {mini.quantity}
              </div>
            </div>
            {mini.category_names && (
              <section className="detail-section mt-3">
                <h5 className="section-title">
                  <FontAwesomeIcon icon={faLayerGroup} className="me-2" />
                  Categories
                </h5>
                <div className="badge-container">
                  {mini.category_names.split(',').map((cat, idx) => (
                    <Badge key={idx} bg="secondary">{cat.trim()}</Badge>
                  ))}
                </div>
              </section>
            )}
            {mini.type_names && (
              <section className="detail-section mt-3">
                <h5 className="section-title">
                  <FontAwesomeIcon icon={faShapes} className="me-2" />
                  Types
                </h5>
                <div className="badge-container">
                  {mini.type_names.split(',').map((type, idx) => (
                    <Badge key={idx} bg="info">{type.trim()}</Badge>
                  ))}
                </div>
              </section>
            )}
            {mini.proxy_type_names && (
              <section className="detail-section mt-3">
                <h5 className="section-title">
                  <FontAwesomeIcon icon={faMagicWandSparkles} className="me-2" />
                  Proxy Types
                </h5>
                <div className="badge-container">
                  {mini.proxy_type_names.split(',').map((type, idx) => (
                    <Badge key={idx} bg="warning" text="dark">{type.trim()}</Badge>
                  ))}
                </div>
              </section>
            )}
          </Col>
          <Col md={7} className="mini-details-section">
            <div className="detail-sections">
              <div className="info-grid">
                {mini.product_line_name && (
                  <div className="info-item">
                    <FontAwesomeIcon icon={faIndustry} />
                    <span>Product Line: {mini.product_line_name}</span>
                  </div>
                )}
                {mini.product_set_name && (
                  <div className="info-item">
                    <FontAwesomeIcon icon={faBox} />
                    <span>Product Set: {mini.product_set_name}</span>
                  </div>
                )}
                {mini.base_size_name && (
                  <div className="info-item">
                    <FontAwesomeIcon icon={faRuler} />
                    <span>Base Size: {mini.base_size_name.split('_')
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                      .join(' ')}
                    </span>
                  </div>
                )}
                {mini.location && (
                  <div className="info-item">
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                    <span>Location: {mini.location}</span>
                  </div>
                )}
                {mini.painted_by_name && (
                  <div className="info-item">
                    <FontAwesomeIcon icon={faPaintBrush} />
                    <span>Painted By: {mini.painted_by_name}</span>
                  </div>
                )}
              </div>
              {mini.description && (
                <section className="detail-section description mt-2">
                  <p className="description-text mb-0">{mini.description}</p>
                </section>
              )}
              {mini.tag_names && (
                <section className="detail-section tags mt-2">
                  <h5 className="section-title">
                    <FontAwesomeIcon icon={faTags} className="me-2" />
                    Tags
                  </h5>
                  <div className="badge-container">
                    {mini.tag_names.split(',').map((tag, idx) => (
                      <Badge key={idx} bg="primary" pill>{tag.trim()}</Badge>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </Col>
        </Row>
      </Modal.Body>
    </Modal>
  )
}

export default MiniViewer 