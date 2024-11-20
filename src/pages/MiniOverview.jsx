import React, { useState, useEffect, useRef } from 'react'
import { Container, Table, Form, Button, Card, Modal, Row, Col } from 'react-bootstrap'
import { faTable, faPlus, faImage } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { api } from '../database/db'
import SearchableSelect from '../components/SearchableSelect'
import TagInput from '../components/TagInput'
import { useTheme } from '../context/ThemeContext'

const MiniOverview = () => {
  const { darkMode } = useTheme()
  const [showAddModal, setShowAddModal] = useState(false)
  const [categories, setCategories] = useState([])
  const [types, setTypes] = useState([])
  const [productSets, setProductSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [existingTags, setExistingTags] = useState([])

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
    product_sets: [], // Array of set IDs
    tags: [] // Array of tag names (will be created if they don't exist)
  })

  // Search and filter states
  const [categorySearch, setCategorySearch] = useState('')
  const [typeSearch, setTypeSearch] = useState('')
  const [proxyTypeSearch, setProxyTypeSearch] = useState('')
  const [filteredCategories, setFilteredCategories] = useState([])
  const [filteredTypes, setFilteredTypes] = useState([])
  const [filteredProxyTypes, setFilteredProxyTypes] = useState([])
  
  // Selected items states
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedTypes, setSelectedTypes] = useState([])
  const [selectedProxyTypes, setSelectedProxyTypes] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [categoriesRes, typesRes, setsRes, tagsRes] = await Promise.all([
        api.get('/api/categories'),
        api.get('/api/types'),
        api.get('/api/product-sets'),
        api.get('/api/tags')
      ])
      setCategories(categoriesRes.data)
      setTypes(typesRes.data)
      setProductSets(setsRes.data)
      setExistingTags(tagsRes.data.map(tag => tag.name))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMini = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/minis', newMini)
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
        product_sets: [],
        tags: []
      })
      fetchData()
    } catch (err) {
      setError(err.message)
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

  const handleImageUpload = (file) => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      setNewMini({
        ...newMini,
        image_path: e.target.result // Store base64 image data
      })
    }
    reader.readAsDataURL(file)
  }

  if (loading) return <div>Loading...</div>

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

        <Table hover>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Type</th>
              <th>Product Line</th>
              <th>Manufacturer</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Add sample data or map through actual data */}
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
                          <Form.Label>Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={newMini.name}
                            onChange={(e) => setNewMini({...newMini, name: e.target.value})}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Location</Form.Label>
                          <Form.Control
                            type="text"
                            value={newMini.location}
                            onChange={(e) => setNewMini({...newMini, location: e.target.value})}
                          />
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
                      <Form.Label>Categories</Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type="text"
                          value={categorySearch}
                          onChange={(e) => handleCategorySearch(e.target.value)}
                          placeholder="Type to search for categories..."
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
                      <Form.Label>Types</Form.Label>
                      <div className="position-relative">
                        <Form.Control
                          type="text"
                          value={typeSearch}
                          onChange={(e) => handleTypeSearch(e.target.value)}
                          placeholder="Type to search for types..."
                          disabled={selectedCategories.length === 0}
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

            {/* Product Information Card */}
            <Card className="mb-3">
              <Card.Header className="bg-light d-flex align-items-center">
                <h6 className="mb-0">Product Information</h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Product Set</Form.Label>
                  <SearchableSelect
                    items={productSets}
                    value={newMini.product_set}
                    onChange={(set) => setNewMini({...newMini, product_set: set})}
                    placeholder="Search for product sets..."
                    searchKeys={['name', 'product_line_name', 'manufacturer_name']}
                    renderOption={(set) => 
                      `${set.manufacturer_name} > ${set.product_line_name} > ${set.name}`
                    }
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Tags Card */}
            <Card className="mb-3">
              <Card.Header className="bg-light d-flex align-items-center">
                <h6 className="mb-0">Tags</h6>
              </Card.Header>
              <Card.Body>
                <TagInput
                  value={newMini.tags}
                  onChange={(tags) => setNewMini({...newMini, tags})}
                  existingTags={existingTags}
                  placeholder="Type tag and press Enter or comma to add..."
                />
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
    </Container>
  )
}

export default MiniOverview 