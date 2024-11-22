import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Form, Button, Alert, Card, Modal, Pagination } from 'react-bootstrap'
import { faBoxes, faTrash, faIndustry, faBoxArchive, faPencil, faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { api } from '../database/db'
import TableButton from '../components/TableButton'
import CustomTable from '../components/Table/Table'

const ProductAdmin = () => {
  const [manufacturers, setManufacturers] = useState([])
  const [productLines, setProductLines] = useState([])
  const [productSets, setProductSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Form states
  const [newManufacturer, setNewManufacturer] = useState({ name: '' })
  const [newProductLine, setNewProductLine] = useState({ name: '', company_id: '' })
  const [newProductSet, setNewProductSet] = useState({ name: '', product_line_id: '' })

  // Edit Modal states
  const [showManufacturerModal, setShowManufacturerModal] = useState(false)
  const [showProductLineModal, setShowProductLineModal] = useState(false)
  const [showProductSetModal, setShowProductSetModal] = useState(false)
  const [editingManufacturer, setEditingManufacturer] = useState(null)
  const [editingProductLine, setEditingProductLine] = useState(null)
  const [editingProductSet, setEditingProductSet] = useState(null)

  // Add new states for each section's filtering
  const [selectedManufacturerForLines, setSelectedManufacturerForLines] = useState('')
  const [selectedManufacturerForSets, setSelectedManufacturerForSets] = useState('')

  // Add these new states
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [manufacturersPage, setManufacturersPage] = useState(1)
  const [productLinesPage, setProductLinesPage] = useState(1)
  const [productSetsPage, setProductSetsPage] = useState(1)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    // Auto-select manufacturer if there's only one
    if (manufacturers.length === 1) {
      setNewProductLine(prev => ({ ...prev, company_id: manufacturers[0].id.toString() }))
      setSelectedManufacturerForLines(manufacturers[0].id.toString())
    }
  }, [manufacturers])

  useEffect(() => {
    // Auto-select product line if there's only one available
    if (productLines.length === 1) {
      setNewProductSet(prev => ({ ...prev, product_line_id: productLines[0].id.toString() }))
    }
  }, [productLines])

  useEffect(() => {
    const fetchEntriesPerPage = async () => {
      try {
        const response = await api.get('/api/settings/productadmin_entries_per_page')
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
      const [manufacturersRes, productLinesRes, productSetsRes] = await Promise.all([
        api.get('/api/manufacturers'),
        api.get('/api/product-lines'),
        api.get('/api/product-sets')
      ])
      setManufacturers(manufacturersRes.data)
      setProductLines(productLinesRes.data)
      setProductSets(productSetsRes.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Add handlers
  const handleAddManufacturer = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/manufacturers', newManufacturer)
      setNewManufacturer({ name: '' })
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleAddProductLine = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/product-lines', newProductLine)
      setNewProductLine({ name: '', company_id: '' })
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleAddProductSet = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/product-sets', newProductSet)
      setNewProductSet({ name: '', product_line_id: '' })
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  // Delete handlers
  const handleDeleteManufacturer = async (id) => {
    if (window.confirm('Are you sure? This will delete all associated product lines and sets.')) {
      try {
        await api.delete(`/api/manufacturers/${id}`)
        fetchData()
      } catch (err) {
        setError(err.message)
      }
    }
  }

  const handleDeleteProductLine = async (id) => {
    if (window.confirm('Are you sure? This will delete all associated sets.')) {
      try {
        await api.delete(`/api/product-lines/${id}`)
        fetchData()
      } catch (err) {
        setError(err.message)
      }
    }
  }

  const handleDeleteProductSet = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await api.delete(`/api/product-sets/${id}`)
        fetchData()
      } catch (err) {
        setError(err.message)
      }
    }
  }

  // Edit handlers
  const handleEditManufacturer = async () => {
    try {
      await api.put(`/api/manufacturers/${editingManufacturer.id}`, editingManufacturer)
      setShowManufacturerModal(false)
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEditProductLine = async () => {
    try {
      await api.put(`/api/product-lines/${editingProductLine.id}`, editingProductLine)
      setShowProductLineModal(false)
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleEditProductSet = async () => {
    try {
      await api.put(`/api/product-sets/${editingProductSet.id}`, editingProductSet)
      setShowProductSetModal(false)
      fetchData()
    } catch (err) {
      setError(err.message)
    }
  }

  // Add validation check functions
  const isValidManufacturer = (manufacturer) => {
    return manufacturer?.name?.trim() !== ''
  }

  const isValidProductLine = (line) => {
    return line?.name?.trim() !== '' && line?.company_id !== ''
  }

  const isValidProductSet = (set) => {
    return set?.name?.trim() !== '' && set?.product_line_id !== ''
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'actions', label: '', className: 'actions-cell' }
  ];

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
              onClick={() => {
                setEditingManufacturer(row);
                setShowManufacturerModal(true);
              }}
              title="Edit Company"
              className="me-2"
            />
            <TableButton
              icon={faTrash}
              variant="danger"
              onClick={() => handleDeleteManufacturer(row.id)}
              title="Delete Company"
            />
          </>
        );
      default:
        return row[column.key];
    }
  };

  const openProductSetModal = (set) => {
    if (!set) return

    // Find the product line first
    const productLine = productLines.find(line => line.id === set.product_line_id)
    
    // Set both the product set and manufacturer
    setEditingProductSet({ ...set })
    if (productLine) {
      setSelectedManufacturerForSets(productLine.company_id.toString())
    }
    
    setShowProductSetModal(true)
  }

  const handleCloseProductSetModal = () => {
    setShowProductSetModal(false)
    setEditingProductSet(null)
    setSelectedManufacturerForSets('')
  }

  // Add filtered data getters
  const getFilteredProductLines = () => {
    if (!selectedManufacturerForLines) return productLines
    return productLines.filter(line => 
      line.company_id.toString() === selectedManufacturerForLines
    )
  }

  const getFilteredProductSets = () => {
    if (!selectedManufacturerForSets) return productSets
    return productSets.filter(set => {
      const productLine = productLines.find(line => line.id === set.product_line_id)
      return productLine?.company_id.toString() === selectedManufacturerForSets
    })
  }

  const getPaginatedData = (data, page, perPage) => {
    const start = (page - 1) * perPage
    const end = start + perPage
    return data.slice(start, end)
  }

  const getTotalPages = (totalItems, perPage) => {
    return Math.ceil(totalItems / perPage)
  }

  const handleEntriesPerPageChange = async (e) => {
    const value = e.target.value
    setEntriesPerPage(parseInt(value))
    setManufacturersPage(1)
    setProductLinesPage(1)
    setProductSetsPage(1)
    try {
      await api.put('/api/settings/productadmin_entries_per_page', { value })
    } catch (err) {
      console.error('Error saving entries per page setting:', err)
    }
  }

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

  return (
    <Container fluid className="content">
      <Card className="mb-4">
        <Card.Body>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div className="d-flex align-items-center">
              <FontAwesomeIcon icon={faBoxes} className="text-warning me-3" size="2x" />
              <div>
                <h4 className="mb-0">Product Admin</h4>
                <small className="text-muted">Manage manufacturers, product lines and sets</small>
              </div>
            </div>
            <div className="d-flex align-items-center">
              <span className="text-muted me-2">Show</span>
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
              <span className="text-muted ms-2">entries</span>
            </div>
          </div>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      <Row>
        {/* Manufacturers Card - Make narrower */}
        <Col md={3}>
          <Card className="mb-4">
            <Card.Body className="pb-0">
              <div className="d-flex align-items-center mb-4">
                <FontAwesomeIcon icon={faIndustry} className="text-warning me-2" />
                <h5 className="mb-0">Manufacturers</h5>
              </div>

              <Form onSubmit={handleAddManufacturer} className="mb-3">
                <Row className="g-2">
                  <Col>
                    <div className="position-relative">
                      <FontAwesomeIcon 
                        icon={faIndustry} 
                        className="position-absolute text-muted" 
                        style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                      <Form.Control
                        type="text"
                        value={newManufacturer.name}
                        onChange={(e) => setNewManufacturer({...newManufacturer, name: e.target.value})}
                        placeholder="Manufacturer name"
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
                      disabled={!isValidManufacturer(newManufacturer)}
                    >
                      <FontAwesomeIcon icon={faPlus} className="me-2 text-success" />
                      Add
                    </Button>
                  </Col>
                </Row>
              </Form>

              <CustomTable
                columns={columns}
                data={getPaginatedData(manufacturers, manufacturersPage, entriesPerPage)}
                renderCell={renderCell}
              />
              <PaginationControl
                currentPage={manufacturersPage}
                totalPages={getTotalPages(manufacturers.length, entriesPerPage)}
                onPageChange={setManufacturersPage}
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Product Lines Card */}
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body className="pb-0">
              <div className="d-flex align-items-center mb-4">
                <FontAwesomeIcon icon={faBoxes} className="text-warning me-2" />
                <h5 className="mb-0">Product Lines</h5>
              </div>

              <Form onSubmit={handleAddProductLine} className="mb-3">
                <Row className="g-2">
                  <Col>
                    <div className="position-relative">
                      <FontAwesomeIcon 
                        icon={faIndustry} 
                        className="position-absolute text-muted" 
                        style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                      <Form.Select
                        value={newProductLine.company_id}
                        onChange={(e) => {
                          setNewProductLine({...newProductLine, company_id: e.target.value})
                          setSelectedManufacturerForLines(e.target.value)
                        }}
                        required
                        style={{ paddingLeft: '35px' }}
                        className="placeholder-light"
                      >
                        <option value="">Select manufacturer</option>
                        {manufacturers.map(manufacturer => (
                          <option key={manufacturer.id} value={manufacturer.id}>
                            {manufacturer.name}
                          </option>
                        ))}
                      </Form.Select>
                    </div>
                  </Col>
                  <Col>
                    <div className="position-relative">
                      <FontAwesomeIcon 
                        icon={faBoxes} 
                        className="position-absolute text-muted" 
                        style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                      <Form.Control
                        type="text"
                        value={newProductLine.name}
                        onChange={(e) => setNewProductLine({...newProductLine, name: e.target.value})}
                        placeholder="Product line name"
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
                      disabled={!isValidProductLine(newProductLine)}
                    >
                      <FontAwesomeIcon icon={faPlus} className="me-2 text-success" />
                      Add
                    </Button>
                  </Col>
                </Row>
              </Form>

              <CustomTable
                columns={[
                  { key: 'manufacturer_name', label: 'Manufacturer', className: 'dimmed-cell' },
                  { key: 'name', label: 'Name' },
                  { key: 'actions', label: '', className: 'actions-cell' }
                ]}
                data={getPaginatedData(getFilteredProductLines(), productLinesPage, entriesPerPage)}
                renderCell={(row, column) => {
                  switch (column.key) {
                    case 'name':
                      return row.name;
                    case 'manufacturer_name':
                      return row.manufacturer_name;
                    case 'actions':
                      return (
                        <>
                          <TableButton
                            icon={faPencil}
                            variant="primary"
                            onClick={() => {
                              setEditingProductLine(row);
                              setShowProductLineModal(true);
                            }}
                            title="Edit Product Line"
                            className="me-2"
                          />
                          <TableButton
                            icon={faTrash}
                            variant="danger"
                            onClick={() => handleDeleteProductLine(row.id)}
                            title="Delete Product Line"
                          />
                        </>
                      );
                    default:
                      return row[column.key];
                  }
                }}
              />
              <PaginationControl
                currentPage={productLinesPage}
                totalPages={getTotalPages(getFilteredProductLines().length, entriesPerPage)}
                onPageChange={setProductLinesPage}
              />
            </Card.Body>
          </Card>
        </Col>

        {/* Product Sets Card - Make wider */}
        <Col md={5}>
          <Card className="mb-4">
            <Card.Body className="pb-0">
              <div className="d-flex align-items-center mb-4">
                <FontAwesomeIcon icon={faBoxArchive} className="text-warning me-2" />
                <h5 className="mb-0">Product Sets</h5>
              </div>

              <Form onSubmit={handleAddProductSet} className="mb-3">
                <Row className="g-2">
                  <Col>
                    <div className="position-relative">
                      <FontAwesomeIcon 
                        icon={faIndustry} 
                        className="position-absolute text-muted" 
                        style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                      <Form.Select
                        value={selectedManufacturerForSets}
                        onChange={(e) => setSelectedManufacturerForSets(e.target.value)}
                        required
                        style={{ paddingLeft: '35px' }}
                        className="placeholder-light"
                      >
                        <option value="">All manufacturers</option>
                        {manufacturers.map(manufacturer => (
                          <option key={manufacturer.id} value={manufacturer.id}>
                            {manufacturer.name}
                          </option>
                        ))}
                      </Form.Select>
                    </div>
                  </Col>
                  <Col>
                    <div className="position-relative">
                      <FontAwesomeIcon 
                        icon={faBoxes} 
                        className="position-absolute text-muted" 
                        style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                      <Form.Select
                        value={newProductSet.product_line_id}
                        onChange={(e) => setNewProductSet({...newProductSet, product_line_id: e.target.value})}
                        required
                        disabled={!selectedManufacturerForSets}
                        style={{ paddingLeft: '35px' }}
                        className="placeholder-light"
                      >
                        <option value="">Select product line</option>
                        {productLines
                          .filter(line => line.company_id.toString() === selectedManufacturerForSets)
                          .map(line => (
                            <option key={line.id} value={line.id}>
                              {line.name}
                            </option>
                          ))}
                      </Form.Select>
                    </div>
                  </Col>
                  <Col>
                    <div className="position-relative">
                      <FontAwesomeIcon 
                        icon={faBoxArchive} 
                        className="position-absolute text-muted" 
                        style={{ left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                      />
                      <Form.Control
                        type="text"
                        value={newProductSet.name}
                        onChange={(e) => setNewProductSet({...newProductSet, name: e.target.value})}
                        placeholder="Product set name"
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
                      disabled={!isValidProductSet(newProductSet)}
                    >
                      <FontAwesomeIcon icon={faPlus} className="me-2 text-success" />
                      Add
                    </Button>
                  </Col>
                </Row>
              </Form>

              <CustomTable
                columns={[
                  { key: 'manufacturer_name', label: 'Manufacturer', className: 'dimmed-cell' },
                  { key: 'product_line_name', label: 'Product Line', className: 'dimmed-cell' },
                  { key: 'name', label: 'Name' },
                  { key: 'actions', label: '', className: 'actions-cell' }
                ]}
                data={getPaginatedData(getFilteredProductSets(), productSetsPage, entriesPerPage)}
                renderCell={(row, column) => {
                  switch (column.key) {
                    case 'name':
                      return row.name;
                    case 'manufacturer_name':
                      return row.manufacturer_name;
                    case 'product_line_name':
                      return row.product_line_name;
                    case 'actions':
                      return (
                        <>
                          <TableButton
                            icon={faPencil}
                            variant="primary"
                            onClick={() => {
                              openProductSetModal(row);
                            }}
                            title="Edit Product Set"
                            className="me-2"
                          />
                          <TableButton
                            icon={faTrash}
                            variant="danger"
                            onClick={() => handleDeleteProductSet(row.id)}
                            title="Delete Product Set"
                          />
                        </>
                      );
                    default:
                      return row[column.key];
                  }
                }}
              />
              <PaginationControl
                currentPage={productSetsPage}
                totalPages={getTotalPages(getFilteredProductSets().length, entriesPerPage)}
                onPageChange={setProductSetsPage}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Edit Modals */}
      <Modal show={showManufacturerModal} onHide={() => setShowManufacturerModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Manufacturer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={editingManufacturer?.name || ''}
                onChange={(e) => setEditingManufacturer({
                  ...editingManufacturer,
                  name: e.target.value
                })}
                required
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowManufacturerModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditManufacturer}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showProductLineModal} onHide={() => setShowProductLineModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Product Line</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={editingProductLine?.name || ''}
                onChange={(e) => setEditingProductLine({
                  ...editingProductLine,
                  name: e.target.value
                })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Manufacturer</Form.Label>
              <Form.Select
                value={editingProductLine?.company_id || ''}
                onChange={(e) => setEditingProductLine({
                  ...editingProductLine,
                  company_id: e.target.value
                })}
                required
              >
                <option value="">Select Manufacturer</option>
                {manufacturers.map(manufacturer => (
                  <option key={manufacturer.id} value={manufacturer.id}>
                    {manufacturer.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProductLineModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditProductLine}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showProductSetModal} onHide={handleCloseProductSetModal}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Product Set</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={editingProductSet?.name || ''}
                onChange={(e) => setEditingProductSet({
                  ...editingProductSet,
                  name: e.target.value
                })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Manufacturer</Form.Label>
              <Form.Select
                value={selectedManufacturerForSets}
                onChange={(e) => {
                  setSelectedManufacturerForSets(e.target.value)
                  // Clear product line selection when manufacturer changes
                  setEditingProductSet(prev => ({
                    ...prev,
                    product_line_id: ''
                  }))
                }}
                required
              >
                <option value="">Select Manufacturer</option>
                {manufacturers.map(manufacturer => (
                  <option key={manufacturer.id} value={manufacturer.id}>
                    {manufacturer.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Product Line</Form.Label>
              <Form.Select
                value={editingProductSet?.product_line_id || ''}
                onChange={(e) => setEditingProductSet({
                  ...editingProductSet,
                  product_line_id: e.target.value
                })}
                required
                disabled={!selectedManufacturerForSets}
              >
                <option value="">Select Product Line</option>
                {productLines.map(line => (
                  <option key={line.id} value={line.id}>
                    {line.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseProductSetModal}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleEditProductSet}
            disabled={!isValidProductSet(editingProductSet)}
          >
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default ProductAdmin 