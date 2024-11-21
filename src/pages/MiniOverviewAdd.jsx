import React, { useState, useEffect } from 'react'
import { Modal, Button, Form, Card, Row, Col } from 'react-bootstrap'
import { faImage } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { api } from '../database/db'
import SearchableSelect from '../components/SearchableSelect'
import TagInput from '../components/TagInput'
import '../styles/ImageModal.css'

const MiniOverviewAdd = ({ show, handleClose, categories, types, tags, productSets, setMinis, minis }) => {
  // Form state for new mini
  const [newMini, setNewMini] = useState({
    name: '',
    description: '',
    location: '',
    image_path: '',
    quantity: 1,
    categories: [], // Array of category IDs
    types: [], // Array of type IDs
    proxy_types: [], // Array of type IDs for proxy uses
    tags: [], // Array of tag names
    product_sets: [], // Array of product set IDs
    painted_by: 'prepainted'
  })

  // Validation state
  const [validationErrors, setValidationErrors] = useState({
    name: false,
    location: false,
    categories: false,
    types: false
  })

  // Handler for image upload and compression
  const handleImageUpload = async (file) => {
    if (!file) return

    try {
      const compressedImage = await compressImage(file)
      setNewMini(prev => ({
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

  // Handler for adding a new mini
  const handleAddMini = async (e) => {
    e.preventDefault()

    // Reset previous validation errors
    setValidationErrors({
      name: false,
      location: false,
      categories: false,
      types: false
    })

    // Validate required fields
    const errors = {
      name: !newMini.name.trim(),
      location: !newMini.location.trim(),
      categories: newMini.categories.length === 0,
      types: newMini.types.length === 0
    }

    setValidationErrors(errors)

    // If any validation fails, stop here
    if (Object.values(errors).some(Boolean)) {
      return
    }

    try {
      const miniToSave = {
        ...newMini,
        name: newMini.name.trim(),
        location: newMini.location.trim(),
        description: newMini.description.trim(),
      }

      const response = await api.post('/api/minis', miniToSave)
      const savedMini = {
        ...response.data,
        image_path: response.data.image_path ? `${response.data.image_path}?t=${Date.now()}` : null,
        original_image_path: response.data.original_image_path ? `${response.data.original_image_path}?t=${Date.now()}` : null
      }

      setMinis([savedMini, ...minis])
      handleClose()
      // Reset form
      setNewMini({
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
    } catch (err) {
      console.error('Error adding mini:', err)
      alert(err.response?.data?.error || 'Failed to add mini.')
    }
  }

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton className="bg-primary bg-opacity-10">
        <Modal.Title>Add New Mini</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleAddMini}>
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
                    onClick={() => document.getElementById('add-image-upload').click()}
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
                      id="add-image-upload"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) {
                          handleImageUpload(file)
                        }
                      }}
                    />
                    {newMini.image_path ? (
                      <img 
                        src={newMini.image_path} 
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
                          value={newMini.name}
                          onChange={(e) => setNewMini({...newMini, name: e.target.value})}
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
                            id="painted-prepainted"
                            label="Pre-painted"
                            name="paintedBy"
                            value="prepainted"
                            checked={newMini.painted_by === 'prepainted'}
                            onChange={(e) => setNewMini({...newMini, painted_by: e.target.value})}
                          />
                          <Form.Check
                            type="radio"
                            id="painted-self"
                            label="Self"
                            name="paintedBy"
                            value="self"
                            checked={newMini.painted_by === 'self'}
                            onChange={(e) => setNewMini({...newMini, painted_by: e.target.value})}
                          />
                          <Form.Check
                            type="radio"
                            id="painted-other"
                            label="Other"
                            name="paintedBy"
                            value="other"
                            checked={newMini.painted_by === 'other'}
                            onChange={(e) => setNewMini({...newMini, painted_by: e.target.value})}
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
                          value={newMini.location}
                          onChange={(e) => setNewMini({...newMini, location: e.target.value})}
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
                          value={newMini.description}
                          onChange={(e) => setNewMini({...newMini, description: e.target.value})}
                          style={{ minHeight: '38px' }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Col>
              </Row>
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
                      items={categories}
                      value={newMini.categories}
                      onChange={(selectedCategories) => setNewMini({...newMini, categories: selectedCategories })}
                      placeholder="Search categories..."
                      isInvalid={validationErrors.categories}
                      multiple
                    />
                    <div className="mt-2">
                      {newMini.categories.map(catId => {
                        const category = categories.find(c => c.id.toString() === catId)
                        return category ? (
                          <span
                            key={category.id}
                            className="badge bg-primary me-1 mb-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              setNewMini(prev => ({
                                ...prev,
                                categories: prev.categories.filter(id => id !== catId)
                              }))
                            }}
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
                      items={types.filter(type => newMini.categories.includes(type.category_id.toString()))}
                      value={newMini.types}
                      onChange={(selectedTypes) => setNewMini({...newMini, types: selectedTypes })}
                      placeholder="Search types..."
                      renderOption={(type) => `${type.category_name}: ${type.name}`}
                      isInvalid={validationErrors.types}
                      multiple
                    />
                    <div className="mt-2">
                      {newMini.types.map(typeId => {
                        const type = types.find(t => t.id.toString() === typeId)
                        return type ? (
                          <span
                            key={type.id}
                            className="badge bg-primary me-1 mb-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              setNewMini(prev => ({
                                ...prev,
                                types: prev.types.filter(id => id !== typeId)
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
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Proxy Types</Form.Label>
                    <SearchableSelect
                      items={types.filter(type => !newMini.types.includes(type.id.toString()))}
                      value={newMini.proxy_types}
                      onChange={(selectedProxyTypes) => setNewMini({...newMini, proxy_types: selectedProxyTypes })}
                      placeholder="Search proxy types..."
                      renderOption={(type) => `${type.category_name}: ${type.name}`}
                      disabled={newMini.types.length === 0}
                      multiple
                    />
                    <div className="mt-2">
                      {newMini.proxy_types.map(typeId => {
                        const type = types.find(t => t.id.toString() === typeId)
                        return type ? (
                          <span
                            key={type.id}
                            className="badge bg-primary me-1 mb-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              setNewMini(prev => ({
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
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tags</Form.Label>
                    <TagInput
                      value={newMini.tags}
                      onChange={(tags) => setNewMini({...newMini, tags})}
                      existingTags={tags.map(tag => tag.name)}
                      placeholder="Type tag and press Enter or comma to add..."
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Product Set</Form.Label>
                    <SearchableSelect
                      items={productSets.filter(set => 
                        !newMini.product_sets.includes(set.id.toString())
                      )}
                      value={newMini.product_sets}
                      onChange={(selectedSet) => {
                        // If single set is selected (not array)
                        if (!Array.isArray(selectedSet)) {
                          setNewMini(prev => ({
                            ...prev,
                            product_sets: [...prev.product_sets, selectedSet.id.toString()]
                          }))
                        } else {
                          // If multiple sets are selected (array)
                          setNewMini(prev => ({
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
                      {Array.isArray(newMini.product_sets) && newMini.product_sets.map(setId => {
                        const set = productSets.find(s => s.id.toString() === setId)
                        return set ? (
                          <span
                            key={set.id}
                            className="badge bg-primary me-1 mb-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              setNewMini(prev => ({
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
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleAddMini}
          disabled={!newMini.name.trim() || !newMini.location.trim() || newMini.categories.length === 0 || newMini.types.length === 0}
        >
          Add Mini
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default MiniOverviewAdd 