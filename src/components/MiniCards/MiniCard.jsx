import React from 'react'
import { Card } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faImage, faPencil, faTrash } from '@fortawesome/free-solid-svg-icons'
import TableButton from '../TableButton'

const MiniCard = ({ mini, onEdit, onDelete, onImageClick }) => {
  return (
    <Card className="h-100 mini-card">
      <div className="mini-card-image-container">
        {mini.image_path ? (
          <Card.Img 
            variant="top" 
            src={mini.image_path} 
            onClick={() => onImageClick(mini)}
            style={{ cursor: 'pointer' }}
          />
        ) : (
          <div className="no-image-placeholder">
            No Image
          </div>
        )}
      </div>
      <Card.Body>
        <Card.Title>
          <a 
            href={`https://www.miniscollector.com/minis/gallery?title=${encodeURIComponent(mini.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-decoration-none"
          >
            {mini.name}
          </a>
        </Card.Title>
        <div className="mini-details">
          <small className="text-muted">Location: {mini.location}</small>
          <div className="mt-2">
            {mini.category_names?.split(',').map((cat, idx) => (
              <span key={idx} className="badge bg-secondary me-1 mb-1">{cat}</span>
            ))}
          </div>
        </div>
      </Card.Body>
      <Card.Footer className="bg-transparent">
        <div className="d-flex justify-content-end gap-2">
          <TableButton
            icon={faImage}
            variant="info"
            onClick={() => onImageClick(mini)}
            title="View Image"
            disabled={!mini.image_path}
          />
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
  )
}

export default MiniCard 