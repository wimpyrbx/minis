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

const styles = {
  fontSize: '0.75rem'  // Even smaller, equivalent to 12px
}

const MiniOverview = () => {
  // 1. Context hooks
  const { darkMode } = useTheme()
  
  // 2. State hooks - data
  const [minis, setMinis] = useState([])
  const [categories, setCategories] = useState([])
  const [types, setTypes] = useState([])
  const [tags, setTags] = useState([])
  const [productSets, setProductSets] = useState([])
  const [baseSizes, setBaseSizes] = useState([])
  
  // 3. State hooks - UI
  const [viewType, setViewType] = useState('table')
  const [currentPage, setCurrentPage] = useState(1)
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 4. State hooks - modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMini, setEditingMini] = useState(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [showViewer, setShowViewer] = useState(false)
  const [selectedMini, setSelectedMini] = useState(null)
  const [showProductSetInfo, setShowProductSetInfo] = useState(null)

  // 5. State hooks - expanded rows
  const [expandedTagRows, setExpandedTagRows] = useState(new Set())
  const [expandedCategoryRows, setExpandedCategoryRows] = useState(new Set())
  const [expandedTypeRows, setExpandedTypeRows] = useState(new Set())

  // 6. Effect hooks
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
    setMinis(prevMinis => {
      if (!Array.isArray(prevMinis)) return [updatedMini]
      return prevMinis.map(m => m.id === updatedMini.id ? updatedMini : m)
    })
  }

  // Add pagination handler
  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  // Update the handleAddMini function to process the new mini data
  const handleAddMini = (newMini) => {
    // Process the new mini to match the format of existing minis
    const processedMini = {
      ...newMini,
      image_path: newMini.image_path ? `${newMini.image_path}?t=${Date.now()}` : null,
      original_image_path: newMini.original_image_path ? `${newMini.original_image_path}?t=${Date.now()}` : null,
      category_names: newMini.category_names || '',
      type_names: newMini.type_names || '',
      proxy_type_names: newMini.proxy_type_names || '',
      tag_names: newMini.tag_names || '',
      product_set_name: newMini.product_set_name || '-',
      product_line_name: newMini.product_line_name || '-',
      manufacturer_name: newMini.manufacturer_name || '-',
      base_size_name: newMini.base_size_name || 'N/A',
      location: newMini.location || 'N/A'
    }

    setMinis(prevMinis => [processedMini, ...prevMinis])
  }

  return (
    <Container fluid className="content" style={styles}>
      <PageHeader
        icon={faPhotoFilm}
        iconColor="text-info"
        title="Mini Overview"
        subtitle="View and manage your miniature collection"
      >
        <div className="d-flex align-items-center gap-3 ms-auto">
          <div className="btn-group">
            <Button 
              variant={viewType === 'table' ? 'primary' : 'light'} 
              className="border d-flex align-items-center" 
              onClick={() => setViewType('table')}
              size="sm"
            >
              <FontAwesomeIcon icon={faList} />
            </Button>
            <Button 
              variant={viewType === 'grid' ? 'primary' : 'light'} 
              className="border d-flex align-items-center" 
              onClick={() => setViewType('grid')}
              size="sm"
            >
              <FontAwesomeIcon icon={faTableCells} />
            </Button>
          </div>

          <AddButton
            onClick={() => setShowAddModal(true)}
            type="button"
          />
        </div>
      </PageHeader>

      {viewType === 'table' && (
        <div className="d-flex justify-content-end mb-2">
          <div className="d-flex align-items-center">
            <span className="text-muted me-2" style={{ fontSize: '0.875rem' }}>Show</span>
            <Form.Select 
              size="sm" 
              value={entriesPerPage} 
              onChange={handleEntriesPerPageChange}
              style={{ 
                width: '70px',
                fontSize: '0.875rem',
                padding: '0.25rem 0.5rem',
                height: 'auto'
              }}
              className="me-2"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </Form.Select>
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>entries</span>
          </div>
        </div>
      )}

      <Card className="mb-4">
        <Card.Body className="p-0">
          {viewType === 'table' ? (
            <>
              <Table hover responsive className="custom-table mb-2">
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
                      <td className="align-middle">
                        <span 
                          className="fw-bold"
                          style={{ cursor: 'pointer' }}
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
                      <td className="align-middle">
                        {mini.base_size_name ? 
                          mini.base_size_name.charAt(0).toUpperCase() + mini.base_size_name.slice(1) 
                          : 'N/A'}
                      </td>
                      <td className="align-middle">
                        {mini.location || 'N/A'}
                      </td>
                      <td className="align-middle text-center">
                        {mini.quantity}
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

              <div className="d-flex justify-content-center mb-1 pt-1">
                <PaginationControl
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          ) : (
            <MiniCardGrid
              minis={currentMinis}
              onEdit={handleEditMini}
              onDelete={handleDeleteMini}
              onImageClick={handleImageClick}
              darkMode={darkMode}
            />
          )}
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
