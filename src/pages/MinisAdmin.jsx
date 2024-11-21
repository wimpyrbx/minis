import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Form, Button, Alert, Card, Modal } from 'react-bootstrap'
import { faCubes, faTrash, faLayerGroup, faCube, faPencil, faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { api } from '../database/db'
import TableButton from '../components/TableButton'
import CustomTable from '../components/Table/Table'

const MinisAdmin = () => {
  const [categories, setCategories] = useState([])
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Form states
  const [newCategory, setNewCategory] = useState({ name: '', image_path: '' })
  const [newType, setNewType] = useState({ name: '', category_id: '', image_path: '' })

  // Edit Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingType, setEditingType] = useState(null)

  // Add columns definition
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'image_path', label: 'Image Path' },
    { key: 'actions', label: '', className: 'actions-cell' }
  ];

  // Add renderCell function
  const renderCell = (row, column) => {
    switch (column.key) {
      case 'name':
        return row.name;
      case 'image_path':
        return row.image_path;
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

  useEffect(() => {
    fetchData()
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
      await api.post('/api/categories', newCategory)
      setNewCategory({ name: '', image_path: '' })
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleAddType = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/types', newType)
      setNewType({ name: '', category_id: '', image_path: '' })
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
        await api.delete(`/api/types/${id}`)
        fetchData()
      } catch (err) {
        setError(err.message)
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

  return (
    <Container fluid className="content">
      <Card className="mb-4">
        <Card.Body className="d-flex align-items-center">
          <FontAwesomeIcon icon={faCubes} className="text-success me-3" size="2x" />
          <div>
            <h4 className="mb-0">Minis Admin</h4>
            <small className="text-muted">Manage categories and types</small>
          </div>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      <Row>
        {/* Categories Card */}
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex align-items-center mb-4">
                <FontAwesomeIcon icon={faLayerGroup} className="text-success me-2" />
                <h5 className="mb-0">Categories</h5>
              </div>

              <Form onSubmit={handleAddCategory} className="mb-4">
                <Row className="align-items-end">
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Image Path</Form.Label>
                      <Form.Control
                        type="text"
                        value={newCategory.image_path}
                        onChange={(e) => setNewCategory({...newCategory, image_path: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col xs="auto">
                    <Button 
                      type="submit" 
                      variant="light" 
                      className="mb-3 border"
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
                data={categories}
                renderCell={renderCell}
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Types Card */}
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex align-items-center mb-4">
                <FontAwesomeIcon icon={faCube} className="text-success me-2" />
                <h5 className="mb-0">Types</h5>
              </div>

              <Form onSubmit={handleAddType} className="mb-4">
                <Row className="align-items-end">
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={newType.name}
                        onChange={(e) => setNewType({...newType, name: e.target.value})}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Category</Form.Label>
                      <Form.Select
                        value={newType.category_id}
                        onChange={(e) => setNewType({...newType, category_id: e.target.value})}
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
                  </Col>
                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Image Path</Form.Label>
                      <Form.Control
                        type="text"
                        value={newType.image_path}
                        onChange={(e) => setNewType({...newType, image_path: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col xs="auto">
                    <Button 
                      type="submit" 
                      variant="light" 
                      className="mb-3 border"
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
                  { key: 'name', label: 'Name' },
                  { key: 'category', label: 'Category' },
                  { key: 'image_path', label: 'Image Path' },
                  { key: 'actions', label: '', className: 'actions-cell' }
                ]}
                data={types}
                renderCell={(row, column) => {
                  switch (column.key) {
                    case 'name':
                      return row.name;
                    case 'category':
                      return row.category_name;
                    case 'image_path':
                      return row.image_path;
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
            <Form.Group className="mb-3">
              <Form.Label>Image Path</Form.Label>
              <Form.Control
                type="text"
                value={editingCategory?.image_path || ''}
                onChange={(e) => setEditingCategory({
                  ...editingCategory,
                  image_path: e.target.value
                })}
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
              <Form.Label>Image Path</Form.Label>
              <Form.Control
                type="text"
                value={editingType?.image_path || ''}
                onChange={(e) => setEditingType({
                  ...editingType,
                  image_path: e.target.value
                })}
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