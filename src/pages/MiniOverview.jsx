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

const styles = {
  fontSize: '0.75rem'  // Even smaller, equivalent to 12px
}

const MiniOverview = () => {
  const { darkMode } = useTheme()
  
  // Add all state variables
  const [minis, setMinis] = useState([])
  const [categories, setCategories] = useState([])
  const [types, setTypes] = useState([])
  const [tags, setTags] = useState([])
  const [productSets, setProductSets] = useState([])
  const [baseSizes, setBaseSizes] = useState([])
  
  const [viewType, setViewType] = useState('table')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMini, setEditingMini] = useState(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [showViewer, setShowViewer] = useState(false)
  const [selectedMini, setSelectedMini] = useState(null)
  const [showProductSetInfo, setShowProductSetInfo] = useState(null)
  
  // Add pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  
  // Add loading and error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all required data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          minisRes,
          categoriesRes,
          typesRes,
          tagsRes,
          productSetsRes,
          baseSizesRes
        ] = await Promise.all([
          api.get('/api/minis'),
          api.get('/api/categories'),
          api.get('/api/types'),
          api.get('/api/tags'),
          api.get('/api/product-sets'),
          api.get('/api/base-sizes')
        ])

        setMinis(minisRes.data)
        setCategories(categoriesRes.data)
        setTypes(typesRes.data)
        setTags(tagsRes.data)
        setProductSets(productSetsRes.data)
        setBaseSizes(baseSizesRes.data)
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }
    fetchData()
  }, [])
  
  // Calculate total pages
  const totalPages = Math.ceil(minis.length / entriesPerPage)

  // Add pagination handler
  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  // Get current minis for the page
  const indexOfLastMini = currentPage * entriesPerPage
  const indexOfFirstMini = indexOfLastMini - entriesPerPage
  const currentMinis = minis.slice(indexOfFirstMini, indexOfLastMini)

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

  if (loading) return <div>Loading...</div>
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
              onClick={() => setViewType('table')}
            >
              <FontAwesomeIcon icon={faList} />
            </Button>
            <Button 
              variant={viewType === 'grid' ? 'primary' : 'light'} 
              className="border d-flex align-items-center" 
              onClick={() => setViewType('grid')}
            >
              <FontAwesomeIcon icon={faTableCells} />
            </Button>
          </div>
        </div>
      </PageHeader>

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
                        {mini.category_names?.split(',').map((category, idx) => (
                          <Pill
                            key={idx}
                            text={category.trim()}
                            variant="category"
                          />
                        ))}
                      </td>
                      <td className="align-middle">
                        {mini.type_names?.split(',').map((type, idx) => (
                          <Pill
                            key={idx}
                            text={type.trim()}
                            variant="type"
                          />
                        ))}
                        {mini.proxy_type_names?.split(',').map((type, idx) => (
                          <Pill
                            key={idx}
                            text={type.trim()}
                            variant="proxytype"
                            isDark={true}
                          />
                        ))}
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
                      <td className="align-middle">
                        {mini.tag_names?.split(',').map((tag, idx) => (
                          <Pill
                            key={idx}
                            text={tag.trim()}
                            variant="tag"
                          />
                        ))}
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
        setMinis={setMinis}
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
