import React, { useState, useEffect } from 'react'
import { Modal, Button, Form, Card, Row, Col, Alert } from 'react-bootstrap'
import { faImage, faDiceD20 } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { api } from '../database/db'
import SearchableSelect from '../components/SearchableSelect'
import TagInput from '../components/TagInput'
import '../styles/ImageModal.css'

const MiniOverviewAdd = ({ show, handleClose, categories, types, tags, productSets, setMinis, minis, baseSizes }) => {
  // Form state for new mini
  const [newMini, setNewMini] = useState({
    name: '',
    description: '',
    location: '',
    image_path: '',
    quantity: 1,
    base_size_id: '3',
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

  // Add error state
  const [error, setError] = useState(null)

  // Fetch painted_by options and update state
  const [paintedByOptions, setPaintedByOptions] = useState([])

  useEffect(() => {
    const fetchPaintedByOptions = async () => {
      try {
        const response = await api.get('/api/painted-by')
        setPaintedByOptions(response.data)
      } catch (error) {
        console.error('Error fetching painted by options:', error)
      }
    }

    fetchPaintedByOptions()
  }, [])

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
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validate required fields
    const errors = {
      name: !newMini.name.trim(),
      location: !newMini.location.trim(),
      categories: newMini.categories.length === 0,
      types: newMini.types.length === 0
    }

    setValidationErrors(errors)

    if (Object.values(errors).some(Boolean)) {
      return
    }

    try {
      const miniData = {
        name: String(newMini.name.trim()),
        description: String(newMini.description?.trim() || ''),
        location: String(newMini.location.trim()),
        quantity: String(newMini.quantity),
        categories: newMini.categories,
        types: newMini.types,
        proxy_types: newMini.proxy_types,
        product_sets: newMini.product_sets,
        base_size_id: newMini.base_size_id,
        tags: newMini.tags,
        painted_by: String(newMini.painted_by)
      }

      const formData = new FormData()
      Object.entries(miniData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value))
        } else {
          formData.append(key, value)
        }
      })

      if (newMini.image_path && newMini.image_path.startsWith('data:')) {
        formData.append('image', newMini.image_path)
      }

      console.log('Sending data to add mini:', {
        formData: Object.fromEntries(formData.entries()),
        miniData,
        newMini
      })

      const response = await api.post('/api/minis', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      const responseData = response.data

      // Format the new mini to match the expected structure
      const formattedMini = {
        ...responseData,
        ...miniData,
        categories: miniData.category_names ? miniData.category_names.split(',').map(cat => cat.trim()) : [],
        types: miniData.type_names ? miniData.type_names.split(',').map(type => type.trim()) : [],
        proxyTypes: miniData.proxy_type_names ? miniData.proxy_type_names.split(',').map(type => type.trim()) : [],
        tags: newMini.tags,
        formattedProductSets: miniData.product_set_names ? 
          miniData.product_set_names.split(',').map(setName => {
            const matches = setName.trim().match(/(.+?)\s*\((.+?)\s+by\s+(.+?)\)/)
            if (matches) {
              const [_, setName, productLine, manufacturer] = matches
              return {
                manufacturer,
                productLine,
                setName
              }
            }
            return { setName }
          }) : []
      }

      setMinis(prevMinis => [...prevMinis, formattedMini])
      handleClose()
      resetForm()
    } catch (error) {
      console.error('Error adding mini:', error)
      setError(error.response?.data?.error || error.message)
    }
  }

  // Add resetForm function if not already present
  const resetForm = () => {
    setNewMini({
      name: '',
      description: '',
      location: '',
      image_path: '',
      quantity: 1,
      base_size_id: '3',
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
    setError(null)
  }

  // Update the getAvailableTypes function to properly filter types based on selected categories
  const getAvailableTypes = (selectedCategoryIds) => {
    return types.filter(type => 
      // Type belongs to one of the selected categories
      selectedCategoryIds.includes(type.category_id.toString()) &&
      // Type is not already selected
      !newMini.types.includes(type.id.toString())
    )
  }

  // Update the handleCategoryChange function
  const handleCategoryChange = (selectedCategories) => {
    // Handle both array of categories and single category removal
    let categoryIds
    if (Array.isArray(selectedCategories)) {
      categoryIds = selectedCategories.map(cat => cat.id.toString())
    } else if (typeof selectedCategories === 'string') {
      // If we're removing a category (passed as ID string)
      categoryIds = newMini.categories.filter(id => id !== selectedCategories)
    } else if (selectedCategories) {
      // If single category selected
      categoryIds = [...newMini.categories, selectedCategories.id.toString()]
    } else {
      categoryIds = []
    }

    // Find types that need to be removed (types whose categories are no longer selected)
    const typesToRemove = newMini.types.filter(typeId => {
      const type = types.find(t => t.id.toString() === typeId)
      return type && !categoryIds.includes(type.category_id.toString())
    })

    // Calculate the remaining types after removal
    const remainingTypes = newMini.types.filter(typeId => !typesToRemove.includes(typeId))

    setNewMini(prev => ({
      ...prev,
      categories: categoryIds,
      // Remove types that belong to unselected categories
      types: remainingTypes,
      // Clear proxy types if no types remain after category removal
      proxy_types: remainingTypes.length === 0 ? [] : prev.proxy_types
    }))
  }

  return (
    <Modal show={show} onHide={handleClose} size="xl">
      <Modal.Header closeButton>
        <Modal.Title>
          <FontAwesomeIcon icon={faDiceD20} className="me-2" />
          Add New Mini
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}
        <Form onSubmit={handleSubmit}>
          {/* Basic Information Card */}
          <Card className="mb-3">
            <Card.Header className="bg-light d-flex align-items-center">
              <h6 className="mb-0">Basic Information</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={2}>
                  <h6 className="mb-2">Image</h6>
                  <div 
                    className="image-drop-zone"
                    style={{
                      width: '100%',
                      aspectRatio: '1/1',
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
                <Col md={10}>
                  <Row>
                    <Col md={3}>
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
                    <Col md={3}>
                      <Form.Group>
                        <Form.Label>Base Size:</Form.Label>
                        <Form.Select
                          value={newMini.base_size_id}
                          onChange={(e) => setNewMini(prev => ({ ...prev, base_size_id: e.target.value }))}
                        >
                          {baseSizes.map(size => (
                            <option key={size.id} value={size.id}>
                              {size.base_size_name.split('_')
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                .join(' ')}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={2}>
                      <Form.Group>
                        <Form.Label>Quantity</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          value={newMini.quantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1
                            if (value > 0) {
                              setNewMini(prev => ({ ...prev, quantity: value }))
                            }
                          }}
                          required
                          style={{ width: '60px' }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label>Painted By</Form.Label>
                        <div className="d-flex gap-3">
                          <Form.Check
                            type="radio"
                            id="painted-prepainted"
                            label="Pre-Painted"
                            name="paintedBy"
                            value="prepainted"
                            checked={newMini.painted_by === 'prepainted'}
                            onChange={(e) => setNewMini(prev => ({ ...prev, painted_by: e.target.value }))}
                          />
                          <Form.Check
                            type="radio"
                            id="painted-self"
                            label="Self"
                            name="paintedBy"
                            value="self"
                            checked={newMini.painted_by === 'self'}
                            onChange={(e) => setNewMini(prev => ({ ...prev, painted_by: e.target.value }))}
                          />
                          <Form.Check
                            type="radio"
                            id="painted-other"
                            label="Other"
                            name="paintedBy"
                            value="other"
                            checked={newMini.painted_by === 'other'}
                            onChange={(e) => setNewMini(prev => ({ ...prev, painted_by: e.target.value }))}
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row className="mt-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          value={newMini.description}
                          onChange={(e) => setNewMini(prev => ({ ...prev, description: e.target.value }))}
                          style={{ height: '100px', minHeight: '100px' }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Product Set</Form.Label>
                        <SearchableSelect
                          items={productSets.filter(set => !newMini.product_sets.includes(set.id.toString()))}
                          value={newMini.product_sets}
                          onChange={(selectedSets) => {
                            let setIds
                            if (Array.isArray(selectedSets)) {
                              setIds = selectedSets.map(set => set.id.toString())
                            } else if (selectedSets) {
                              setIds = [selectedSets.id.toString()]
                            } else {
                              setIds = []
                            }
                            setNewMini(prev => ({
                              ...prev,
                              product_sets: setIds
                            }))
                          }}
                          placeholder="Search product sets..."
                          renderOption={(set) => `${set.manufacturer_name} » ${set.product_line_name} » ${set.name}`}
                          multiple={false}
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
                      <Form.Group>
                        <Form.Label>Tags</Form.Label>
                        <TagInput
                          value={newMini.tags}
                          onChange={(tags) => setNewMini({...newMini, tags})}
                          existingTags={tags.map(tag => tag.name)}
                          placeholder="Type tag and press Enter or comma to add..."
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
                      items={categories.filter(cat => !newMini.categories.includes(cat.id.toString()))}
                      value={newMini.categories}
                      onChange={(selectedCategories) => {
                        // Handle both single and multiple selections
                        let categoryIds
                        if (Array.isArray(selectedCategories)) {
                          // For multiple selections, filter out any already selected categories
                          categoryIds = selectedCategories
                            .map(cat => cat.id.toString())
                            .filter(id => !newMini.categories.includes(id))
                        } else if (selectedCategories) {
                          // For single selection, only add if not already selected
                          const newCatId = selectedCategories.id.toString()
                          if (!newMini.categories.includes(newCatId)) {
                            categoryIds = [...newMini.categories, newCatId]
                          } else {
                            categoryIds = newMini.categories
                          }
                        } else {
                          categoryIds = []
                        }

                        // Find types that need to be removed (types whose categories are no longer selected)
                        const typesToRemove = newMini.types.filter(typeId => {
                          const type = types.find(t => t.id.toString() === typeId)
                          return type && !categoryIds.includes(type.category_id.toString())
                        })

                        // Calculate remaining types
                        const remainingTypes = newMini.types.filter(typeId => !typesToRemove.includes(typeId))

                        setNewMini(prev => ({
                          ...prev,
                          categories: categoryIds,
                          types: remainingTypes,
                          proxy_types: remainingTypes.length === 0 ? [] : prev.proxy_types
                        }))
                      }}
                      placeholder="Search categories..."
                      renderOption={(cat) => cat.name}
                      isInvalid={validationErrors.categories}
                      multiple
                    />
                    <div className="mt-2">
                      {Array.isArray(newMini.categories) && newMini.categories.map(catId => {
                        const category = categories.find(c => c.id.toString() === catId)
                        return category ? (
                          <span
                            key={category.id}
                            className="badge bg-secondary me-1 mb-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleCategoryChange(catId)}
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
                      items={getAvailableTypes(newMini.categories)}
                      value={newMini.types}
                      onChange={(selectedTypes) => {
                        // Handle both single and multiple selections
                        let typeIds
                        if (Array.isArray(selectedTypes)) {
                          typeIds = selectedTypes.map(type => type.id.toString())
                        } else if (selectedTypes) {
                          typeIds = [...newMini.types, selectedTypes.id.toString()]
                        } else {
                          typeIds = []
                        }

                        setNewMini(prev => ({
                          ...prev,
                          types: typeIds,
                          proxy_types: typeIds.length === 0 ? [] : prev.proxy_types
                        }))
                      }}
                      placeholder="Search types..."
                      renderOption={(type) => {
                        const category = categories.find(c => c.id.toString() === type.category_id.toString())
                        return `${category?.name || ''}: ${type.name}`
                      }}
                      isInvalid={validationErrors.types}
                      disabled={newMini.categories.length === 0}
                      multiple
                    />
                    <div className="mt-2">
                      {Array.isArray(newMini.types) && newMini.types.map(typeId => {
                        const type = types.find(t => t.id.toString() === typeId)
                        const category = type ? categories.find(c => c.id.toString() === type.category_id.toString()) : null
                        return type ? (
                          <span
                            key={type.id}
                            className="badge bg-info me-1 mb-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              setNewMini(prev => {
                                const updatedTypes = prev.types.filter(id => id !== typeId)
                                return {
                                  ...prev,
                                  types: updatedTypes,
                                  // Clear proxy types if no types remain
                                  proxy_types: updatedTypes.length === 0 ? [] : prev.proxy_types
                                }
                              })
                            }}
                          >
                            {`${category?.name || ''}: ${type.name}`} ×
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
                      items={types.filter(type => !newMini.proxy_types.includes(type.id.toString()))}
                      value={newMini.proxy_types}
                      onChange={(selectedProxyTypes) => {
                        // Handle both single and multiple selections
                        let proxyTypeIds
                        if (Array.isArray(selectedProxyTypes)) {
                          proxyTypeIds = selectedProxyTypes.map(type => type.id.toString())
                        } else if (selectedProxyTypes) {
                          proxyTypeIds = [...newMini.proxy_types, selectedProxyTypes.id.toString()]
                        } else {
                          proxyTypeIds = []
                        }

                        setNewMini(prev => ({
                          ...prev,
                          proxy_types: proxyTypeIds
                        }))
                      }}
                      placeholder="Search proxy types..."
                      renderOption={(type) => `${type.category_name}: ${type.name}`}
                      disabled={newMini.types.length === 0}
                      multiple
                    />
                    <div className="mt-2">
                      {Array.isArray(newMini.proxy_types) && newMini.proxy_types.map(typeId => {
                        const type = types.find(t => t.id.toString() === typeId)
                        return type ? (
                          <span
                            key={type.id}
                            className="badge bg-warning text-dark me-1 mb-1"
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
          onClick={handleSubmit}
          disabled={!newMini.name.trim() || !newMini.location.trim() || newMini.categories.length === 0 || newMini.types.length === 0}
        >
          Add Mini
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default MiniOverviewAdd 