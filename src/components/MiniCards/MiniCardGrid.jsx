import React from 'react'
import { Row, Col } from 'react-bootstrap'
import MiniCard from './MiniCard'
import './MiniCards.css'

const MiniCardGrid = ({ minis, onEdit, onDelete, onImageClick }) => {
  return (
    <Row xs={1} md={2} lg={3} xl={4} className="g-4">
      {minis.map(mini => (
        <Col key={mini.id}>
          <MiniCard
            mini={mini}
            onEdit={onEdit}
            onDelete={onDelete}
            onImageClick={onImageClick}
          />
        </Col>
      ))}
    </Row>
  )
}

export default MiniCardGrid 