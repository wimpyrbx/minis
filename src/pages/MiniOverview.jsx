import React, { useState, useEffect, useRef } from 'react'
import { Container, Table, Form, Button, Card, Modal, Row, Col } from 'react-bootstrap'
import { faTable, faPlus, faImage, faPencil, faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { api } from '../database/db'
import SearchableSelect from '../components/SearchableSelect'
import TagInput from '../components/TagInput'
import { useTheme } from '../context/ThemeContext'
import ImageModal from '../components/ImageModal'
import '../styles/ImageModal.css'

const MiniOverview = () => {
  const { darkMode } = useTheme()
  const [showAddModal, setShowAddModal] = useState(false)
  const [categories, setCategories] = useState([])
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [existingTags, setExistingTags] = useState([])
  const [productSets, setProductSets] = useState([])
  const [minis, setMinis] = useState([])

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
    tags: [], // Array of tag names (will be created if they don't exist)
    product_sets: [] // Ensure this is initialized as an array
  })

  // Search and filter states
  const [categorySearch, setCategorySearch] = useState('')
  const [typeSearch, setTypeSearch] = useState('')
  const [proxyTypeSearch, setProxyTypeSearch] = useState('')
  const [filteredCategories, setFilteredCategories] = useState([])
  const [filteredTypes, setFilteredTypes] = useState([])
  const [filteredProxyTypes, setFilteredProxyTypes] = useState([])
  const [productSetSearch, setProductSetSearch] = useState('')
  const [filteredProductSets, setFilteredProductSets] = useState([])
  
  // Selected items states
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedTypes, setSelectedTypes] = useState([])
  const [selectedProxyTypes, setSelectedProxyTypes] = useState([])

  // Add new state for validation
  const [validationErrors, setValidationErrors] = useState({
    name: false,
    location: false,
    categories: false,
    types: false
  })

  // Add new state for edit modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMini, setEditingMini] = useState(null)

  // Add state for image modal
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  const fetchMinis = async () => {
    try {
      const response = await api.get('/api/minis')
      const timestamp = Date.now()
      const minisWithCacheBusting = response.data.map(mini => ({
        ...mini,
        image_path: mini.image_path ? `${mini.image_path}?t=${timestamp}` : null,
        original_image_path: mini.original_image_path ? `${mini.original_image_path}?t=${timestamp}` : null
      }))
      setMinis(minisWithCacheBusting)
    } catch (err) {
      console.error('Error fetching minis:', err)
      setError(err.message)
    }
  }

  useEffect(() => {
    fetchData()
    fetchMinis()
  }, [])

  const fetchData = async () => {
    try {
      const [categoriesRes, typesRes, tagsRes, productSetsRes] = await Promise.all([
        api.get('/api/categories'),
        api.get('/api/types'),
        api.get('/api/tags'),
        api.get('/api/product-sets')
      ])
      setCategories(categoriesRes.data)
      setTypes(typesRes.data)
      setExistingTags(tagsRes.data.map(tag => tag.name))
      setProductSets(productSetsRes.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMini = async (e) => {
    e.preventDefault()
    
    // Reset previous validation errors
    setError(null)
    
    // Check all validations
    const newValidationErrors = {
      name: !newMini.name.trim(),
      location: !newMini.location.trim(),
      categories: newMini.categories.length === 0,
      types: newMini.types.length === 0
    }
    
    setValidationErrors(newValidationErrors)
    
    // If any validation fails, stop here
    if (Object.values(newValidationErrors).some(Boolean)) {
      return
    }
    
    try {
      const miniToSave = {
        ...newMini,
        name: newMini.name.trim(),
        location: newMini.location.trim(),
        description: newMini.description.trim(),
      }
      
      console.log('Attempting to save mini with data:', JSON.stringify(miniToSave, null, 2))
      
      const response = await api.post('/api/minis', miniToSave)
      console.log('Server response:', response)
      
      setShowAddModal(false)
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
        product_sets: []
      })
      // Reset validation errors
      setValidationErrors({
        name: false,
        location: false,
        categories: false,
        types: false
      })
      fetchMinis()
    } catch (err) {
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        fullError: err
      })
      setError(err.response?.data?.error || err.message)
    }
  }

  // Filter and format types based on selected categories
  const getFilteredTypes = () => {
    if (selectedCategories.length === 0) return types

    return types
      .filter(type => selectedCategories.includes(type.category_id.toString()))
      .sort((a, b) => {
        // First sort by category name
        const catCompare = a.category_name.localeCompare(b.category_name)
        // If same category, sort by type name
        if (catCompare === 0) {
          return a.name.localeCompare(b.name)
        }
        return catCompare
      })
  }

  // Update the handleMultiSelect function
  const handleMultiSelect = (e, field) => {
    const options = [...e.target.selectedOptions]
    const values = options.map(option => option.value)
    
    if (field === 'categories') {
      setSelectedCategories(values)
      // Clear type selection if selected category is removed
      const newTypes = newMini.types.filter(typeId => {
        const type = types.find(t => t.id.toString() === typeId)
        return type && values.includes(type.category_id.toString())
      })
      setNewMini({ 
        ...newMini, 
        categories: values,
        types: newTypes
      })
    } else if (field === 'proxy_types') {
      setNewMini({ ...newMini, proxy_types: values })
    } else {
      setNewMini({ ...newMini, [field]: values })
    }
  }

  const handleTagInput = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
    setNewMini({ ...newMini, tags })
  }

  // Update the handleProxyTypeSearch function
  const handleProxyTypeSearch = (value) => {
    setProxyTypeSearch(value)
    if (value.trim()) {
      const filtered = types
        .filter(type => {
          // Exclude types that are already selected as regular types
          const isRegularType = newMini.types.includes(type.id.toString())
          // Exclude types that are already selected as proxy types
          const isProxyType = newMini.proxy_types.includes(type.id.toString())
          
          return !isRegularType && !isProxyType && 
            `${type.category_name}: ${type.name}`.toLowerCase()
              .includes(value.toLowerCase())
        })
        .slice(0, 5) // Limit to 5 suggestions
      setFilteredProxyTypes(filtered)
    } else {
      setFilteredProxyTypes([])
    }
  }

  // Also update the handleAddType function to remove the type from proxy types if it exists
  const handleAddType = (type) => {
    if (!newMini.types.includes(type.id.toString())) {
      // Remove from proxy types if it exists there
      const updatedProxyTypes = newMini.proxy_types.filter(id => id !== type.id.toString())
      const updatedSelectedProxyTypes = selectedProxyTypes.filter(t => t.id !== type.id)

      setNewMini({
        ...newMini,
        types: [...newMini.types, type.id.toString()],
        proxy_types: updatedProxyTypes
      })
      setSelectedTypes([...selectedTypes, type])
      setSelectedProxyTypes(updatedSelectedProxyTypes)
    }
    setTypeSearch('')
    setFilteredTypes([])
  }

  // And update handleAddProxyType to check if the type is already a regular type
  const handleAddProxyType = (type) => {
    if (!newMini.proxy_types.includes(type.id.toString()) && 
        !newMini.types.includes(type.id.toString())) {
      setNewMini({
        ...newMini,
        proxy_types: [...newMini.proxy_types, type.id.toString()]
      })
      setSelectedProxyTypes([...selectedProxyTypes, type])
    }
    setProxyTypeSearch('')
    setFilteredProxyTypes([])
  }

  // Add this function to remove a proxy type
  const handleRemoveProxyType = (typeId) => {
    setNewMini({
      ...newMini,
      proxy_types: newMini.proxy_types.filter(id => id !== typeId.toString())
    })
    setSelectedProxyTypes(selectedProxyTypes.filter(type => type.id !== typeId))
  }

  // Add these handlers
  const handleCategorySearch = (value) => {
    setCategorySearch(value)
    if (value.trim()) {
      const filtered = categories
        .filter(cat => 
          cat.name.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 5)
      setFilteredCategories(filtered)
    } else {
      setFilteredCategories([])
    }
  }

  const handleTypeSearch = (value) => {
    setTypeSearch(value)
    if (value.trim()) {
      const filtered = types
        .filter(type => {
          // Only show types from selected categories
          if (newMini.categories.length > 0) {
            return newMini.categories.includes(type.category_id.toString()) &&
              `${type.category_name}: ${type.name}`.toLowerCase()
                .includes(value.toLowerCase())
          }
          return `${type.category_name}: ${type.name}`.toLowerCase()
            .includes(value.toLowerCase())
        })
        .slice(0, 5)
      setFilteredTypes(filtered)
    } else {
      setFilteredTypes([])
    }
  }

  const handleAddCategory = (category) => {
    if (!newMini.categories.includes(category.id.toString())) {
      setNewMini({
        ...newMini,
        categories: [...newMini.categories, category.id.toString()]
      })
      setSelectedCategories([...selectedCategories, category])
    }
    setCategorySearch('')
    setFilteredCategories([])
  }

  const handleRemoveCategory = (categoryId) => {
    setNewMini({
      ...newMini,
      categories: newMini.categories.filter(id => id !== categoryId.toString()),
      // Also remove types that belong to this category
      types: newMini.types.filter(typeId => {
        const type = types.find(t => t.id.toString() === typeId)
        return type && type.category_id.toString() !== categoryId.toString()
      })
    })
    setSelectedCategories(selectedCategories.filter(cat => cat.id !== categoryId))
    // Also remove corresponding types from selectedTypes
    setSelectedTypes(selectedTypes.filter(type => 
      type.category_id.toString() !== categoryId.toString()
    ))
  }

  const handleRemoveType = (typeId) => {
    setNewMini({
      ...newMini,
      types: newMini.types.filter(id => id !== typeId.toString())
    })
    setSelectedTypes(selectedTypes.filter(type => type.id !== typeId))
  }

  // Add this function to handle image compression
  const compressImage = async (file) => {
    return new Promise((resolve) => {
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
      reader.readAsDataURL(file)
    })
  }

  // Update the image handling in both add and edit modals
  const handleImageUpload = async (file) => {
    if (!file) return
    
    try {
      const compressedImage = await compressImage(file)
      if (showAddModal) {
        setNewMini({
          ...newMini,
          image_path: compressedImage
        })
      } else if (showEditModal) {
        setEditingMini({
          ...editingMini,
          image_path: compressedImage
        })
      }
    } catch (error) {
      console.error('Error compressing image:', error)
      setError('Error processing image. Please try again.')
    }
  }

  const handleProductSetSearch = (value) => {
    setProductSetSearch(value)
    if (value.trim()) {
      const filtered = productSets
        .filter(set => 
          `${set.manufacturer_name}: ${set.product_line_name}: ${set.name}`.toLowerCase()
            .includes(value.toLowerCase())
        )
        .slice(0, 5) // Limit to 5 suggestions
      setFilteredProductSets(filtered)
    } else {
      setFilteredProductSets([])
    }
  }

  const handleAddProductSet = (productSet) => {
    if (newMini.product_sets.length === 0) {
      setNewMini({
        ...newMini,
        product_sets: [productSet.id.toString()]
      })
    }
    setProductSetSearch('')
    setFilteredProductSets([])
  }

  const handleRemoveProductSet = (setId) => {
    setNewMini({
      ...newMini,
      product_sets: newMini.product_sets.filter(id => id !== setId.toString())
    })
  }

  const handleDeleteMini = async (id) => {
    if (window.confirm('Are you sure you want to delete this mini?')) {
      try {
        await api.delete(`/api/minis/${id}`)
        fetchMinis()
      } catch (err) {
        console.error('Error deleting mini:', err)
        setError(err.response?.data?.error || err.message)
      }
    }
  }

  // Update the handleEditMini function
  const handleEditMini = (mini) => {
    // Get the related data arrays from the comma-separated strings
    const editMini = {
      ...mini,
      categories: [], // Will be populated from the database
      types: [],
      proxy_types: [],
      tags: mini.tag_names ? mini.tag_names.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      product_sets: []
    }

    // Fetch the complete mini data with all relationships
    api.get(`/api/minis/${mini.id}/relationships`)
      .then(response => {
        const completeData = {
          ...editMini,
          ...response.data,
          // Ensure tags are properly set from both sources
          tags: response.data.tags || editMini.tags
        }
        setEditingMini(completeData)
        setShowEditModal(true)
      })
      .catch(error => {
        console.error('Error fetching mini relationships:', error)
        setError(error.message)
      })
  }

  // Update the handleUpdateMini function
  const handleUpdateMini = async () => {
    try {
      // Validate required fields
      const errors = {
        name: !editingMini.name.trim(),
        location: !editingMini.location.trim(),
        categories: !editingMini.categories?.length,
        types: !editingMini.types?.length
      }

      if (Object.values(errors).some(Boolean)) {
        setValidationErrors(errors)
        return
      }

      const response = await api.put(`/api/minis/${editingMini.id}`, editingMini)
      
      // Add timestamp to image URLs to bust cache
      const updatedMini = {
        ...response.data,
        image_path: response.data.image_path ? `${response.data.image_path}?t=${Date.now()}` : null,
        original_image_path: response.data.original_image_path ? `${response.data.original_image_path}?t=${Date.now()}` : null
      }
      
      // Update the mini in the local state with cache-busting URLs
      setMinis(prevMinis => prevMinis.map(mini => 
        mini.id === editingMini.id ? updatedMini : mini
      ))

      setShowEditModal(false)
      setEditingMini(null)
      setValidationErrors({})
    } catch (error) {
      console.error('Error updating mini:', error)
      setError('Error updating mini. Please try again.')
    }
  }

  // Add handler for image click
  const handleImageClick = (mini) => {
    setSelectedImage({
      path: mini.original_image_path,
      name: mini.name
    })
    setShowImageModal(true)
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <Container fluid className="content">
      <Card className="mb-4">
        <Card.Body className="d-flex align-items-center">
          <FontAwesomeIcon icon={faTable} className="text-primary me-3" size="2x" />
          <div>
            <h4 className="mb-0">Mini Overview</h4>
            <small className="text-muted">View and manage your miniature collection</small>
          </div>
        </Card.Body>
      </Card>

      <div className="bg-white p-4 rounded shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="mb-0">Collection List</h5>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add New Mini
          </Button>
        </div>

        <Table hover responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Categories</th>
              <th>Types</th>
              <th>Proxy Types</th>
              <th>Product Sets</th>
              <th>Tags</th>
              <th>Quantity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {minis.map(mini => (
              <tr key={mini.id}>
                <td>
                  {mini.image_path && (
                    <img 
                      src={mini.image_path} 
                      alt={mini.name}
                      style={{ 
                        width: '50px', 
                        height: '50px', 
                        objectFit: 'cover',
                        marginRight: '10px',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleImageClick(mini)}
                      title="Click to view full image"
                    />
                  )}
                  {mini.name}
                </td>
                <td>{mini.location}</td>
                <td>{mini.category_names?.split(',').join(', ')}</td>
                <td>{mini.type_names?.split(',').join(', ')}</td>
                <td>{mini.proxy_type_names?.split(',').join(', ')}</td>
                <td>{mini.product_set_names?.split(',').join(', ')}</td>
                <td>{mini.tag_names?.split(',').join(', ')}</td>
                <td>{mini.quantity}</td>
                <td>
                  <Button
                    variant="primary"
                    size="sm"
                    className="me-2"
                    onClick={() => handleEditMini(mini)}
                  >
                    <FontAwesomeIcon icon={faPencil} />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteMini(mini.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Add Mini Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
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
                      onClick={() => document.getElementById('image-upload').click()}
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
                        id="image-upload"
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
                          className={darkMode ? 'text-light' : 'text-muted'} 
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
                    </Row>
                    <Row className="mt-3">
                      <Col>
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

                <Form.Group>
                  <Form.Label>Quantity: {newMini.quantity}</Form.Label>
                  <Form.Range
                    min={1}
                    max={100}
                    value={newMini.quantity}
                    onChange={(e) => setNewMini({...newMini, quantity: parseInt(e.target.value)})}
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Classification Card */}
            <Card className="mb-3">
              <Card.Header className="bg-light d-flex align-items-center">
                <h6 className="mb-0">Classification</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Categories <span className="text-danger">*</span></Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type="text"
                          value={categorySearch}
                          onChange={(e) => handleCategorySearch(e.target.value)}
                          placeholder="Type to search for categories..."
                          isInvalid={validationErrors.categories}
                        />
                        {filteredCategories.length > 0 && (
                          <div className="position-absolute w-100 bg-white border rounded shadow-sm" 
                               style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                            {filteredCategories.map(category => (
                              <div
                                key={category.id}
                                className="dropdown-item-hover"
                                onClick={() => handleAddCategory(category)}
                              >
                                {category.name}
                              </div>
                            ))}
                          </div>
                        )}
                        {validationErrors.categories && (
                          <div className="text-danger small mt-1">
                            At least one category is required
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        {selectedCategories.map(category => (
                          <span
                            key={category.id}
                            className="badge bg-primary me-1 mb-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleRemoveCategory(category.id)}
                          >
                            {category.name} ×
                          </span>
                        ))}
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Types <span className="text-danger">*</span></Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type="text"
                          value={typeSearch}
                          onChange={(e) => handleTypeSearch(e.target.value)}
                          placeholder="Type to search for types..."
                          disabled={selectedCategories.length === 0}
                          isInvalid={validationErrors.types}
                        />
                        {filteredTypes.length > 0 && (
                          <div className="position-absolute w-100 bg-white border rounded shadow-sm" 
                               style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                            {filteredTypes.map(type => (
                              <div
                                key={type.id}
                                className="dropdown-item-hover"
                                onClick={() => handleAddType(type)}
                              >
                                {`${type.category_name}: ${type.name}`}
                              </div>
                            ))}
                          </div>
                        )}
                        {validationErrors.types && (
                          <div className="text-danger small mt-1">
                            At least one type is required
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        {selectedTypes.map(type => (
                          <span
                            key={type.id}
                            className="badge bg-primary me-1 mb-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleRemoveType(type.id)}
                          >
                            {`${type.category_name}: ${type.name}`} ×
                          </span>
                        ))}
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Proxy Types</Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type="text"
                          value={proxyTypeSearch}
                          onChange={(e) => handleProxyTypeSearch(e.target.value)}
                          placeholder="Type to search for proxy types..."
                          disabled={selectedTypes.length === 0}
                        />
                        {filteredProxyTypes.length > 0 && (
                          <div className="position-absolute w-100 bg-white border rounded shadow-sm" 
                               style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                            {filteredProxyTypes.map(type => (
                              <div
                                key={type.id}
                                className="dropdown-item-hover"
                                onClick={() => handleAddProxyType(type)}
                              >
                                {`${type.category_name}: ${type.name}`}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        {selectedProxyTypes.map(type => (
                          <span
                            key={type.id}
                            className="badge bg-primary me-1 mb-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleRemoveProxyType(type.id)}
                          >
                            {`${type.category_name}: ${type.name}`} ×
                          </span>
                        ))}
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Tags and Product Information Card */}
            <Card className="mb-3">
              <Card.Header className="bg-light d-flex align-items-center">
                <h6 className="mb-0">Tags and Product Information</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tags</Form.Label>
                      <div className="position-relative">
                        <TagInput
                          value={newMini.tags}
                          onChange={(tags) => setNewMini({...newMini, tags})}
                          existingTags={existingTags}
                          placeholder="Type tag and press Enter or comma to add..."
                        />
                      </div>
                      <div className="mt-2">
                        {newMini.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="badge bg-primary me-1 mb-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleRemoveTag(tag)}
                          >
                            {tag} ×
                          </span>
                        ))}
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Product Set</Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type="text"
                          value={productSetSearch}
                          onChange={(e) => handleProductSetSearch(e.target.value)}
                          placeholder="Type to search for product sets..."
                        />
                        {filteredProductSets.length > 0 && (
                          <div className="position-absolute w-100 bg-white border rounded shadow-sm" 
                               style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                            {filteredProductSets.map(set => (
                              <div
                                key={set.id}
                                className="dropdown-item-hover"
                                onClick={() => handleAddProductSet(set)}
                              >
                                {`${set.manufacturer_name} » ${set.product_line_name} » ${set.name}`}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        {Array.isArray(newMini.product_sets) && newMini.product_sets.map(setId => {
                          const set = productSets?.find(s => s.id.toString() === setId);
                          return set ? (
                            <span
                              key={set.id}
                              className="badge bg-primary"
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleRemoveProductSet(set.id)}
                            >
                              {`${set.manufacturer_name} » ${set.product_line_name} » ${set.name}`} ×
                            </span>
                          ) : null;
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
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddMini}>
            Add Mini
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Mini Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Mini</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpdateMini}>
            {/* Basic Information Card */}
            <Card className="mb-3">
              <Card.Header className="bg-light d-flex align-items-center">
                <h6 className="mb-0">Basic Information</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3}>
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
                            const reader = new FileReader()
                            reader.onload = (e) => {
                              setEditingMini({
                                ...editingMini,
                                image_path: e.target.result
                              })
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                      {editingMini?.image_path ? (
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
                          className={darkMode ? 'text-light' : 'text-muted'} 
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
                            value={editingMini?.name || ''}
                            onChange={(e) => setEditingMini({...editingMini, name: e.target.value})}
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
                          <Form.Label>Location <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            value={editingMini?.location || ''}
                            onChange={(e) => setEditingMini({...editingMini, location: e.target.value})}
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
                    </Row>
                    <Row className="mt-3">
                      <Col>
                        <Form.Group>
                          <Form.Label>Description</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            value={editingMini?.description || ''}
                            onChange={(e) => setEditingMini({...editingMini, description: e.target.value})}
                            style={{ minHeight: '38px' }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Col>
                </Row>

                <Form.Group>
                  <Form.Label>Quantity: {editingMini?.quantity}</Form.Label>
                  <Form.Range
                    min={1}
                    max={100}
                    value={editingMini?.quantity || 1}
                    onChange={(e) => setEditingMini({...editingMini, quantity: parseInt(e.target.value)})}
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Classification Card */}
            <Card className="mb-3">
              <Card.Header className="bg-light d-flex align-items-center">
                <h6 className="mb-0">Classification</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Categories <span className="text-danger">*</span></Form.Label>
                      <SearchableSelect
                        items={categories}
                        value={editingMini?.categories || []}
                        onChange={(category) => {
                          if (!editingMini?.categories.includes(category.id.toString())) {
                            setEditingMini({
                              ...editingMini,
                              categories: [...(editingMini?.categories || []), category.id.toString()]
                            })
                          }
                        }}
                        placeholder="Search categories..."
                        isInvalid={validationErrors.categories}
                      />
                      <div className="mt-2">
                        {editingMini?.categories?.map(catId => {
                          const category = categories.find(c => c.id.toString() === catId)
                          return category ? (
                            <span
                              key={category.id}
                              className="badge bg-primary me-1 mb-1"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                setEditingMini({
                                  ...editingMini,
                                  categories: editingMini.categories.filter(id => id !== catId)
                                })
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
                      <Form.Label>Types <span className="text-danger">*</span></Form.Label>
                      <SearchableSelect
                        items={types.filter(type => 
                          editingMini?.categories?.includes(type.category_id.toString())
                        )}
                        value={editingMini?.types || []}
                        onChange={(type) => {
                          if (!editingMini?.types.includes(type.id.toString())) {
                            setEditingMini({
                              ...editingMini,
                              types: [...(editingMini?.types || []), type.id.toString()]
                            })
                          }
                        }}
                        placeholder="Search types..."
                        renderOption={(type) => `${type.category_name}: ${type.name}`}
                        isInvalid={validationErrors.types}
                      />
                      <div className="mt-2">
                        {editingMini?.types?.map(typeId => {
                          const type = types.find(t => t.id.toString() === typeId)
                          return type ? (
                            <span
                              key={type.id}
                              className="badge bg-primary me-1 mb-1"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                setEditingMini({
                                  ...editingMini,
                                  types: editingMini.types.filter(id => id !== typeId)
                                })
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
                        items={types.filter(type => 
                          !editingMini?.types?.includes(type.id.toString())
                        )}
                        value={editingMini?.proxy_types || []}
                        onChange={(type) => {
                          if (!editingMini?.proxy_types?.includes(type.id.toString())) {
                            setEditingMini({
                              ...editingMini,
                              proxy_types: [...(editingMini?.proxy_types || []), type.id.toString()]
                            })
                          }
                        }}
                        placeholder="Search proxy types..."
                        renderOption={(type) => `${type.category_name}: ${type.name}`}
                      />
                      <div className="mt-2">
                        {editingMini?.proxy_types?.map(typeId => {
                          const type = types.find(t => t.id.toString() === typeId)
                          return type ? (
                            <span
                              key={type.id}
                              className="badge bg-primary me-1 mb-1"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                setEditingMini({
                                  ...editingMini,
                                  proxy_types: editingMini.proxy_types.filter(id => id !== typeId)
                                })
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

            {/* Tags and Product Information Card */}
            <Card className="mb-3">
              <Card.Header className="bg-light d-flex align-items-center">
                <h6 className="mb-0">Tags and Product Information</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tags</Form.Label>
                      <TagInput
                        value={editingMini?.tags || []}
                        onChange={(tags) => setEditingMini({...editingMini, tags})}
                        existingTags={existingTags}
                        placeholder="Type tag and press Enter or comma to add..."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Product Set</Form.Label>
                      <SearchableSelect
                        items={productSets}
                        value={editingMini?.product_sets || []}
                        onChange={(set) => {
                          setEditingMini({
                            ...editingMini,
                            product_sets: [set.id.toString()]
                          })
                        }}
                        placeholder="Search product sets..."
                        renderOption={(set) => `${set.manufacturer_name} » ${set.product_line_name} » ${set.name}`}
                      />
                      <div className="mt-2">
                        {editingMini?.product_sets?.map(setId => {
                          const set = productSets.find(s => s.id.toString() === setId)
                          return set ? (
                            <span
                              key={set.id}
                              className="badge bg-primary me-1 mb-1"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                setEditingMini({
                                  ...editingMini,
                                  product_sets: editingMini.product_sets.filter(id => id !== setId)
                                })
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
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateMini}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add ImageModal */}
      <ImageModal
        show={showImageModal}
        onHide={() => {
          setShowImageModal(false)
          setSelectedImage(null)
        }}
        imagePath={selectedImage?.path}
        miniName={selectedImage?.name}
      />
    </Container>
  )
}

export default MiniOverview 