import React from 'react'
import { Button } from 'react-bootstrap'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const AddButton = ({ onClick, disabled, type = 'submit' }) => {
  return (
    <Button 
      type={type}
      variant="light" 
      style={{ 
        backgroundColor: '#f0f0f0', 
        height: '31px', 
        fontSize: '12px', 
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: '1px solid #dee2e6',
        opacity: disabled ? 0.4 : 1
      }}
      className="d-flex align-items-center"
      disabled={disabled}
    >
      <FontAwesomeIcon icon={faPlus} className="me-2 text-success" />
      Add
    </Button>
  )
}

export default AddButton 