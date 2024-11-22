import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Card, Row, Col } from 'react-bootstrap'

const PageHeader = ({ 
  icon, 
  iconColor = "text-warning",
  title, 
  subtitle,
  children  // For custom content like the entries selector
}) => {
  return (
    <Card className="mb-4">
      <Card.Body>
        <Row className="align-items-center">
          <Col xs={6}>
            <div className="d-flex align-items-center">
              <FontAwesomeIcon 
                icon={icon} 
                className={`${iconColor} me-3`} 
                size="2x" 
              />
              <div>
                <h4 className="mb-0">{title}</h4>
                <small className="text-muted">{subtitle}</small>
              </div>
            </div>
          </Col>
          {children && (
            <Col xs={6} className="text-end">
              {children}
            </Col>
          )}
        </Row>
      </Card.Body>
    </Card>
  )
}

export default PageHeader 