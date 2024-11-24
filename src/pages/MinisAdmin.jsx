import React, { useState, useEffect, useRef } from 'react'
import { Container, Row, Col, Form, Button, Alert, Card, Modal, Pagination } from 'react-bootstrap'
import { faCubes, faTrash, faLayerGroup, faCube, faPencil, faPlus, faImage, faTag, faLayerGroup as faCategory } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { api } from '../database/db'
import TableButton from '../components/TableButton'
import CustomTable from '../components/Table/Table'
import PageHeader from '../components/PageHeader/PageHeader'

const MinisAdmin = () => {
  const [categories, setCategories] = useState([])
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Form states
  const [newCategory, setNewCategory] = useState({ name: '' })
  const [newType, setNewType] = useState({ name: '', category_id: '' })

  // Edit Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingType, setEditingType] = useState(null)

  // Add columns definition
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'actions', label: '', className: 'actions-cell' }
  ];

  // Add renderCell function
  const renderCell = (row, column) => {
    switch (column.key) {
      case 'name':
        return row.name;
      case 'actions':
        return (
          <>
            <TableButton
              icon={faPencil}
              variant="primary"
              onClick={() => openCategoryModal(row)}
              title="Edit Category"
              className="me-2"
            />
            <TableButton
              icon={faTrash}
              variant="danger"
              onClick={() => handleDeleteCategory(row.id)}
              title="Delete Category"
            />
          </>
        );
      default:
        return row[column.key];
    }
  };

  // Add these new states near the top with other state declarations
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [categoriesPage, setCategoriesPage] = useState(1)
  const [typesPage, setTypesPage] = useState(1)

  // Add new state for filtering
  const [selectedCategoryForTypes, setSelectedCategoryForTypes] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const fetchEntriesPerPage = async () => {
      try {
        const response = await api.get('/api/settings/minisadmin_entries_per_page')
        setEntriesPerPage(parseInt(response.data.value))
      } catch (err) {
        console.error('Error fetching entries per page setting:', err)
        setEntriesPerPage(10) // fallback to default
      }
    }
    fetchEntriesPerPage()
  }, [])

  const fetchData = async () => {
    try {
      const [categoriesRes, typesRes] = await Promise.all([
        api.get('/api/categories'),
        api.get('/api/types')
      ])
      setCategories(categoriesRes.data)
      setTypes(typesRes.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Add handlers
  const handleAddCategory = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/categories', { name: newCategory.name })
      setNewCategory({ name: '' })
      categoryNameInputRef.current?.focus()
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  const typeNameInputRef = useRef(null)

  const handleAddType = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/types', newType)
      setNewType(prev => ({ 
        name: '', 
        category_id: prev.category_id,
      }))
      typeNameInputRef.current?.focus()
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  // Delete handlers
  const handleDeleteCategory = async (id) => {
    if (window.confirm('Are you sure? This will delete all associated types.')) {
      try {
        await api.delete(`/api/categories/${id}`)
        fetchData()
      } catch (err) {
        setError(err.message)
      }
    }
  }

  const handleDeleteType = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        const response = await api.delete(`/api/types/${id}`)
        fetchData()
      } catch (err) {
        if (err.response?.status === 409) {
          setError("Cannot delete this type because it's being used by one or more minis. Please remove it from all minis first.")
        } else {
          setError(err.response?.data?.error || err.message)
        }
      }
    }
  }

  // Edit handlers
  const handleEditCategory = async () => {
    try {
      await api.put(`/api/categories/${editingCategory.id}`, editingCategory)
      setShowCategoryModal(false)
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEditType = async () => {
    try {
      await api.put(`/api/types/${editingType.id}`, editingType)
      setShowTypeModal(false)
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  // Modal open handlers
  const openCategoryModal = (category) => {
    setEditingCategory({ ...category })
    setShowCategoryModal(true)
  }

  const openTypeModal = (type) => {
    setEditingType({ ...type })
    setShowTypeModal(true)
  }

  // Add useEffect for auto-selection
  useEffect(() => {
    // Auto-select category if there's only one
    if (categories.length === 1) {
      setNewType(prev => ({ ...prev, category_id: categories[0].id.toString() }))
    }
  }, [categories])

  // Add validation check functions
  const isValidCategory = (category) => {
    return category.name.trim() !== ''
  }

  const isValidType = (type) => {
    return type.name.trim() !== '' && type.category_id !== ''
  }

  // Add this near the top with other refs
  const categoryNameInputRef = useRef(null)

  // Add these pagination helper functions
  const getPaginatedData = (data, page, perPage) => {
    const start = (page - 1) * perPage
    const end = start + perPage
    return data.slice(start, end)
  }

  const getTotalPages = (totalItems, perPage) => {
    return Math.ceil(totalItems / perPage)
  }

  // Add this handler for entries per page change
  const handleEntriesPerPageChange = async (e) => {
    const value = e.target.value
    setEntriesPerPage(parseInt(value))
    setCategoriesPage(1)
    setTypesPage(1)
    try {
      await api.put('/api/settings/minisadmin_entries_per_page', { value })
    } catch (err) {
      console.error('Error saving entries per page setting:', err)
    }
  }

  // Add the PaginationControl component
  const PaginationControl = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="pagination-wrapper">
        <Pagination size="sm">
          <Pagination.First 
            onClick={() => onPageChange(1)} 
            disabled={currentPage === 1}
          />
          <Pagination.Prev 
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          />
          {currentPage > 2 && <Pagination.Item onClick={() => onPageChange(1)}>1</Pagination.Item>}
          {currentPage > 3 && <Pagination.Ellipsis />}
          {currentPage > 1 && <Pagination.Item onClick={() => onPageChange(currentPage - 1)}>{currentPage - 1}</Pagination.Item>}
          <Pagination.Item active>{currentPage}</Pagination.Item>
          {currentPage < totalPages && <Pagination.Item onClick={() => onPageChange(currentPage + 1)}>{currentPage + 1}</Pagination.Item>}
          {currentPage < totalPages - 2 && <Pagination.Ellipsis />}
          {currentPage < totalPages - 1 && <Pagination.Item onClick={() => onPageChange(totalPages)}>{totalPages}</Pagination.Item>}
          <Pagination.Next 
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          />
          <Pagination.Last 
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
          />
        </Pagination>
      </div>
    )
  }

  // Add filtered data getter for types
  const getFilteredTypes = () => {
    if (!selectedCategoryForTypes) return types
    return types.filter(type => 
      type.category_id.toString() === selectedCategoryForTypes
    )
  }

  return (
    <Container fluid className="content">
      <PageHeader
        icon={faCubes}
        iconColor="text-success"
        title="Minis Admin"
        subtitle="Manage categories and types"
      >
        <div className="d-flex align-items-center justify-content-end">
          <span className="text-muted me-2">Show</span>
          <Form.Select 
            size="sm" 
            value={entriesPerPage} 
            onChange={handleEntriesPerPageChange}
            style={{ width: '70px' }}
            className="mx-2"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </Form.Select>
          <span className="text-muted">entries</span>
        </div>
      </PageHeader>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      <Row>
        {/* Categories Card */}
        <Col md={5}>
          <Card className="mb-4">
            <Card.Body className="pb-0">
              <div className="d-flex align-items-center mb-4">
                <FontAwesomeIcon icon={faLayerGroup} className="text-success me-2" />
                <h5 className="mb-0">Categories</h5>
              </div>

              <Form onSubmit={handleAddCategory} className="mb-3">
                <Row className="g-2">
                  <Col>
                    <div className="position-relative">
                      <FontAwesomeIcon 
                        icon={faTag} 
                        className="position-absolute text-muted" 
                        style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                      <Form.Control
                        ref={categoryNameInputRef}
                        type="text"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                        placeholder="Name..."
                        required
                        style={{ paddingLeft: '35px' }}
                        className="placeholder-light"
                      />
                    </div>
                  </Col>
                  <Col xs="auto">
                    <Button 
                      type="submit" 
                      variant="light" 
                      className="border"
                      disabled={!isValidCategory(newCategory)}
                    >
                      <FontAwesomeIcon icon={faPlus} className="me-2 text-success" />
                      Add
                    </Button>
                  </Col>
                </Row>
              </Form>

              <CustomTable
                columns={columns}
                data={getPaginatedData(categories, categoriesPage, entriesPerPage)}
                renderCell={renderCell}
              />
              <PaginationControl
                currentPage={categoriesPage}
                totalPages={getTotalPages(categories.length, entriesPerPage)}
                onPageChange={setCategoriesPage}
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Types Card */}
        <Col md={7}>
          <Card className="mb-4">
            <Card.Body className="pb-0">
              <div className="d-flex align-items-center mb-4">
                <FontAwesomeIcon icon={faCube} className="text-success me-2" />
                <h5 className="mb-0">Types</h5>
              </div>

              <Form onSubmit={handleAddType} className="mb-3">
                <Row className="g-2">
                  <Col md={5}>
                    <div className="position-relative">
                      <FontAwesomeIcon 
                        icon={faCategory} 
                        className="position-absolute text-muted" 
                        style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                      <Form.Select
                        value={newType.category_id}
                        onChange={(e) => {
                          setNewType({...newType, category_id: e.target.value})
                          setSelectedCategoryForTypes(e.target.value) // Update filter when category is selected
                        }}
                        required
                        style={{ paddingLeft: '35px' }}
                        className="placeholder-light"
                      >
                        <option value="">Category...</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </Form.Select>
                    </div>
                  </Col>
                  <Col>
                    <div className="position-relative">
                      <FontAwesomeIcon 
                        icon={faTag} 
                        className="position-absolute text-muted" 
                        style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                      <Form.Control
                        ref={typeNameInputRef}
                        type="text"
                        value={newType.name}
                        onChange={(e) => setNewType({...newType, name: e.target.value})}
                        placeholder="Name..."
                        required
                        style={{ paddingLeft: '35px' }}
                        className="placeholder-light"
                      />
                    </div>
                  </Col>
                  <Col xs="auto">
                    <Button 
                      type="submit" 
                      variant="light" 
                      className="border"
                      disabled={!isValidType(newType)}
                    >
                      <FontAwesomeIcon icon={faPlus} className="me-2 text-success" />
                      Add
                    </Button>
                  </Col>
                </Row>
              </Form>

              <CustomTable
                columns={[
                  { key: 'category', label: 'Category', className: 'dimmed-cell' },
                  { key: 'name', label: 'Name' },
                  { key: 'actions', label: '', className: 'actions-cell' }
                ]}
                data={getPaginatedData(getFilteredTypes(), typesPage, entriesPerPage)}
                renderCell={(row, column) => {
                  switch (column.key) {
                    case 'name':
                      return row.name;
                    case 'category':
                      return row.category_name;
                    case 'actions':
                      return (
                        <>
                          <TableButton
                            icon={faPencil}
                            variant="primary"
                            onClick={() => openTypeModal(row)}
                            title="Edit Type"
                            className="me-2"
                          />
                          <TableButton
                            icon={faTrash}
                            variant="danger"
                            onClick={() => handleDeleteType(row.id)}
                            title="Delete Type"
                          />
                        </>
                      );
                    default:
                      return row[column.key];
                  }
                }}
              />
              <PaginationControl
                currentPage={typesPage}
                totalPages={getTotalPages(getFilteredTypes().length, entriesPerPage)}
                onPageChange={setTypesPage}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Category Edit Modal */}
      <Modal show={showCategoryModal} onHide={() => setShowCategoryModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Category</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={editingCategory?.name || ''}
                onChange={(e) => setEditingCategory({
                  ...editingCategory,
                  name: e.target.value
                })}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCategoryModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditCategory}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Type Edit Modal */}
      <Modal show={showTypeModal} onHide={() => setShowTypeModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Type</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select
                value={editingType?.category_id || ''}
                onChange={(e) => setEditingType({
                  ...editingType,
                  category_id: e.target.value
                })}
                required
              >
                <option value="">-</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={editingType?.name || ''}
                onChange={(e) => setEditingType({
                  ...editingType,
                  name: e.target.value
                })}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTypeModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditType}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default MinisAdmin 