import React, { useState, useEffect } from 'react'
import { Container, Card, Button, Table, Row, Col, Form } from 'react-bootstrap'
import { faPhotoFilm, faPlus, faList, faTableCells, faImage, faPencil, faTrash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { api } from '../database/db'
import MiniOverviewAdd from './MiniOverviewAdd'
import MiniOverviewEdit from './MiniOverviewEdit'
import MiniCardGrid from '../components/MiniCards/MiniCardGrid'
import ImageModal from '../components/ImageModal'
import { useTheme } from '../context/ThemeContext'
import TableButton from '../components/TableButton'

const styles = {
  fontSize: '0.75rem'  // Even smaller, equivalent to 12px
}

const MiniOverview = () => {
  const { darkMode } = useTheme()
  
  // State hooks
  const [categories, setCategories] = useState([])
  const [types, setTypes] = useState([])
  const [tags, setTags] = useState([])
  const [productSets, setProductSets] = useState([])
  const [minis, setMinis] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modal visibility states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  
  // State for the mini being edited
  const [editingMini, setEditingMini] = useState(null)

  // Image modal state
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  // View type and pagination states
  const [viewType, setViewType] = useState('table')
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // First useEffect to fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, typesRes, tagsRes, productSetsRes, minisRes, settingsRes] = await Promise.all([
          api.get('/api/categories'),
          api.get('/api/types'),
          api.get('/api/tags'),
          api.get('/api/product-sets'),
          api.get('/api/minis'),
          api.get('/api/settings')
        ])

        setCategories(categoriesRes.data)
        setTypes(typesRes.data)
        setTags(tagsRes.data)
        setProductSets(productSetsRes.data)
        setMinis(minisRes.data)

        if (settingsRes.data.collection_viewtype) {
          setViewType(settingsRes.data.collection_viewtype)
        }
        if (settingsRes.data.collection_show_entries_per_page) {
          setEntriesPerPage(parseInt(settingsRes.data.collection_show_entries_per_page))
        }

        setLoading(false)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Separate useEffect to map IDs - modified to prevent infinite loop
  useEffect(() => {
    if (categories.length && types.length && tags.length && productSets.length) {
      const splitAndTrim = (str) => str ? str.split(',').map(n => n.trim()) : []
      
      setMinis(prevMinis => {
        // Only update if we have minis to process
        if (!prevMinis.length) return prevMinis

        // Check if minis already have IDs mapped
        const firstMini = prevMinis[0]
        if (firstMini.category_ids !== undefined) return prevMinis

        return prevMinis.map(mini => ({
          ...mini,
          image_path: mini.image_path ? `${mini.image_path}?t=${Date.now()}` : null,
          original_image_path: mini.original_image_path ? `${mini.original_image_path}?t=${Date.now()}` : null,
          category_ids: mini.category_names ? 
            categories.filter(cat => 
              splitAndTrim(mini.category_names).includes(cat.name)
            ).map(cat => cat.id.toString()) : [],
          type_ids: mini.type_names ? 
            types.filter(type => 
              splitAndTrim(mini.type_names).includes(type.name)
            ).map(type => type.id.toString()) : [],
          proxy_type_ids: mini.proxy_type_names ? 
            types.filter(type => 
              splitAndTrim(mini.proxy_type_names).includes(type.name)
            ).map(type => type.id.toString()) : [],
          tag_ids: mini.tag_names ? 
            tags.filter(tag => 
              splitAndTrim(mini.tag_names).includes(tag.name)
            ).map(tag => tag.id.toString()) : [],
          product_set_ids: mini.product_set_names ? 
            productSets.filter(set => {
              const fullSetName = `${set.name} (${set.product_line_name} by ${set.manufacturer_name})`
              return splitAndTrim(mini.product_set_names).includes(fullSetName)
            }).map(set => set.id.toString()) : []
        }))
      })
    }
  }, [categories, types, tags, productSets]) // Removed minis from dependencies

  // Pagination
  const paginatedMinis = minis.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  )

  // Handle View Type Change
  const handleViewTypeChange = async (type) => {
    setViewType(type)
    try {
      await api.put(`/api/settings/collection_viewtype`, { value: type })
    } catch (error) {
      console.error('Error saving view type setting:', error)
    }
  }

  // Handle Entries Per Page Change
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

  // Handle Edit Mini
  const handleEditMini = async (mini) => {
    try {
      // Fetch the latest data for this mini including all relationships
      const response = await api.get(`/api/minis/${mini.id}/relationships`)
      const miniWithRelationships = response.data

      // Set the editingMini with complete data
      setEditingMini({
        ...miniWithRelationships,
        category_ids: miniWithRelationships.categories,
        type_ids: miniWithRelationships.types,
        proxy_type_ids: miniWithRelationships.proxy_types,
        tags: miniWithRelationships.tags,
        product_set_ids: miniWithRelationships.product_sets
      })
      setShowEditModal(true)
    } catch (error) {
      console.error('Error fetching mini relationships:', error)
      setError(error.response?.data?.error || error.message)
    }
  }

  // Handle Delete Mini
  const handleDeleteMini = async (id) => {
    if (window.confirm('Are you sure you want to delete this mini?')) {
      try {
        await api.delete(`/api/minis/${id}`)
        setMinis(prevMinis => prevMinis.filter(mini => mini.id !== id))
      } catch (err) {
        console.error('Error deleting mini:', err)
        setError(err.response?.data?.error || err.message)
      }
    }
  }

  // Handle Image Click
  const handleImageClick = (mini) => {
    setSelectedImage({
      path: mini.original_image_path,
      name: mini.name
    })
    setShowImageModal(true)
  }

  if (error) return <div>Error: {error}</div>

  return (
    <Container fluid className="content" style={styles}>
      <Card className="mb-4">
        <Card.Body className="d-flex align-items-center">
          <FontAwesomeIcon icon={faPhotoFilm} className="text-info me-3" size="2x" />
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
                style={{ width: '65px' }}  
                value={entriesPerPage}
                onChange={(e) => handleEntriesPerPageChange(e.target.value)}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </Form.Select>
              <span className="ms-2">entries</span>
            </div>
            <div className="btn-group me-4">  
              <Button 
                variant={viewType === 'table' ? 'light' : 'outline-light'}
                onClick={() => handleViewTypeChange('table')}
                title="Table View"
                className="border"
              >
                <FontAwesomeIcon icon={faList} className="text-secondary" />
              </Button>
              <Button 
                variant={viewType === 'cards' ? 'light' : 'outline-light'}
                onClick={() => handleViewTypeChange('cards')}
                title="Card View"
                className="border"
              >
                <FontAwesomeIcon icon={faTableCells} className="text-secondary" />
              </Button>
            </div>
          </div>
          <Button 
            variant="light" 
            onClick={() => setShowAddModal(true)} 
            style={{ whiteSpace: 'nowrap' }}
            className="border"
          >
            <FontAwesomeIcon icon={faPlus} className="me-2 text-success" />
            Add New Mini
          </Button>
        </div>

        {/* Conditional rendering based on view type */}
        {viewType === 'table' ? (
          <Table hover responsive className="table-with-actions small-text">
            <thead>
              <tr>
                <th style={{ width: '50px' }}></th>
                <th style={{ whiteSpace: 'nowrap' }}>Name</th>
                <th style={{ whiteSpace: 'nowrap' }}>Location</th>
                <th>Categories</th>
                <th>Types</th>
                <th>Proxy Types</th>
                <th>Product Sets</th>
                <th style={{ width: '150px', maxWidth: '150px' }}>Tags</th>
                <th style={{ textAlign: 'center' }}>QTY</th>
                <th className="action-column"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedMinis.map(mini => (
                <tr key={mini.id}>
                  <td className="text-center">
                    {mini.image_path && (
                      <img 
                        src={mini.image_path} 
                        alt={mini.name}
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          objectFit: 'contain',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleImageClick(mini)}
                        title="Click to view full image"
                      />
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <a 
                      href={`https://www.miniscollector.com/minis/gallery?title=${encodeURIComponent(mini.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-none"
                    >
                      {mini.name}
                    </a>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{mini.location}</td>
                  <td>{mini.category_names?.split(',').join(', ')}</td>
                  <td>{mini.type_names?.split(',').join(', ')}</td>
                  <td>{mini.proxy_type_names?.split(',').join(', ')}</td>
                  <td>
                    {mini.product_set_names?.split(',').map((setName, index) => {
                      const matches = setName.trim().match(/(.+?)\s*\((.+?)\s+by\s+(.+?)\)/)
                      if (matches) {
                        const [_, setName, productLine, manufacturer] = matches
                        return (
                          <div key={index} style={{ marginBottom: index < mini.product_set_names.split(',').length - 1 ? '1rem' : 0 }}>
                            <div className="fw-bold">{manufacturer}</div>
                            <div>· {productLine}</div>
                            <div>·· {setName}</div>
                          </div>
                        )
                      }
                      return setName
                    })}
                  </td>
                  <td style={{ width: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {mini.tag_names?.split(',').join(', ')}
                  </td>
                  <td style={{ textAlign: 'center' }}>{mini.quantity}</td>
                  <td className="action-column">
                    <div className="action-column-content">
                      <TableButton
                        icon={faImage}
                        variant="info"
                        onClick={() => handleImageClick(mini)}
                        title="View Image"
                        disabled={!mini.image_path}
                      />
                      <TableButton
                        icon={faPencil}
                        variant="primary"
                        onClick={() => handleEditMini(mini)}
                        title="Edit Mini"
                      />
                      <TableButton
                        icon={faTrash}
                        variant="danger"
                        onClick={() => handleDeleteMini(mini.id)}
                        title="Delete Mini"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <MiniCardGrid
            minis={paginatedMinis.map(mini => ({
              ...mini,
              formattedProductSets: mini.product_set_names?.split(',').map(setName => {
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
              }),
              categories: mini.category_names?.split(',').map(cat => cat.trim()),
              types: mini.type_names?.split(',').map(type => type.trim()),
              proxyTypes: mini.proxy_type_names?.split(',').map(type => type.trim()),
              tags: mini.tag_names?.split(',').map(tag => tag.trim())
            }))}
            onEdit={handleEditMini}
            onDelete={handleDeleteMini}
            onImageClick={handleImageClick}
            darkMode={darkMode}
          />
        )}
      </div>

      {/* Add Mini Modal */}
      <MiniOverviewAdd 
        show={showAddModal}
        handleClose={() => setShowAddModal(false)}
        categories={categories}
        types={types}
        tags={tags}
        productSets={productSets}
        setMinis={setMinis}
        minis={minis}
      />

      {/* Edit Mini Modal */}
      {editingMini && (
        <MiniOverviewEdit 
          show={showEditModal}
          handleClose={() => setShowEditModal(false)}
          categories={categories}
          types={types}
          tags={tags}
          productSets={productSets}
          mini={editingMini}
          setMinis={setMinis}
          minis={minis}
        />
      )}

      {/* Image Modal */}
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