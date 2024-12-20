import React, { useState, useEffect, useRef } from 'react'
import { Container, Row, Col, Form, Button, Alert, Card, Modal, Pagination } from 'react-bootstrap'
import { faCubes, faTrash, faLayerGroup, faCube, faPencil, faPlus, faImage, faTag, faLayerGroup as faCategory } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { api } from '../database/db'
import TableButton from '../components/TableButton'
import CustomTable from '../components/Table/Table'
import PageHeader from '../components/PageHeader/PageHeader'
import AddButton from '../components/Buttons/AddButton'
import PaginationControl from '../components/Pagination/Pagination'
import UsageDetailsModal from '../components/UsageDetailsModal'

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
    { 
      key: 'name', 
      label: 'Name',
      render: (row) => {
        const typeCount = types.filter(type => type.category_id.toString() === row.id.toString()).length;
        return (
          <span 
            className="cursor-pointer"
            onClick={() => {
              setNewType(prev => ({ ...prev, category_id: row.id.toString() }));
              setSelectedCategoryForTypes(row.id.toString());
              setTypesPage(1);
            }}
          >
            {row.name}
            {typeCount > 0 && (
              <span className="text-muted ms-1">
                ({typeCount})
              </span>
            )}
          </span>
        );
      }
    },
    { 
      key: 'count', 
      label: 'Count',
      className: 'actions-cell',
      style: { width: '1%', whiteSpace: 'nowrap' },
      render: (row) => (
        <div 
          className={row.mini_count > 0 ? "cursor-pointer w-100 h-100" : ""}
          onClick={() => row.mini_count > 0 && fetchUsageDetails(row.id, 'category')}
        >
          {row.mini_count > 0 ? row.mini_count : ''}
        </div>
      )
    },
    { 
      key: 'actions', 
      label: '', 
      className: 'actions-cell',
      style: { width: '1%', whiteSpace: 'nowrap' },
      render: (row) => (
        <>
          <TableButton
            type="edit"
            onClick={() => openCategoryModal(row)}
            className="me-2"
          />
          <TableButton
            type="delete"
            onClick={() => handleDeleteCategory(row.id)}
          />
        </>
      )
    }
  ];

  // Modify renderCell function
  const renderCell = (row, column) => {
    if (column.render) {
      return column.render(row);
    }
    return row[column.key];
  };

  // Add these new states near the top with other state declarations
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [typesPage, setTypesPage] = useState(1)

  // Add new state for filtering
  const [selectedCategoryForTypes, setSelectedCategoryForTypes] = useState('')

  // Add new state for usage details modal
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [usageDetails, setUsageDetails] = useState({
    title: '',
    count: 0,
    items: [],
    type: ''
  });

  // Add categoriesPage state
  const [categoriesPage, setCategoriesPage] = useState(1);

  // Add new state for name filtering
  const [typeNameFilter, setTypeNameFilter] = useState('');

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
    setTypesPage(1)
    setCategoriesPage(1)
    try {
      await api.put('/api/settings/minisadmin_entries_per_page', { value })
    } catch (err) {
      console.error('Error saving entries per page setting:', err)
    }
  }

  // Add filtered data getter for types
  const getFilteredTypes = () => {
    return types.filter(type => {
      const matchesCategory = !selectedCategoryForTypes || 
        type.category_id.toString() === selectedCategoryForTypes;
      const matchesName = !typeNameFilter || 
        type.name.toLowerCase().includes(typeNameFilter.toLowerCase());
      return matchesCategory && matchesName;
    });
  };

  // Add function to fetch usage details
  const fetchUsageDetails = async (id, type) => {
    try {
      let endpoint;
      let title;
      
      if (type === 'category') {
        endpoint = `/api/categories/${id}/usage`;
        title = categories.find(c => c.id.toString() === id.toString())?.name;
      } else if (type === 'type') {
        endpoint = `/api/types/${id}/usage`;
        title = types.find(t => t.id.toString() === id.toString())?.name;
      } else if (type === 'proxy') {
        endpoint = `/api/types/${id}/proxy-usage`;
        title = types.find(t => t.id.toString() === id.toString())?.name;
      }

      const response = await api.get(endpoint);
      setUsageDetails({
        title,
        count: response.data.length,
        items: response.data,
        type
      });
      setShowUsageModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Container fluid className="content">
      <PageHeader
        icon={faCubes}
        iconColor="text-primary"
        title="Minis Admin"
        subtitle="Manage categories and types"
      />

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      <div className="d-flex align-items-center mb-3 justify-content-end">
        <span className="me-2">Show Entries:</span>
        <Form.Select 
          size="sm" 
          value={entriesPerPage} 
          onChange={handleEntriesPerPageChange}
          style={{ width: '70px' }}
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
        </Form.Select>
      </div>

      <Row>
        {/* Categories Card */}
        <Col md={5}>
          <Card className="mb-4">
            <Card.Body className="pb-2 pt-2">
              <div className="d-flex justify-content-between align-items-center mb-2" style={{ minHeight: '32px' }}>
                <div className="d-flex align-items-center">
                  <FontAwesomeIcon icon={faLayerGroup} className="text-info me-2" />
                  <h5 className="mb-0">Categories</h5>
                </div>
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
                    <AddButton disabled={!isValidCategory(newCategory)} />
                  </Col>
                </Row>
              </Form>

              <CustomTable
                columns={columns}
                data={getPaginatedData(categories, categoriesPage, entriesPerPage)}
                renderCell={renderCell}
              />
              <div className="d-flex justify-content-center" style={{ marginTop: '-10px', marginBottom: '10px' }}>
                <PaginationControl
                  currentPage={categoriesPage}
                  totalPages={getTotalPages(categories.length, entriesPerPage)}
                  onPageChange={setCategoriesPage}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Types Card */}
        <Col md={7}>
          <Card>
            <Card.Body className="pb-2 pt-2">
              <div className="d-flex justify-content-between align-items-center mb-2" style={{ minHeight: '32px' }}>
                <div className="d-flex align-items-center">
                  <FontAwesomeIcon icon={faCube} className="text-info me-2" />
                  <h5 className="mb-0">Types</h5>
                </div>
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
                          setNewType({...newType, category_id: e.target.value});
                          setSelectedCategoryForTypes(e.target.value);
                          setTypesPage(1);
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
                        type="text"
                        value={newType.name}
                        onChange={(e) => {
                          setNewType({...newType, name: e.target.value});
                          setTypeNameFilter(e.target.value);
                          setTypesPage(1);
                        }}
                        placeholder="Name..."
                        required
                        style={{ paddingLeft: '35px' }}
                        className="placeholder-light"
                      />
                    </div>
                  </Col>
                  <Col xs="auto">
                    <AddButton disabled={!isValidType(newType)} />
                  </Col>
                </Row>
              </Form>

              {getFilteredTypes().length > 0 ? (
                <>
                  <CustomTable
                    columns={[
                      { 
                        key: 'category', 
                        label: 'Category', 
                        className: 'dimmed-cell',
                        style: { whiteSpace: 'nowrap' },
                        render: (row) => (
                          <span 
                            className="cursor-pointer" 
                            onClick={() => {
                              setSelectedCategoryForTypes(row.category_id.toString());
                              setNewType(prev => ({ ...prev, category_id: row.category_id.toString() }));
                              setTypesPage(1);
                            }}
                          >
                            {row.category_name}
                          </span>
                        )
                      },
                      { 
                        key: 'name', 
                        label: 'Name',
                        render: (row) => (
                          <span 
                            className="cursor-pointer" 
                            onClick={() => setNewType(prev => ({ ...prev, name: row.name }))}
                          >
                            {row.name}
                          </span>
                        )
                      },
                      { 
                        key: 'count', 
                        label: 'In Use (Type)',
                        className: 'actions-cell',
                        render: (row) => (
                          <div 
                            className={row.type_count > 0 ? "cursor-pointer w-100 h-100" : ""}
                            onClick={() => row.type_count > 0 && fetchUsageDetails(row.id, 'type')}
                          >
                            {row.type_count > 0 ? row.type_count : ''}
                          </div>
                        )
                      },
                      { 
                        key: 'proxy_count', 
                        label: 'In Use (Proxy)',
                        className: 'actions-cell',
                        render: (row) => (
                          <div 
                            className={row.proxy_count > 0 ? "cursor-pointer w-100 h-100" : ""}
                            onClick={() => row.proxy_count > 0 && fetchUsageDetails(row.id, 'proxy')}
                          >
                            {row.proxy_count > 0 ? row.proxy_count : ''}
                          </div>
                        )
                      },
                      { 
                        key: 'actions', 
                        label: '', 
                        className: 'actions-cell',
                        style: { width: '1%', whiteSpace: 'nowrap' },
                        render: (row) => (
                          <>
                            <TableButton
                              type="edit"
                              onClick={() => openTypeModal(row)}
                              className="me-2"
                            />
                            <TableButton
                              type="delete"
                              onClick={() => handleDeleteType(row.id)}
                            />
                          </>
                        )
                      }
                    ]}
                    data={getPaginatedData(getFilteredTypes(), typesPage, entriesPerPage)}
                    renderCell={renderCell}
                  />
                  <div className="d-flex justify-content-center" style={{ marginTop: '-10px', marginBottom: '10px' }}>
                    <PaginationControl
                      currentPage={typesPage}
                      totalPages={getTotalPages(getFilteredTypes().length, entriesPerPage)}
                      onPageChange={setTypesPage}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-3 text-muted">
                  No data available.
                </div>
              )}
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

      {/* Usage Details Modal */}
      <UsageDetailsModal
        show={showUsageModal}
        onHide={() => setShowUsageModal(false)}
        title={usageDetails.title}
        count={usageDetails.count}
        items={usageDetails.items}
        type={usageDetails.type}
      />
    </Container>
  )
}

export default MinisAdmin 