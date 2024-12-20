import React from 'react'
import { Card } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faImage, faPencil, faTrash } from '@fortawesome/free-solid-svg-icons'
import TableButton from '../TableButton'
import MiniImage from '../MiniImage/MiniImage'

const MiniCard = ({ mini, onEdit, onDelete, onImageClick }) => {
  return (
    <Card className="h-100 mini-card">
      <div className="mini-card-image-container">
        <MiniImage
          src={mini.image_path}
          alt={mini.name}
          onClick={() => onImageClick(mini)}
          size={200}
          className="w-100"
          useOriginal={true}
        />
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