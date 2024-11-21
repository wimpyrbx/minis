import React, { useState, useEffect, useRef } from 'react'
import { Container, Table, Form, Button, Card, Modal, Row, Col } from 'react-bootstrap'
import { faTable, faPlus, faImage, faPencil, faTrash, faLayerGroup, faCube, faExchangeAlt, faTags, faBox, faList, faTableCells } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { api } from '../database/db'
import SearchableSelect from '../components/SearchableSelect'
import TagInput from '../components/TagInput'
import { useTheme } from '../context/ThemeContext'
import ImageModal from '../components/ImageModal'
import '../styles/ImageModal.css'
import TableButton from '../components/TableButton'
import MiniCardGrid from '../components/MiniCards/MiniCardGrid'

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

  // Add state for original mini data
  const [originalMini, setOriginalMini] = useState(null)

  // Add these new states near the top with other states
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Add new state for view type
  const [viewType, setViewType] = useState('table')

  // Add useEffect to load view type preference
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api.get('/api/settings')
        if (response.data.collection_viewtype) {
          setViewType(response.data.collection_viewtype)
        }
        if (response.data.collection_show_entries_per_page) {
          setEntriesPerPage(parseInt(response.data.collection_show_entries_per_page))
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
    loadSettings()
  }, [])

  // Add this function to handle entries per page change
  const handleEntriesPerPageChange = async (value) => {
    const newValue = parseInt(value)
    setEntriesPerPage(newValue)
    setCurrentPage(1) // Reset to first page when changing entries per page
    
    try {
      await api.put(`/api/settings/collection_show_entries_per_page`, {
        value: newValue.toString()
      })
    } catch (error) {
      console.error('Error saving setting:', error)
    }
  }

  // Add this before the table to calculate paginated data
  const paginatedMinis = minis.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  )

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
      setNewMini(prev => ({ 
        ...prev, 
        categories: values,
        types: newTypes,
        // Clear proxy types if no types remain
        proxy_types: newTypes.length === 0 ? [] : prev.proxy_types
      }))
    } else if (field === 'types') {
      setNewMini(prev => ({ 
        ...prev, 
        types: values,
        // Clear proxy types if no types remain
        proxy_types: values.length === 0 ? [] : prev.proxy_types
      }))
    } else {
      setNewMini(prev => ({ ...prev, [field]: values }))
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
    const updatedTypes = newMini.types.filter(typeId => {
      const type = types.find(t => t.id.toString() === typeId)
      return type && type.category_id.toString() !== categoryId.toString()
    })

    setNewMini({
      ...newMini,
      categories: newMini.categories.filter(id => id !== categoryId.toString()),
      types: updatedTypes,
      // Clear proxy types if no types remain
      proxy_types: updatedTypes.length === 0 ? [] : newMini.proxy_types
    })
    setSelectedCategories(selectedCategories.filter(cat => cat.id !== categoryId))
    setSelectedTypes(selectedTypes.filter(type => 
      type.category_id.toString() !== categoryId.toString()
    ))
    // Clear selectedProxyTypes if no types remain
    if (updatedTypes.length === 0) {
      setSelectedProxyTypes([])
    }
  }

  const handleRemoveType = (typeId) => {
    const updatedTypes = newMini.types.filter(id => id !== typeId.toString())
    setNewMini(prev => ({
      ...prev,
      types: updatedTypes,
      // If no types remain, clear proxy types
      proxy_types: updatedTypes.length === 0 ? [] : prev.proxy_types
    }))
    setSelectedTypes(selectedTypes.filter(type => type.id !== typeId))
    // Also clear selectedProxyTypes if no types remain
    if (updatedTypes.length === 0) {
      setSelectedProxyTypes([])
    }
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
        setOriginalMini(completeData) // Store original data
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

  // Update the isValidMini function
  const isValidMini = (mini) => {
    if (!mini) return false
    
    return (
      mini.name?.trim() &&
      mini.location?.trim() &&
      Array.isArray(mini.categories) && mini.categories.length > 0 &&
      Array.isArray(mini.types) && mini.types.length > 0
    )
  }

  // Also update the hasChanges function with similar safety checks
  const hasChanges = (current, original) => {
    if (!current || !original) return false
    
    return (
      current.name !== original.name ||
      current.location !== original.location ||
      current.description !== original.description ||
      current.quantity !== original.quantity ||
      current.image_path !== original.image_path ||
      !arraysEqual(current.categories || [], original.categories || []) ||
      !arraysEqual(current.types || [], original.types || []) ||
      !arraysEqual(current.proxy_types || [], original.proxy_types || []) ||
      !arraysEqual(current.tags || [], original.tags || []) ||
      !arraysEqual(current.product_sets || [], original.product_sets || [])
    )
  }

  // Update the arraysEqual function to handle null/undefined
  const arraysEqual = (a, b) => {
    if (!Array.isArray(a) || !Array.isArray(b)) return false
    if (a.length !== b.length) return false
    const sortedA = [...a].sort()
    const sortedB = [...b].sort()
    return sortedA.every((val, idx) => val === sortedB[idx])
  }

  // Add handler for view type change
  const handleViewTypeChange = async (type) => {
    setViewType(type)
    try {
      await api.put(`/api/settings/collection_viewtype`, {
        value: type
      })
    } catch (error) {
      console.error('Error saving view type setting:', error)
    }
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
          <div className="d-flex align-items-center">
            <div className="d-flex align-items-center me-4" style={{ whiteSpace: 'nowrap' }}>
              <span className="me-2">Show</span>
              <Form.Select 
                size="sm" 
                style={{ width: '65px' }}  // Made even smaller
                value={entriesPerPage}
                onChange={(e) => handleEntriesPerPageChange(e.target.value)}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </Form.Select>
              <span className="ms-2">entries</span>
            </div>
            <div className="btn-group me-4">  {/* Added margin to the right */}
              <Button 
                variant={viewType === 'table' ? 'primary' : 'outline-primary'}
                onClick={() => handleViewTypeChange('table')}
                title="Table View"
              >
                <FontAwesomeIcon icon={faList} />
              </Button>
              <Button 
                variant={viewType === 'cards' ? 'primary' : 'outline-primary'}
                onClick={() => handleViewTypeChange('cards')}
                title="Card View"
              >
                <FontAwesomeIcon icon={faTableCells} />
              </Button>
            </div>
          </div>
          <Button 
            variant="primary" 
            onClick={() => setShowAddModal(true)} 
            style={{ whiteSpace: 'nowrap' }}  // Prevent text wrapping
          >
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Add New Mini
          </Button>
        </div>

        {/* Conditional rendering based on view type */}
        {viewType === 'table' ? (
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
              {paginatedMinis.map(mini => (
                <tr key={mini.id}>
                  <td className="d-flex align-items-center" style={{ height: '40px' }}>
                    {mini.image_path && (
                      <img 
                        src={mini.image_path} 
                        alt={mini.name}
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          objectFit: 'contain',
                          marginRight: '10px',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleImageClick(mini)}
                        title="Click to view full image"
                      />
                    )}
                    <a 
                      href={`https://www.miniscollector.com/minis/gallery?title=${encodeURIComponent(mini.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-none"
                    >
                      {mini.name}
                    </a>
                  </td>
                  <td>{mini.location}</td>
                  <td>{mini.category_names?.split(',').join(', ')}</td>
                  <td>{mini.type_names?.split(',').join(', ')}</td>
                  <td>{mini.proxy_type_names?.split(',').join(', ')}</td>
                  <td>{mini.product_set_names?.split(',').join(', ')}</td>
                  <td>{mini.tag_names?.split(',').join(', ')}</td>
                  <td>{mini.quantity}</td>
                  <td className="text-nowrap">
                    <TableButton
                      icon={faImage}
                      variant="info"
                      onClick={() => handleImageClick(mini)}
                      title="View Image"
                      className="me-1"
                      disabled={!mini.image_path}
                    />
                    <TableButton
                      icon={faPencil}
                      variant="primary"
                      onClick={() => handleEditMini(mini)}
                      title="Edit Mini"
                      className="me-1"
                    />
                    <TableButton
                      icon={faTrash}
                      variant="danger"
                      onClick={() => handleDeleteMini(mini.id)}
                      title="Delete Mini"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <MiniCardGrid
            minis={paginatedMinis}
            onEdit={handleEditMini}
            onDelete={handleDeleteMini}
            onImageClick={handleImageClick}
          />
        )}
      </div>

      {/* Add Mini Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
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

            {/* Combined Classification and Information Card */}
            <Card className="mb-3">
              <Card.Header className="bg-light d-flex align-items-center">
                <h6 className="mb-0">Classification & Information</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FontAwesomeIcon icon={faLayerGroup} className="me-2 text-primary" />
                        Categories <span className="text-danger">*</span>
                      </Form.Label>
                      <SearchableSelect
                        items={categories}
                        value={newMini?.categories || []}
                        onChange={(category) => {
                          if (!newMini?.categories.includes(category.id.toString())) {
                            setNewMini({
                              ...newMini,
                              categories: [...(newMini?.categories || []), category.id.toString()]
                            })
                          }
                        }}
                        placeholder="Search categories..."
                        isInvalid={validationErrors.categories}
                      />
                      <div className="mt-2">
                        {newMini?.categories?.map(catId => {
                          const category = categories.find(c => c.id.toString() === catId)
                          return category ? (
                            <span
                              key={category.id}
                              className="badge bg-primary me-1 mb-1"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                const updatedTypes = newMini.types.filter(id => id !== catId)
                                setNewMini(prev => ({
                                  ...prev,
                                  types: updatedTypes,
                                  // If no types remain, clear proxy types
                                  proxy_types: updatedTypes.length === 0 ? [] : prev.proxy_types
                                }))
                                if (updatedTypes.length === 0) {
                                  // Clear any selected proxy types from the UI
                                  const proxyTypeElements = document.querySelectorAll('.proxy-type-badge')
                                  proxyTypeElements.forEach(element => element.remove())
                                }
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
                        <FontAwesomeIcon icon={faCube} className="me-2 text-primary" />
                        Types <span className="text-danger">*</span>
                      </Form.Label>
                      <SearchableSelect
                        items={types.filter(type => 
                          newMini?.categories?.includes(type.category_id.toString())
                        )}
                        value={newMini?.types || []}
                        onChange={(type) => {
                          if (!newMini?.types.includes(type.id.toString())) {
                            setNewMini({
                              ...newMini,
                              types: [...(newMini?.types || []), type.id.toString()]
                            })
                          }
                        }}
                        placeholder="Search types..."
                        renderOption={(type) => `${type.category_name}: ${type.name}`}
                        isInvalid={validationErrors.types}
                      />
                      <div className="mt-2">
                        {newMini?.types?.map(typeId => {
                          const type = types.find(t => t.id.toString() === typeId)
                          return type ? (
                            <span
                              key={type.id}
                              className="badge bg-primary me-1 mb-1"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                const updatedTypes = newMini.types.filter(id => id !== typeId)
                                setNewMini(prev => ({
                                  ...prev,
                                  types: updatedTypes,
                                  // If no types remain, clear proxy types
                                  proxy_types: updatedTypes.length === 0 ? [] : prev.proxy_types
                                }))
                                if (updatedTypes.length === 0) {
                                  // Clear any selected proxy types from the UI
                                  const proxyTypeElements = document.querySelectorAll('.proxy-type-badge')
                                  proxyTypeElements.forEach(element => element.remove())
                                }
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
                      <Form.Label>
                        <FontAwesomeIcon icon={faExchangeAlt} className="me-2 text-primary" />
                        Proxy Types
                      </Form.Label>
                      <SearchableSelect
                        items={types.filter(type => 
                          !newMini?.types?.includes(type.id.toString())
                        )}
                        value={newMini?.proxy_types || []}
                        onChange={(type) => {
                          if (!newMini?.proxy_types?.includes(type.id.toString())) {
                            setNewMini({
                              ...newMini,
                              proxy_types: [...(newMini?.proxy_types || []), type.id.toString()]
                            })
                          }
                        }}
                        placeholder="Search proxy types..."
                        renderOption={(type) => `${type.category_name}: ${type.name}`}
                        disabled={!newMini?.types?.length}
                      />
                      <div className="mt-2">
                        {newMini?.proxy_types?.map(typeId => {
                          const type = types.find(t => t.id.toString() === typeId)
                          return type ? (
                            <span
                              key={type.id}
                              className="badge bg-primary me-1 mb-1"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                const updatedTypes = newMini.types.filter(id => id !== typeId)
                                setNewMini(prev => ({
                                  ...prev,
                                  types: updatedTypes,
                                  // If no types remain, clear proxy types
                                  proxy_types: updatedTypes.length === 0 ? [] : prev.proxy_types
                                }))
                                if (updatedTypes.length === 0) {
                                  // Clear any selected proxy types from the UI
                                  const proxyTypeElements = document.querySelectorAll('.proxy-type-badge')
                                  proxyTypeElements.forEach(element => element.remove())
                                }
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
                      <Form.Label>
                        <FontAwesomeIcon icon={faTags} className="me-2 text-primary" />
                        Tags
                      </Form.Label>
                      <TagInput
                        value={newMini.tags}
                        onChange={(tags) => setNewMini({...newMini, tags})}
                        existingTags={existingTags}
                        placeholder="Type tag and press Enter or comma to add..."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FontAwesomeIcon icon={faBox} className="me-2 text-primary" />
                        Product Set
                      </Form.Label>
                      <SearchableSelect
                        items={productSets}
                        value={newMini?.product_sets || []}
                        onChange={(set) => {
                          setNewMini({
                            ...newMini,
                            product_sets: [set.id.toString()]
                          })
                        }}
                        placeholder="Search product sets..."
                        renderOption={(set) => `${set.manufacturer_name} » ${set.product_line_name} » ${set.name}`}
                      />
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
          <Button 
            variant="primary" 
            onClick={handleAddMini}
            disabled={!isValidMini(newMini)}
          >
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
                                const updatedTypes = editingMini.types.filter(id => id !== catId)
                                setEditingMini(prev => ({
                                  ...prev,
                                  types: updatedTypes,
                                  // If no types remain, clear proxy types
                                  proxy_types: updatedTypes.length === 0 ? [] : prev.proxy_types
                                }))
                                if (updatedTypes.length === 0) {
                                  // Clear any selected proxy types from the UI
                                  const proxyTypeElements = document.querySelectorAll('.proxy-type-badge')
                                  proxyTypeElements.forEach(element => element.remove())
                                }
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
                                const updatedTypes = editingMini.types.filter(id => id !== typeId)
                                setEditingMini(prev => ({
                                  ...prev,
                                  types: updatedTypes,
                                  // If no types remain, clear proxy types
                                  proxy_types: updatedTypes.length === 0 ? [] : prev.proxy_types
                                }))
                                if (updatedTypes.length === 0) {
                                  // Clear any selected proxy types from the UI
                                  const proxyTypeElements = document.querySelectorAll('.proxy-type-badge')
                                  proxyTypeElements.forEach(element => element.remove())
                                }
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
                        disabled={!editingMini?.types?.length}
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
                                const updatedTypes = editingMini.types.filter(id => id !== typeId)
                                setEditingMini(prev => ({
                                  ...prev,
                                  types: updatedTypes,
                                  // If no types remain, clear proxy types
                                  proxy_types: updatedTypes.length === 0 ? [] : prev.proxy_types
                                }))
                                if (updatedTypes.length === 0) {
                                  // Clear any selected proxy types from the UI
                                  const proxyTypeElements = document.querySelectorAll('.proxy-type-badge')
                                  proxyTypeElements.forEach(element => element.remove())
                                }
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
          <Button 
            variant="primary" 
            onClick={handleUpdateMini}
            disabled={!isValidMini(editingMini) || !hasChanges(editingMini, originalMini)}
          >
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