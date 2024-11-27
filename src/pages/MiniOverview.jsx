import React, { useState, useEffect } from 'react'
import { Container, Card, Button, Table, Row, Col, Form, Alert } from 'react-bootstrap'
import { faPhotoFilm, faPlus, faList, faTableCells, faCubesStacked } from '@fortawesome/free-solid-svg-icons'
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
import MouseOverInfo from '../components/MouseOverInfo/MouseOverInfo'
import Pill from '../components/Pill/Pill'
import PaginationControl from '../components/Pagination/Pagination'
import AddButton from '../components/Buttons/AddButton'
import { CSSTransition, TransitionGroup } from 'react-transition-group'

const styles = {
  fontSize: '0.75rem'  // Even smaller, equivalent to 12px
}

const MiniOverview = () => {
  const { darkMode } = useTheme()

  // State hooks
  const [minis, setMinis] = useState([])
  const [categories, setCategories] = useState([])
  const [types, setTypes] = useState([])
  const [tags, setTags] = useState([])
  const [productSets, setProductSets] = useState([])
  const [baseSizes, setBaseSizes] = useState([])
  const [paintedByOptions, setPaintedByOptions] = useState([])
  const [viewType, setViewType] = useState('table')
  const [currentPage, setCurrentPage] = useState(1)
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMini, setEditingMini] = useState(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [showViewer, setShowViewer] = useState(false)
  const [selectedMini, setSelectedMini] = useState(null)
  const [showProductSetInfo, setShowProductSetInfo] = useState(null)
  const [expandedTagRows, setExpandedTagRows] = useState(new Set())
  const [expandedCategoryRows, setExpandedCategoryRows] = useState(new Set())
  const [expandedTypeRows, setExpandedTypeRows] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')

  // Effect hooks
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [
          minisRes,
          categoriesRes,
          typesRes,
          tagsRes,
          productSetsRes,
          baseSizesRes
        ] = await Promise.all([
          api.get('/api/minis?sort=name'),
          api.get('/api/categories'),
          api.get('/api/types'),
          api.get('/api/tags'),
          api.get('/api/product-sets'),
          api.get('/api/base-sizes')
        ])

        const sortedMinis = Array.isArray(minisRes.data) 
          ? minisRes.data.sort((a, b) => a.name.localeCompare(b.name))
          : []

        setMinis(sortedMinis)
        setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : [])
        setTypes(Array.isArray(typesRes.data) ? typesRes.data : [])
        setTags(Array.isArray(tagsRes.data) ? tagsRes.data : [])
        setProductSets(Array.isArray(productSetsRes.data) ? productSetsRes.data : [])
        setBaseSizes(Array.isArray(baseSizesRes.data) ? baseSizesRes.data : [])
        setLoading(false)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err.message)
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const fetchEntriesPerPage = async () => {
      try {
        const response = await api.get('/api/settings/collection_show_entries_per_page')
        if (response.data?.value) {
          setEntriesPerPage(parseInt(response.data.value))
        }
      } catch (err) {
        console.error('Error fetching entries per page setting:', err)
      }
    }
    fetchEntriesPerPage()
  }, [])

  useEffect(() => {
    const fetchPaintedByOptions = async () => {
      try {
        const response = await api.get('/api/painted-by')
        setPaintedByOptions(response.data)
      } catch (err) {
        console.error('Error fetching painted by options:', err)
      }
    }
    fetchPaintedByOptions()
  }, [])

  // Handlers
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase())
  }

  const filteredMinis = minis.filter(mini => {
    if (!mini) return false;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Check name
    const nameMatch = mini.name?.toLowerCase().includes(searchLower);
    
    // Check categories
    const categoryMatch = mini.category_names?.toLowerCase().includes(searchLower);
    
    // Check types (both regular and proxy)
    const typeMatch = mini.type_names?.toLowerCase().includes(searchLower) || 
                     mini.proxy_type_names?.toLowerCase().includes(searchLower);
    
    // Check tags
    const tagMatch = mini.tag_names?.toLowerCase().includes(searchLower);
    
    // Check location
    const locationMatch = mini.location?.toLowerCase().includes(searchLower);

    return nameMatch || categoryMatch || typeMatch || tagMatch || locationMatch;
  });

  // Early returns for loading and error states
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  // Calculate pagination AFTER we know we have valid data
  const indexOfLastMini = currentPage * entriesPerPage
  const indexOfFirstMini = indexOfLastMini - entriesPerPage
  const currentMinis = Array.isArray(minis) ? minis.slice(indexOfFirstMini, indexOfLastMini) : []
  const totalPages = Math.ceil((Array.isArray(minis) ? minis.length : 0) / entriesPerPage)

  const handleEditMini = (mini) => {
    setEditingMini(mini)
    setShowEditModal(true)
  }

  const handleDeleteMini = async (id) => {
    if (window.confirm('Are you sure you want to delete this mini?')) {
      try {
        await api.delete(`/api/minis/${id}`)
        setMinis(prevMinis => prevMinis.filter(mini => mini.id !== id))
      } catch (err) {
        setError(err.message)
      }
    }
  }

  const handleImageClick = (mini) => {
    setSelectedImage({
      path: mini.original_image_path,
      name: mini.name
    })
    setShowImageModal(true)
  }

  const handleMiniNameClick = (mini) => {
    setSelectedMini(mini)
    setShowViewer(true)
  }

  // Add handlers for toggling expansions
  const handleTagExpand = (miniId) => {
    setExpandedTagRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(miniId)) {
        newSet.delete(miniId)
      } else {
        newSet.add(miniId)
      }
      return newSet
    })
  }

  const handleCategoryExpand = (miniId) => {
    setExpandedCategoryRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(miniId)) {
        newSet.delete(miniId)
      } else {
        newSet.add(miniId)
      }
      return newSet
    })
  }

  const handleTypeExpand = (miniId) => {
    setExpandedTypeRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(miniId)) {
        newSet.delete(miniId)
      } else {
        newSet.add(miniId)
      }
      return newSet
    })
  }

  // Add handler for entries per page change
  const handleEntriesPerPageChange = async (e) => {
    const value = parseInt(e.target.value)
    setEntriesPerPage(value)
    setCurrentPage(1)
    try {
      await api.put('/api/settings/collection_show_entries_per_page', { value: value.toString() })
    } catch (err) {
      console.error('Error saving entries per page setting:', err)
    }
  }

  // Update the handleMiniUpdate function
  const handleMiniUpdate = (updatedMini) => {
    setMinis(prevMinis => prevMinis.map(m => {
      if (m.id === updatedMini.id) {
        // Add a temporary class to trigger the animation
        const tr = document.querySelector(`tr[data-mini-id="${updatedMini.id}"]`)
        if (tr) {
          tr.classList.add('highlight-update')
          // Remove the class after animation completes
          setTimeout(() => {
            tr.classList.remove('highlight-update')
          }, 1000)
        }
        return updatedMini
      }
      return m
    }))
  }

  // Add pagination handler
  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  // Update the handleAddMini function
  const handleAddMini = async (newMiniData) => {
    try {
      // Create FormData object
      const formData = new FormData()
      
      // Validate required fields before sending
      if (!newMiniData.name?.trim()) return
      
      // Append all the fields with null checks and validation
      formData.append('name', newMiniData.name.trim())
      formData.append('description', newMiniData.description?.trim() || '')
      formData.append('location', newMiniData.location?.trim() || '')
      formData.append('quantity', newMiniData.quantity || 1)
      formData.append('base_size_id', newMiniData.base_size_id || '3')
      formData.append('categories', JSON.stringify(newMiniData.categories || []))
      formData.append('types', JSON.stringify(newMiniData.types || []))
      formData.append('proxy_types', JSON.stringify(newMiniData.proxy_types || []))
      formData.append('tags', JSON.stringify(newMiniData.tags || []))
      formData.append('product_sets', JSON.stringify(newMiniData.product_sets || []))
      formData.append('painted_by', newMiniData.painted_by || '1')

      // If there's an image, append it
      if (newMiniData.image_path && newMiniData.image_path.startsWith('data:')) {
        formData.append('image', newMiniData.image_path)
      }

      // Send data to server using FormData
      const response = await api.post('/api/minis', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      // Only update state if we get valid data back
      if (response.data && response.data.id && response.data.name) {
        setMinis(prevMinis => [response.data, ...prevMinis])
      }
    } catch (err) {
      console.error('Error adding mini:', err)
      setError(err.response?.data?.error || 'Failed to add mini.')
    }
  }

  return (
<Container fluid className="content">
      {/* Dark background wrapper */}
        {error && (
          <Alert variant="danger" className="mt-3" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        <PageHeader
          icon={faCubesStacked}
          iconColor="text-info"
          title="Mini Overview"
          subtitle="View and manage your miniature collection"
        >
          <div className="ms-auto pe-0">
            <div className="d-flex align-items-center gap-3">
              <div className="btn-group">
                <Button 
                  variant={viewType === 'table' ? 'success' : 'dark'} 
                  className="border d-flex align-items-center px-3" 
                  onClick={() => setViewType('table')}
                  size="md"
                >
                  <FontAwesomeIcon icon={faList} className="fs-6" />
                </Button>
                <Button 
                  variant={viewType === 'grid' ? 'success' : 'dark'} 
                  className="border d-flex align-items-center px-3" 
                  onClick={() => setViewType('grid')}
                  size="md"
                >
                  <FontAwesomeIcon icon={faTableCells} className="fs-6" />
                </Button>
              </div>
              <div>
                <AddButton 
                  text="Add" 
                  onClick={() => setShowAddModal(true)}
                />
              </div>
            </div>
          </div>
        </PageHeader>

        <div className="d-flex align-items-center mb-3 justify-content-end">
          {/* Search - Left aligned with me-auto */}
          <div className="d-flex align-items-center me-auto">
            <span className="me-2">Search:</span>
            <Form.Control
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
              style={{ width: '200px' }}
            />
          </div>
          
          {/* Show Entries - Right aligned */}
          <span className="me-2 text-end" style={{ width: '100px' }}>Show Entries:</span>
          <Form.Select 
            size="sm" 
            value={entriesPerPage} 
            onChange={handleEntriesPerPageChange}
            style={{ width: '77px' }}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </Form.Select>
        </div>

        <Card className="mb-4">
          <Card.Body className="p-0">
            {viewType === 'table' ? (
              // Table View
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}></th>
                      <th>Name</th>
                      <th>Categories</th>
                      <th>Types</th>
                      <th>Product Set</th>
                      <th>Tags</th>
                      <th colSpan="2">Mini Information</th>
                      <th className="actions-cell"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMinis.map((mini) => (
                      <tr 
                        key={mini.id}
                        data-mini-id={mini.id}
                      >
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
                        <td className="align-middle">
                          <span 
                          style={{ fontWeight: '100', fontSize: '0.8rem' }}
                          onClick={() => handleMiniNameClick(mini)}
                          >
                            {mini.name}
                          </span>
                        </td>
                        <td className="align-middle">
                          {mini.category_names?.split(',').map((category, idx, arr) => {
                            const isExpanded = expandedCategoryRows.has(mini.id)
                            if (!isExpanded && idx >= 3) {
                              if (idx === 3) {
                                return (
                                  <Pill
                                    key={`${mini.id}-category-more`}
                                    text={`+${arr.length - 3}`}
                                    variant="expand"
                                    onClick={() => handleCategoryExpand(mini.id)}
                                    style={{ fontSize: '0.65rem' }}
                                  />
                                )
                              }
                              return null
                            }
                            return (
                              <Pill
                                key={`${mini.id}-category-${idx}`}
                                text={category.trim()}
                                variant="category"
                              />
                            )
                          })}
                          {expandedCategoryRows.has(mini.id) && mini.category_names?.split(',').length > 3 && (
                            <Pill
                              text="Show Less"
                              variant="expand"
                              onClick={() => handleCategoryExpand(mini.id)}
                              style={{ fontSize: '0.65rem' }}
                            />
                          )}
                        </td>
                        <td className="align-middle">
                          {(() => {
                            const types = mini.type_names?.split(',') || []
                            const proxyTypes = mini.proxy_type_names?.split(',') || []
                            const allTypes = [...types, ...proxyTypes]
                            const isExpanded = expandedTypeRows.has(mini.id)

                            return (
                              <>
                                {allTypes.map((type, idx, arr) => {
                                  if (!isExpanded && idx >= 3) {
                                    if (idx === 3) {
                                      return (
                                        <Pill
                                          key={`${mini.id}-type-more`}
                                          text={`+${arr.length - 3}`}
                                          variant="expand"
                                          onClick={() => handleTypeExpand(mini.id)}
                                          style={{ fontSize: '0.65rem' }}
                                        />
                                      )
                                    }
                                    return null
                                  }

                                  const isProxyType = idx >= types.length
                                  return (
                                    <Pill
                                      key={`${mini.id}-type-${idx}`}
                                      text={type.trim()}
                                      variant={isProxyType ? "proxytype" : "type"}
                                      isDark={isProxyType}
                                    />
                                  )
                                })}
                                {expandedTypeRows.has(mini.id) && allTypes.length > 3 && (
                                  <Pill
                                    text="Show Less"
                                    variant="expand"
                                    onClick={() => handleTypeExpand(mini.id)}
                                    style={{ fontSize: '0.65rem' }}
                                  />
                                )}
                              </>
                            )
                          })()}
                        </td>
                        <td 
                          className="align-middle"
                          style={{ fontWeight: '100', fontSize: '0.8rem' }}
                          onMouseEnter={() => mini.product_set_name && mini.product_set_name !== '-' ? setShowProductSetInfo(mini.id) : null}
                          onMouseLeave={() => setShowProductSetInfo(null)}
                          ref={(el) => el && (el.dataset.miniId = mini.id)}
                        >
                          {mini.product_set_name && mini.product_set_name !== '-' ? (
                            <>
                              <span>{mini.product_set_name}</span>
                              <MouseOverInfo
                                show={showProductSetInfo === mini.id}
                                target={document.querySelector(`[data-mini-id="${mini.id}"]`)}
                                title="Product Set Information"
                                icon={faCubesStacked}
                                headerColor="success"
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
                        <td className="align-middle">
                          {mini.tag_names?.split(',').map((tag, idx, arr) => {
                            const isExpanded = expandedTagRows.has(mini.id)
                            if (!isExpanded && idx >= 3) {
                              if (idx === 3) {
                                return (
                                  <Pill
                                    key={`${mini.id}-tag-more`}
                                    text={`+${arr.length - 4}`}
                                    variant="expand"
                                    onClick={() => handleTagExpand(mini.id)}
                                    style={{ fontSize: '0.65rem' }}
                                  />
                                )
                              }
                              return null
                            }
                            return (
                              <Pill
                                key={`${mini.id}-tag-${idx}`}
                                text={tag.trim()}
                                variant="tag"
                              />
                            )
                          })}
                          {expandedTagRows.has(mini.id) && mini.tag_names?.split(',').length > 4 && (
                            <Pill
                              text="Show Less"
                              variant="expand"
                              onClick={() => handleTagExpand(mini.id)}
                              style={{ fontSize: '0.65rem' }}
                            />
                          )}
                        </td>
                        <td className="align-middle" style={{ lineHeight: '1', fontSize: '0.7rem' }}>
                          {mini.base_size_name ? 
                            <div className="text-muted">
                            <strong>Base Size: </strong>
                            <span style={{ color: 'var(--bs-green)' }}>{mini.base_size_name.charAt(0).toUpperCase() + mini.base_size_name.slice(1)}</span>
                            </div>
                            : <div className="text-muted" style={{ fontSize: '0.5rem' }}>N/A</div>
                          }
                          <div className="text-muted" style={{ lineHeight: '1' }}>
                            <strong>Painted By: </strong>
                            <span style={{ color: 'var(--bs-yellow)' }}>{mini.painted_by_name.charAt(0).toUpperCase() + mini.painted_by_name.slice(1)}</span>
                          </div>
                        </td>
                        <td className="align-middle" style={{ lineHeight: '1', fontSize: '0.7rem' }}>
                        <div className="text-muted" style={{ lineHeight: '1' }}>
                            <strong>Quantity: </strong>
                            <span style={{ color: 'var(--bs-orange)' }}>{mini.quantity}</span>
                          </div>
                          <div className="text-muted" style={{ lineHeight: '1' }}>
                            <strong>Location: </strong>
                            <span style={{ color: 'var(--bs-info)' }}>{mini.location || '-'}</span>
                          </div>
                        </td>
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
            ) : (
              // Grid View
              <MiniCardGrid 
                minis={currentMinis}
                onImageClick={handleImageClick}
                onMiniClick={handleMiniNameClick}
                onEditClick={handleEditMini}
                onDeleteClick={handleDeleteMini}
              />
            )}

            <div className="d-flex justify-content-center pt-3 pb-2">
              <PaginationControl
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </Card.Body>
        </Card>

        {/* Modals */}
        <MiniOverviewAdd 
          show={showAddModal}
          handleClose={() => setShowAddModal(false)}
          categories={categories}
          types={types}
          tags={tags}
          productSets={productSets}
          setMinis={handleAddMini}
          minis={minis}
          baseSizes={baseSizes}
        />

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
            setMinis={setMinis}
            minis={minis}
            baseSizes={baseSizes}
          />
        )}

        <ImageModal
          show={showImageModal}
          onHide={() => {
            setShowImageModal(false)
            setSelectedImage(null)
          }}
          imagePath={selectedImage?.path}
          miniName={selectedImage?.name}
        />

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
