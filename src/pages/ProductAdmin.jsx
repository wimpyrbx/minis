import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Form, Button, Table, Alert, Card, Modal } from 'react-bootstrap'
import { faBoxes, faTrash, faIndustry, faBoxArchive, faPencil } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { api } from '../database/db'
import TableButton from '../components/TableButton'

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

  // Add new state for filtered product lines
  const [selectedManufacturer, setSelectedManufacturer] = useState('')
  const [filteredProductLines, setFilteredProductLines] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedManufacturer) {
      const filtered = productLines.filter(line => 
        line.company_id === parseInt(selectedManufacturer)
      )
      setFilteredProductLines(filtered)
      // Clear product line selection if current selection isn't in filtered list
      if (!filtered.find(line => line.id === parseInt(newProductSet.product_line_id))) {
        setNewProductSet(prev => ({ ...prev, product_line_id: '' }))
      }
    } else {
      setFilteredProductLines([])
      setNewProductSet(prev => ({ ...prev, product_line_id: '' }))
    }
  }, [selectedManufacturer, productLines])

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

  if (loading) return <div>Loading...</div>

  return (
    <Container fluid className="content">
      <Card className="mb-4">
        <Card.Body className="d-flex align-items-center">
          <FontAwesomeIcon icon={faBoxes} className="text-primary me-3" size="2x" />
          <div>
            <h4 className="mb-0">Product Administration</h4>
            <small className="text-muted">Manage manufacturers, product lines, and sets</small>
          </div>
        </Card.Body>
      </Card>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      <Row>
        {/* Manufacturers Card - Make narrower */}
        <Col md={3}>
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex align-items-center mb-4">
                <FontAwesomeIcon icon={faIndustry} className="text-primary me-2" />
                <h5 className="mb-0">Manufacturers</h5>
              </div>

              <Form onSubmit={handleAddManufacturer} className="mb-4">
                <Row>
                  <Col md={9}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={newManufacturer.name}
                        onChange={(e) => setNewManufacturer({...newManufacturer, name: e.target.value})}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3} className="d-flex align-items-end">
                    <Button type="submit" variant="primary" className="mb-3 w-100">
                      Add
                    </Button>
                  </Col>
                </Row>
              </Form>

              <Table hover>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th width="100"></th>
                  </tr>
                </thead>
                <tbody>
                  {manufacturers.map(manufacturer => (
                    <tr key={manufacturer.id}>
                      <td>{manufacturer.name}</td>
                      <td className="text-nowrap">
                        <TableButton
                          icon={faPencil}
                          variant="primary"
                          onClick={() => {
                            setEditingManufacturer(manufacturer)
                            setShowManufacturerModal(true)
                          }}
                          title="Edit Company"
                          className="me-2"
                        />
                        <TableButton
                          icon={faTrash}
                          variant="danger"
                          onClick={() => handleDeleteManufacturer(manufacturer.id)}
                          title="Delete Company"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* Product Lines Card */}
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex align-items-center mb-4">
                <FontAwesomeIcon icon={faBoxes} className="text-primary me-2" />
                <h5 className="mb-0">Product Lines</h5>
              </div>

              <Form onSubmit={handleAddProductLine} className="mb-4">
                <Row>
                  <Col md={5}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={newProductLine.name}
                        onChange={(e) => setNewProductLine({...newProductLine, name: e.target.value})}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Manufacturer</Form.Label>
                      <Form.Select
                        value={newProductLine.company_id}
                        onChange={(e) => setNewProductLine({...newProductLine, company_id: e.target.value})}
                        required
                      >
                        <option value="">Select</option>
                        {manufacturers.map(manufacturer => (
                          <option key={manufacturer.id} value={manufacturer.id}>
                            {manufacturer.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3} className="d-flex align-items-end">
                    <Button type="submit" variant="primary" className="mb-3 w-100">
                      Add
                    </Button>
                  </Col>
                </Row>
              </Form>

              <Table hover>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Manufacturer</th>
                    <th width="100"></th>
                  </tr>
                </thead>
                <tbody>
                  {productLines.map(line => (
                    <tr key={line.id}>
                      <td>{line.name}</td>
                      <td>{line.manufacturer_name}</td>
                      <td className="text-nowrap">
                        <TableButton
                          icon={faPencil}
                          variant="primary"
                          onClick={() => {
                            setEditingProductLine(line)
                            setShowProductLineModal(true)
                          }}
                          title="Edit Product Line"
                          className="me-2"
                        />
                        <TableButton
                          icon={faTrash}
                          variant="danger"
                          onClick={() => handleDeleteProductLine(line.id)}
                          title="Delete Product Line"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        {/* Product Sets Card - Make wider */}
        <Col md={5}>
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex align-items-center mb-4">
                <FontAwesomeIcon icon={faBoxArchive} className="text-primary me-2" />
                <h5 className="mb-0">Product Sets</h5>
              </div>

              <Form onSubmit={handleAddProductSet} className="mb-4">
                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={newProductSet.name}
                        onChange={(e) => setNewProductSet({...newProductSet, name: e.target.value})}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Manufacturer</Form.Label>
                      <Form.Select
                        value={selectedManufacturer}
                        onChange={(e) => setSelectedManufacturer(e.target.value)}
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
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Product Line</Form.Label>
                      <Form.Select
                        value={newProductSet.product_line_id}
                        onChange={(e) => setNewProductSet({...newProductSet, product_line_id: e.target.value})}
                        required
                        disabled={!selectedManufacturer}
                      >
                        <option value="">Select Product Line</option>
                        {filteredProductLines.map(line => (
                          <option key={line.id} value={line.id}>
                            {line.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3} className="d-flex align-items-end">
                    <Button type="submit" variant="primary" className="mb-3 w-100">
                      Add
                    </Button>
                  </Col>
                </Row>
              </Form>

              <Table hover>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Manufacturer</th>
                    <th>Product Line</th>
                    <th width="100"></th>
                  </tr>
                </thead>
                <tbody>
                  {productSets.map(set => (
                    <tr key={set.id}>
                      <td>{set.name}</td>
                      <td>{set.manufacturer_name}</td>
                      <td>{set.product_line_name}</td>
                      <td className="text-nowrap">
                        <TableButton
                          icon={faPencil}
                          variant="primary"
                          onClick={() => {
                            setEditingProductSet(set)
                            setShowProductSetModal(true)
                          }}
                          title="Edit Product Set"
                          className="me-2"
                        />
                        <TableButton
                          icon={faTrash}
                          variant="danger"
                          onClick={() => handleDeleteProductSet(set.id)}
                          title="Delete Product Set"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
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

      <Modal show={showProductSetModal} onHide={() => setShowProductSetModal(false)}>
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
                value={selectedManufacturer}
                onChange={(e) => setSelectedManufacturer(e.target.value)}
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
                disabled={!selectedManufacturer}
              >
                <option value="">Select Product Line</option>
                {filteredProductLines.map(line => (
                  <option key={line.id} value={line.id}>
                    {line.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProductSetModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditProductSet}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default ProductAdmin 