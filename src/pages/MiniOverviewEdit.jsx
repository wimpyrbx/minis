import React, { useState, useEffect } from 'react'
import { Modal, Button, Form, Card, Row, Col } from 'react-bootstrap'
import { faImage } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { api } from '../database/db'
import SearchableSelect from '../components/SearchableSelect'
import TagInput from '../components/TagInput'
import '../styles/ImageModal.css'

const MiniOverviewEdit = ({ show, handleClose, categories, types, tags, productSets, mini, setMinis, minis }) => {
  // Form state for editing mini
  const [editingMini, setEditingMini] = useState({
    id: '',
    name: '',
    description: '',
    location: '',
    image_path: '',
    quantity: 1,
    categories: [],
    types: [],
    proxy_types: [],
    tags: [],
    product_sets: [],
    painted_by: 'prepainted'
  })

  // Validation state
  const [validationErrors, setValidationErrors] = useState({
    name: false,
    location: false,
    categories: false,
    types: false
  })

  // Add effect to handle modal open/close
  useEffect(() => {
    if (show) {
      if (mini) {
        console.log('Initializing edit modal with mini:', mini)
        
        // Split tag names into array if they exist
        const tagNames = mini.tag_names ? mini.tag_names.split(',').map(tag => tag.trim()) : []
        
        const newEditingMini = {
          id: mini.id,
          name: mini.name || '',
          description: mini.description || '',
          location: mini.location || '',
          image_path: mini.image_path || '',
          quantity: mini.quantity || 1,
          categories: mini.category_ids || [],
          types: mini.type_ids || [],
          proxy_types: mini.proxy_type_ids || [],
          tags: tagNames, // Use tag names instead of IDs
          product_sets: mini.product_set_ids || [],
          painted_by: mini.painted_by || 'prepainted'
        }

        console.log('Setting editingMini:', newEditingMini)
        setEditingMini(newEditingMini)
      }
    } else {
      // Modal is being closed - reset state
      setEditingMini({
        id: '',
        name: '',
        description: '',
        location: '',
        image_path: '',
        quantity: 1,
        categories: [],
        types: [],
        proxy_types: [],
        tags: [],
        product_sets: [],
        painted_by: 'prepainted'
      })
      setValidationErrors({
        name: false,
        location: false,
        categories: false,
        types: false
      })
    }
  }, [show, mini])

  // Create a wrapper for handleClose that ensures state is reset
  const handleModalClose = () => {
    handleClose()
  }

  // Log the state after it's been set
  useEffect(() => {
    console.log('Current editingMini state:', editingMini)
  }, [editingMini])

  // Handler for image upload and compression
  const handleImageUpload = async (file) => {
    if (!file) return

    try {
      const compressedImage = await compressImage(file)
      setEditingMini(prev => ({
        ...prev,
        image_path: compressedImage
      }))
    } catch (error) {
      console.error('Error compressing image:', error)
    }
  }

  // Image compression function
  const compressImage = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Max dimensions
          const MAX_WIDTH = 1200
          const MAX_HEIGHT = 1200

          // Calculate new dimensions
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          // Convert to WebP with reduced quality
          const compressedImage = canvas.toDataURL('image/webp', 0.8)
          resolve(compressedImage)
        }
        img.src = e.target.result
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Handler for updating the mini
  const handleUpdateMini = async () => {
    try {
      // Validate required fields
      const errors = {
        name: !editingMini.name.trim(),
        location: !editingMini.location.trim(),
        categories: editingMini.categories.length === 0,
        types: editingMini.types.length === 0
      }

      setValidationErrors(errors)

      if (Object.values(errors).some(Boolean)) {
        return
      }

      const miniToUpdate = {
        ...editingMini,
        name: editingMini.name.trim(),
        location: editingMini.location.trim(),
        description: editingMini.description.trim(),
        // Ensure arrays are properly formatted for the API
        categories: editingMini.categories,
        types: editingMini.types,
        proxy_types: editingMini.proxy_types,
        tags: editingMini.tags,
        product_sets: editingMini.product_sets
      }

      console.log('Sending update with data:', miniToUpdate)

      const response = await api.put(`/api/minis/${mini.id}`, miniToUpdate)
      const updatedMini = {
        ...response.data,
        image_path: response.data.image_path ? `${response.data.image_path}?t=${Date.now()}` : null,
        original_image_path: response.data.original_image_path ? `${response.data.original_image_path}?t=${Date.now()}` : null
      }

      setMinis(prevMinis => prevMinis.map(m => m.id === mini.id ? updatedMini : m))
      handleClose()
    } catch (err) {
      console.error('Error updating mini:', err)
      alert(err.response?.data?.error || 'Failed to update mini.')
    }
  }

  // Update the category removal handler
  const handleRemoveCategory = (catId) => {
    setEditingMini(prev => {
      // Get types that belong to this category
      const typesInCategory = types.filter(t => 
        t.category_id.toString() === catId.toString()
      ).map(t => t.id.toString())

      // Get current types excluding those from the removed category
      const updatedTypes = prev.types.filter(typeId => 
        !typesInCategory.includes(typeId)
      )

      // Only clear proxy types if no types remain after removal
      const updatedProxyTypes = updatedTypes.length === 0 ? [] : prev.proxy_types

      return {
        ...prev,
        categories: prev.categories.filter(id => id !== catId),
        types: updatedTypes,
        proxy_types: updatedProxyTypes
      }
    })
  }

  // Update the type removal handler
  const handleRemoveType = (typeId) => {
    setEditingMini(prev => {
      const updatedTypes = prev.types.filter(id => id !== typeId)
      
      // Only clear proxy types if no types remain
      return {
        ...prev,
        types: updatedTypes,
        proxy_types: updatedTypes.length === 0 ? [] : prev.proxy_types
      }
    })
  }

  return (
    <Modal show={show} onHide={handleModalClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Edit Mini</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={(e) => { e.preventDefault(); handleUpdateMini(); }}>
          {/* Basic Information Card */}
          <Card className="mb-3">
            <Card.Header className="bg-light d-flex align-items-center">
              <h6 className="mb-0">Basic Information</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <h6 className="mb-2">Image</h6>
                  <div 
                    className="image-drop-zone"
                    style={{
                      height: '76px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    onClick={() => document.getElementById('edit-image-upload').click()}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.add('dragging')
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.remove('dragging')
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.currentTarget.classList.remove('dragging')
                      const file = e.dataTransfer.files[0]
                      if (file && file.type.startsWith('image/')) {
                        handleImageUpload(file)
                      }
                    }}
                  >
                    <input
                      type="file"
                      id="edit-image-upload"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                          handleImageUpload(file)
                        }
                      }}
                    />
                    {editingMini.image_path ? (
                      <img 
                        src={editingMini.image_path} 
                        alt="Preview" 
                        style={{ 
                          maxHeight: '100%', 
                          maxWidth: '100%', 
                          objectFit: 'contain' 
                        }} 
                      />
                    ) : (
                      <FontAwesomeIcon 
                        icon={faImage} 
                        size="2x" 
                        className="text-muted" 
                      />
                    )}
                  </div>
                </Col>
                <Col md={9}>
                  <Row>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          value={editingMini.name}
                          onChange={(e) => setEditingMini(prev => ({ ...prev, name: e.target.value }))}
                          required
                          isInvalid={validationErrors.name}
                        />
                        {validationErrors.name && (
                          <Form.Control.Feedback type="invalid">
                            Name is required
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Painted By</Form.Label>
                        <div className="d-flex gap-3">
                          <Form.Check
                            type="radio"
                            id="painted-prepainted-edit"
                            label="Pre-painted"
                            name="paintedByEdit"
                            value="prepainted"
                            checked={editingMini.painted_by === 'prepainted'}
                            onChange={(e) => setEditingMini(prev => ({ ...prev, painted_by: e.target.value }))}
                          />
                          <Form.Check
                            type="radio"
                            id="painted-self-edit"
                            label="Self"
                            name="paintedByEdit"
                            value="self"
                            checked={editingMini.painted_by === 'self'}
                            onChange={(e) => setEditingMini(prev => ({ ...prev, painted_by: e.target.value }))}
                          />
                          <Form.Check
                            type="radio"
                            id="painted-other-edit"
                            label="Other"
                            name="paintedByEdit"
                            value="other"
                            checked={editingMini.painted_by === 'other'}
                            onChange={(e) => setEditingMini(prev => ({ ...prev, painted_by: e.target.value }))}
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row className="mt-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Location <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          value={editingMini.location}
                          onChange={(e) => setEditingMini(prev => ({ ...prev, location: e.target.value }))}
                          required
                          isInvalid={validationErrors.location}
                        />
                        {validationErrors.location && (
                          <Form.Control.Feedback type="invalid">
                            Location is required
                          </Form.Control.Feedback>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={editingMini.description}
                          onChange={(e) => setEditingMini(prev => ({ ...prev, description: e.target.value }))}
                          style={{ minHeight: '38px' }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Col>
              </Row>

              <Form.Group className="mt-3">
                <Form.Label>Quantity: {editingMini.quantity}</Form.Label>
                <Form.Range
                  min={1}
                  max={100}
                  value={editingMini.quantity}
                  onChange={(e) => setEditingMini(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                />
              </Form.Group>
            </Card.Body>
          </Card>

          {/* Classification and Information Card */}
          <Card className="mb-3">
            <Card.Header className="bg-light d-flex align-items-center">
              <h6 className="mb-0">Classification & Information</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Categories <span className="text-danger">*</span>
                    </Form.Label>
                    <SearchableSelect
                      items={categories.filter(cat => 
                        // Only show categories that aren't already selected
                        !editingMini.categories.includes(cat.id.toString())
                      )}
                      value={editingMini.categories}
                      onChange={(selectedCategory) => {
                        // If single category is selected (not array)
                        if (!Array.isArray(selectedCategory)) {
                          setEditingMini(prev => ({
                            ...prev,
                            categories: [...prev.categories, selectedCategory.id.toString()]
                          }))
                        } else {
                          // If multiple categories are selected (array)
                          setEditingMini(prev => ({
                            ...prev,
                            categories: selectedCategory.map(cat => cat.id.toString())
                          }))
                        }
                      }}
                      placeholder="Search categories..."
                      isInvalid={validationErrors.categories}
                      multiple
                    />
                    <div className="mt-2">
                      {Array.isArray(editingMini.categories) && editingMini.categories.map(catId => {
                        const category = categories.find(c => c.id.toString() === catId)
                        return category ? (
                          <span
                            key={category.id}
                            className="badge bg-primary me-1 mb-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleRemoveCategory(catId)}
                          >
                            {category.name} ×
                          </span>
                        ) : null
                      })}
                    </div>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>
                      Types <span className="text-danger">*</span>
                    </Form.Label>
                    <SearchableSelect
                      items={types.filter(type => 
                        Array.isArray(editingMini.categories) && 
                        editingMini.categories.some(catId => catId === type.category_id.toString()) &&
                        // Only show types that aren't already selected
                        !editingMini.types.includes(type.id.toString())
                      )}
                      value={editingMini.types}
                      onChange={(selectedType) => {
                        // If single type is selected (not array)
                        if (!Array.isArray(selectedType)) {
                          setEditingMini(prev => ({
                            ...prev,
                            types: [...prev.types, selectedType.id.toString()]
                          }))
                        } else {
                          // If multiple types are selected (array)
                          setEditingMini(prev => ({
                            ...prev,
                            types: selectedType.map(type => type.id.toString())
                          }))
                        }
                      }}
                      placeholder="Search types..."
                      renderOption={(type) => `${type.category_name}: ${type.name}`}
                      isInvalid={validationErrors.types}
                      multiple
                    />
                    <div className="mt-2">
                      {Array.isArray(editingMini.types) && editingMini.types.map(typeId => {
                        const type = types.find(t => t.id.toString() === typeId)
                        return type ? (
                          <span
                            key={type.id}
                            className="badge bg-primary me-1 mb-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleRemoveType(typeId)}
                          >
                            {`${type.category_name}: ${type.name}`} ×
                          </span>
                        ) : null
                      })}
                    </div>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Proxy Types</Form.Label>
                    <SearchableSelect
                      items={types.filter(type => 
                        Array.isArray(editingMini.types) && 
                        !editingMini.types.includes(type.id.toString())
                      )}
                      value={editingMini.proxy_types}
                      onChange={(type) => {
                        // If single type is selected (not array)
                        if (!Array.isArray(type)) {
                          setEditingMini(prev => ({
                            ...prev,
                            proxy_types: [...prev.proxy_types, type.id.toString()]
                          }))
                        } else {
                          // If multiple types are selected (array)
                          setEditingMini(prev => ({
                            ...prev,
                            proxy_types: type.map(t => t.id.toString())
                          }))
                        }
                      }}
                      placeholder="Search proxy types..."
                      renderOption={(type) => `${type.category_name}: ${type.name}`}
                      disabled={!editingMini.types.length}
                      multiple
                    />
                    <div className="mt-2">
                      {Array.isArray(editingMini.proxy_types) && editingMini.proxy_types.map(typeId => {
                        const type = types.find(t => t.id.toString() === typeId)
                        return type ? (
                          <span
                            key={type.id}
                            className="badge bg-primary me-1 mb-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              setEditingMini(prev => ({
                                ...prev,
                                proxy_types: prev.proxy_types.filter(id => id !== typeId)
                              }))
                            }}
                          >
                            {`${type.category_name}: ${type.name}`} ×
                          </span>
                        ) : null
                      })}
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={5}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tags</Form.Label>
                    <TagInput
                      value={editingMini.tags}
                      onChange={(tags) => setEditingMini({...editingMini, tags})}
                      existingTags={tags.map(tag => tag.name)}
                      placeholder="Type tag and press Enter or comma to add..."
                    />
                  </Form.Group>
                </Col>
                <Col md={7}>
                  <Form.Group className="mb-3">
                    <Form.Label>Product Set</Form.Label>
                    <SearchableSelect
                      items={productSets.filter(set => 
                        !editingMini.product_sets.includes(set.id.toString())
                      )}
                      value={editingMini.product_sets}
                      onChange={(selectedSet) => {
                        // If single set is selected (not array)
                        if (!Array.isArray(selectedSet)) {
                          setEditingMini(prev => ({
                            ...prev,
                            product_sets: [...prev.product_sets, selectedSet.id.toString()]
                          }))
                        } else {
                          // If multiple sets are selected (array)
                          setEditingMini(prev => ({
                            ...prev,
                            product_sets: selectedSet.map(set => set.id.toString())
                          }))
                        }
                      }}
                      placeholder="Search product sets..."
                      renderOption={(set) => `${set.manufacturer_name} » ${set.product_line_name} » ${set.name}`}
                      multiple
                    />
                    <div className="mt-2">
                      {Array.isArray(editingMini.product_sets) && editingMini.product_sets.map(setId => {
                        const set = productSets.find(s => s.id.toString() === setId)
                        return set ? (
                          <span
                            key={set.id}
                            className="badge bg-primary me-1 mb-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              setEditingMini(prev => ({
                                ...prev,
                                product_sets: prev.product_sets.filter(id => id !== setId)
                              }))
                            }}
                          >
                            {`${set.manufacturer_name} » ${set.product_line_name} » ${set.name}`} ×
                          </span>
                        ) : null
                      })}
                    </div>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleModalClose}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleUpdateMini}
          disabled={
            !editingMini.name.trim() || 
            !editingMini.location.trim() || 
            editingMini.categories.length === 0 || 
            editingMini.types.length === 0
          }
        >
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default MiniOverviewEdit 