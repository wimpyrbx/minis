import React, { useState, useEffect } from 'react'
import { Container, Card, Button, Table, Row, Col, Form, Pagination, Alert } from 'react-bootstrap'
import { faPhotoFilm, faPlus, faList, faTableCells, faImage, faPencil, faTrash, faCubesStacked } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { api } from '../database/db'
import MiniOverviewAdd from './MiniOverviewAdd'
import MiniOverviewEdit from './MiniOverviewEdit'
import MiniCardGrid from '../components/MiniCards/MiniCardGrid'
import ImageModal from '../components/ImageModal'
import { useTheme } from '../context/ThemeContext'
import TableButton from '../components/TableButton'
import MiniViewer from '../components/MiniViewer/MiniViewer'
import '../styles/TableHighlight.css'
import PageHeader from '../components/PageHeader/PageHeader'
import * as bootstrap from 'bootstrap'
import MouseOverInfo from '../components/MouseOverInfo/MouseOverInfo'

const styles = {
  fontSize: '0.75rem'  // Even smaller, equivalent to 12px
}

const tooltipStyles = `
  .tooltip-inner {
    text-align: left !important;
    font-family: monospace;
  }
`

const tableStyles = `
  .custom-table tbody tr,
  .custom-table tbody tr td {
    cursor: default;
  }
  
  .custom-table .text-success,
  .custom-table img,
  .custom-table .table-button {
    cursor: pointer;
  }
`

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
  const [baseSizes, setBaseSizes] = useState([])

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
  const [itemsPerPage] = useState(10)  // You can adjust this number

  // Add new state for search
  const [searchTerm, setSearchTerm] = useState('')

  // Add new state for MiniViewer
  const [showViewer, setShowViewer] = useState(false)
  const [selectedMini, setSelectedMini] = useState(null)

  // Add new state for tracking recently updated mini
  const [recentlyUpdatedMiniId, setRecentlyUpdatedMiniId] = useState(null)

  // Add this state for managing popover visibility
  const [showProductSetInfo, setShowProductSetInfo] = useState(null) // Will store mini.id when showing

  // Fetch data once
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data...')
        const [categoriesRes, typesRes, tagsRes, productSetsRes, minisRes, baseSizesRes, settingsRes] = await Promise.all([
          api.get('/api/categories'),
          api.get('/api/types'),
          api.get('/api/tags'),
          api.get('/api/product-sets'),
          api.get('/api/minis'),
          api.get('/api/base-sizes'),
          api.get('/api/settings')
        ])

        const splitAndTrim = (str) => str ? str.split(',').map(n => n.trim()) : []

        const processedMinis = minisRes.data.map(mini => ({
          ...mini,
          image_path: mini.image_path ? `${mini.image_path}?t=${Date.now()}` : null,
          original_image_path: mini.original_image_path ? `${mini.original_image_path}?t=${Date.now()}` : null,
          category_ids: mini.category_names ? 
            categoriesRes.data.filter(cat => 
              splitAndTrim(mini.category_names).includes(cat.name)
            ).map(cat => cat.id.toString()) : [],
          type_ids: mini.type_names ? 
            typesRes.data.filter(type => 
              splitAndTrim(mini.type_names).includes(type.name)
            ).map(type => type.id.toString()) : [],
          proxy_type_ids: mini.proxy_type_names ? 
            typesRes.data.filter(type => 
              splitAndTrim(mini.proxy_type_names).includes(type.name)
            ).map(type => type.id.toString()) : [],
          tag_ids: mini.tag_names ? 
            tagsRes.data.filter(tag => 
              splitAndTrim(mini.tag_names).includes(tag.name)
            ).map(tag => tag.id.toString()) : [],
          product_set_ids: mini.product_set_names ? 
            productSetsRes.data.filter(set => {
              const fullSetName = `${set.name} (${set.product_line_name} by ${set.manufacturer_name})`
              return splitAndTrim(mini.product_set_names).includes(fullSetName)
            }).map(set => set.id.toString()) : []
        }))

        console.log('Setting processed minis:', processedMinis)
        setMinis(processedMinis)
        setCategories(categoriesRes.data)
        setTypes(typesRes.data)
        setTags(tagsRes.data)
        setProductSets(productSetsRes.data)
        setBaseSizes(baseSizesRes.data)

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

  // Filter minis
  const filterMinis = (minisToFilter) => {
    if (!minisToFilter) return []
    if (!searchTerm) return minisToFilter

    return minisToFilter.filter(mini => {
      const searchLower = searchTerm.toLowerCase()
      return (
        mini.name?.toLowerCase().includes(searchLower) ||
        mini.location?.toLowerCase().includes(searchLower) ||
        mini.category_names?.toLowerCase().includes(searchLower) ||
        mini.type_names?.toLowerCase().includes(searchLower) ||
        mini.proxy_type_names?.toLowerCase().includes(searchLower) ||
        mini.tag_names?.toLowerCase().includes(searchLower)
      )
    })
  }

  // Calculate pagination values
  const filteredMinis = filterMinis(minis)
  const totalPages = Math.max(1, Math.ceil(filteredMinis.length / entriesPerPage))
  const currentMinis = filteredMinis.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  )

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const renderPaginationItems = () => {
    const items = []
    for (let number = 1; number <= totalPages; number++) {
      items.push(
        <Pagination.Item 
          key={number} 
          active={number === currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      )
    }
    return items
  }

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
  const handleEntriesPerPageChange = async (e) => {
    const value = parseInt(e.target.value) || 10 // Provide default value if parsing fails
    setEntriesPerPage(value)
    setCurrentPage(1)
    
    try {
      await api.put(`/api/settings/collection_show_entries_per_page`, {
        value: value.toString() // Convert to string when saving to API
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

  // Add this new handler
  const handleMiniNameClick = (mini) => {
    setSelectedMini(mini)
    setShowViewer(true)
  }

  // Pass this function to MiniOverviewEdit
  const handleMiniUpdate = (updatedMini) => {
    setMinis(prevMinis => prevMinis.map(m => 
      m.id === updatedMini.id ? updatedMini : m
    ))
    setRecentlyUpdatedMiniId(updatedMini.id)
    
    // Clear the highlight after 3 seconds
    setTimeout(() => {
      setRecentlyUpdatedMiniId(null)
    }, 3000)
  }

  useEffect(() => {
    // Initialize all tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl, {
        delay: { show: 0, hide: 0 }
      })
    })

    // Cleanup function to destroy tooltips when component unmounts
    return () => {
      tooltipTriggerList.map(function (tooltipTriggerEl) {
        const tooltip = bootstrap.Tooltip.getInstance(tooltipTriggerEl)
        if (tooltip) {
          tooltip.dispose()
        }
      })
    }
  }, [minis]) // Re-run when minis changes

  useEffect(() => {
    // Add custom styles to head
    const styleSheet = document.createElement("style")
    styleSheet.innerText = tooltipStyles
    document.head.appendChild(styleSheet)

    // Cleanup
    return () => {
      document.head.removeChild(styleSheet)
    }
  }, [])

  useEffect(() => {
    const styleSheet = document.createElement("style")
    styleSheet.innerText = tableStyles
    document.head.appendChild(styleSheet)

    return () => {
      document.head.removeChild(styleSheet)
    }
  }, [])

  if (error) return <div>Error: {error}</div>

  return (
    <Container fluid className="content" style={styles}>
      <PageHeader
        icon={faPhotoFilm}
        iconColor="text-info"
        title="Mini Overview"
        subtitle="View and manage your miniature collection"
      >
        <div className="d-flex align-items-center gap-2">
          <Button 
            variant="light" 
            className="border d-flex align-items-center" 
            onClick={() => setShowAddModal(true)}
          >
            <FontAwesomeIcon icon={faPlus} className="me-2 text-success" />
            Add New Mini
          </Button>
          <div className="btn-group">
            <Button 
              variant={viewType === 'table' ? 'primary' : 'light'} 
              className="border d-flex align-items-center" 
              onClick={() => handleViewTypeChange('table')}
            >
              <FontAwesomeIcon icon={faList} />
            </Button>
            <Button 
              variant={viewType === 'grid' ? 'primary' : 'light'} 
              className="border d-flex align-items-center" 
              onClick={() => handleViewTypeChange('grid')}
            >
              <FontAwesomeIcon icon={faTableCells} />
            </Button>
          </div>
        </div>
      </PageHeader>

      {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

      {/* Wrap table in Card component */}
      <Card className="mb-4">
        <Card.Body className="pb-0 pt-2">
          <div className="d-flex justify-content-between align-items-center mb-2" style={{ minHeight: '32px' }}>
            <div className="d-flex align-items-center">
              <FontAwesomeIcon icon={faPhotoFilm} className="text-info me-2" />
              <h5 className="mb-0">Collection Overview</h5>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted me-2" style={{ fontSize: '0.875rem' }}>Show</span>
              <Form.Select 
                size="sm" 
                value={entriesPerPage.toString()} // Convert to string to avoid NaN warning
                onChange={handleEntriesPerPageChange}
                style={{ 
                  width: '60px',
                  fontSize: '0.875rem',
                  padding: '0.25rem 0.5rem',
                  height: 'auto'
                }}
                className="mx-2"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </Form.Select>
              <span className="text-muted" style={{ fontSize: '0.875rem' }}>entries</span>
            </div>
          </div>

          {/* Conditional rendering based on view type */}
          {viewType === 'table' ? (
            <>
              <div className="table-wrapper">
                <Table hover responsive className="custom-table table-with-actions small-text mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}></th>
                      <th>Name</th>
                      <th>Categories</th>
                      <th>Types</th>
                      <th>Product Set</th>
                      <th>Tags</th>
                      <th>Base Size</th>
                      <th>Location</th>
                      <th style={{ width: '60px', textAlign: 'center' }}>QTY</th>
                      <th className="actions-cell"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMinis.map(mini => (
                      <tr key={mini.id}>
                        <td className="text-center align-middle">
                          {mini.image_path && (
                            <img 
                              src={mini.image_path} 
                              alt={mini.name}
                              style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                              onClick={() => handleImageClick(mini)}
                            />
                          )}
                        </td>
                        
                        {/* Name Column */}
                        <td className="align-middle">
                          <span 
                            className="fw-bold"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleMiniNameClick(mini)}
                          >
                            {mini.name}
                          </span>
                        </td>

                        {/* Categories Column */}
                        <td className="align-middle">
                          {mini.category_ids?.map((id) => {
                            const category = categories.find(c => c.id.toString() === id)
                            return category ? (
                              <span key={id} className="badge bg-secondary me-1 mb-1">{category.name}</span>
                            ) : null
                          })}
                        </td>
                        
                        {/* Combined Types Column */}
                        <td className="align-middle">
                          {/* Regular Types */}
                          {mini.type_ids?.map((id) => {
                            const type = types.find(t => t.id.toString() === id)
                            return type ? (
                              <span key={id} className="badge bg-info me-1 mb-1">{type.name}</span>
                            ) : null
                          })}
                          {/* Proxy Types - shown after regular types */}
                          {mini.proxy_type_ids?.map((id) => {
                            const proxyType = types.find(t => t.id.toString() === id)
                            return proxyType ? (
                              <span key={id} className="badge bg-warning text-dark me-1 mb-1">
                                {proxyType.name}
                              </span>
                            ) : null
                          })}
                        </td>

                        {/* Product Set Column */}
                        <td 
                          className="align-middle"
                          onMouseEnter={() => mini.product_set_name && mini.product_set_name !== '-' ? setShowProductSetInfo(mini.id) : null}
                          onMouseLeave={() => setShowProductSetInfo(null)}
                          ref={(el) => el && (el.dataset.miniId = mini.id)}
                        >
                          {mini.product_set_name && mini.product_set_name !== '-' ? (
                            <>
                              <span>
                                {mini.product_set_name}
                              </span>
                              <MouseOverInfo
                                show={showProductSetInfo === mini.id}
                                target={document.querySelector(`[data-mini-id="${mini.id}"]`)}
                                title="Product Set Information"
                                icon={faCubesStacked}
                                headerColor="success"
                                onMouseEnter={() => setShowProductSetInfo(mini.id)}
                                onMouseLeave={() => setShowProductSetInfo(null)}
                              >
                                <div className="d-flex flex-column gap-1">
                                  <div>
                                    <strong>Manufacturer:</strong> {mini.manufacturer_name}
                                  </div>
                                  <div>
                                    <strong>Product Line:</strong> {mini.product_line_name}
                                  </div>
                                  <div>
                                    <strong>Set:</strong> {mini.product_set_name}
                                  </div>
                                </div>
                              </MouseOverInfo>
                            </>
                          ) : (
                            <span className="text-muted">None</span>
                          )}
                        </td>

                        {/* Tags Column (formerly part of Details) */}
                        <td className="align-middle">
                          {mini.tag_ids?.map((id) => {
                            const tag = tags.find(t => t.id.toString() === id)
                            return tag ? (
                              <span key={id} className="badge bg-primary me-1">{tag.name}</span>
                            ) : null
                          })}
                        </td>

                        {/* Base Size Column */}
                        <td className="align-middle">
                          {mini.base_size_name ? 
                            mini.base_size_name.charAt(0).toUpperCase() + mini.base_size_name.slice(1) 
                            : 'N/A'}
                        </td>

                        {/* Location Column */}
                        <td className="align-middle">
                          {mini.location || 'N/A'}
                        </td>

                        {/* Quantity Column - moved to after Location */}
                        <td className="align-middle text-center">
                          {mini.quantity}
                        </td>

                        {/* Actions Column */}
                        <td className="actions-cell align-middle">
                          <TableButton
                            type="edit"
                            onClick={() => handleEditMini(mini)}
                            className="me-2"
                          />
                          <TableButton
                            type="delete"
                            onClick={() => handleDeleteMini(mini.id)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Pagination control */}
              <div className="d-flex justify-content-center py-3">
                <Pagination className="mb-0">
                  <Pagination.First
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="border"
                  />
                  <Pagination.Prev
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="border"
                  />
                  
                  {renderPaginationItems().map(item => 
                    React.cloneElement(item, {
                      className: `border ${item.props.active ? 'active' : ''}`
                    })
                  )}
                  
                  <Pagination.Next
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="border"
                  />
                  <Pagination.Last
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="border"
                  />
                </Pagination>
              </div>
            </>
          ) : (
            <>
              <MiniCardGrid
                minis={currentMinis}
                onEdit={handleEditMini}
                onDelete={handleDeleteMini}
                onImageClick={handleImageClick}
                darkMode={darkMode}
              />
            </>
          )}
        </Card.Body>
      </Card>

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
        baseSizes={baseSizes}
      />

      {/* Edit Mini Modal */}
      {editingMini && (
        <MiniOverviewEdit 
          show={showEditModal}
          handleClose={() => {
            setShowEditModal(false)
            setEditingMini(null)
          }}
          categories={categories}
          types={types}
          tags={tags}
          productSets={productSets}
          mini={editingMini}
          setMinis={handleMiniUpdate}  // Replace setMinis with handleMiniUpdate
          minis={minis}
          baseSizes={baseSizes}
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

      {/* Mini Viewer Modal */}
      <MiniViewer
        show={showViewer}
        onHide={() => {
          setShowViewer(false)
          setSelectedMini(null)
        }}
        mini={selectedMini}
        darkMode={darkMode}
      />
    </Container>
  )
}

export default MiniOverview 