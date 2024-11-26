import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import TableButton from '../TableButton';
import './MiniCardGrid.css';

const MiniCardGrid = ({ minis, onImageClick, onMiniClick, onEditClick, onDeleteClick }) => {
  return (
    <Row className="g-3 p-3">
      {minis.map(mini => (
        <Col key={mini.id} xs={12} sm={6} md={4} lg={3}>
          <Card className="h-100">
            <div 
              className="mini-card-image"
              onClick={() => onImageClick(mini)}
              style={{
                backgroundImage: `url(${mini.image_path})`,
                cursor: 'pointer',
                height: '200px',
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            />
            <Card.Body>
              <Card.Title 
                className="h6" 
                style={{ cursor: 'pointer' }}
                onClick={() => onMiniClick(mini)}
              >
                {mini.name}
              </Card.Title>
              <div className="d-flex justify-content-end mt-2">
                <TableButton
                  type="edit"
                  onClick={() => onEditClick(mini)}
                  className="me-2"
                />
                <TableButton
                  type="delete"
                  onClick={() => onDeleteClick(mini.id)}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default MiniCardGrid; 