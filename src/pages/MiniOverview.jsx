import React, { useState, useEffect, useRef } from 'react'
import { Container, Table, Form, Button, Card, Modal, Row, Col } from 'react-bootstrap'
import { faPhotoFilm, faPlus, faImage, faPencil, faTrash, faLayerGroup, faCube, faExchangeAlt, faTags, faBox, faList, faTableCells } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { api } from '../database/db'
import SearchableSelect from '../components/SearchableSelect'
import TagInput from '../components/TagInput'
import { useTheme } from '../context/ThemeContext'
import ImageModal from '../components/ImageModal'
import '../styles/ImageModal.css'
import TableButton from '../components/TableButton'
import MiniCardGrid from '../components/MiniCards/MiniCardGrid'

const MiniOverview = () => {
  const { darkMode } = useTheme()
  const [showAddModal, setShowAddModal] = useState(false)
  const [categories, setCategories] = useState([])
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [existingTags, setExistingTags] = useState([])
  const [productSets, setProductSets] = useState([])
  const [minis, setMinis] = useState([])

  // Form state for new mini
  const [newMini, setNewMini] = useState({
    name: '',
    description: '',
    location: '',
    image_path: '',
    quantity: 1,
    categories: [], // Array of category IDs
    types: [], // Array of type IDs
    proxy_types: [], // Array of type IDs for proxy uses
    tags: [], // Array of tag names (will be created if they don't exist)
    product_sets: [], // Ensure this is initialized as an array
    painted_by: 'prepainted' // Add this line for default value
  })

  // Search and filter states
  const [categorySearch, setCategorySearch] = useState('')
  const [typeSearch, setTypeSearch] = useState('')
  const [proxyTypeSearch, setProxyTypeSearch] = useState('')
  const [filteredCategories, setFilteredCategories] = useState([])
  const [filteredTypes, setFilteredTypes] = useState([])
  const [filteredProxyTypes, setFilteredProxyTypes] = useState([])
  const [productSetSearch, setProductSetSearch] = useState('')
  const [filteredProductSets, setFilteredProductSets] = useState([])
  
  // Selected items states
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedTypes, setSelectedTypes] = useState([])
  const [selectedProxyTypes, setSelectedProxyTypes] = useState([])

  // Add new state for validation
  const [validationErrors, setValidationErrors] = useState({
    name: false,
    location: false,
    categories: false,
    types: false
  })

  // Add new state for edit modal
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMini, setEditingMini] = useState(null)

  // Add state for image modal
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  // Add state for original mini data
  const [originalMini, setOriginalMini] = useState(null)

  // Add these new states near the top with other states
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Add new state for view type
  const [viewType, setViewType] = useState('table')

  // **New: Selected states for Edit Modal**
  const [selectedCategoriesEdit, setSelectedCategoriesEdit] = useState([])
  const [selectedTypesEdit, setSelectedTypesEdit] = useState([])
  const [selectedProxyTypesEdit, setSelectedProxyTypesEdit] = useState([])
  const [selectedTagsEdit, setSelectedTagsEdit] = useState([])
  const [selectedProductSetsEdit, setSelectedProductSetsEdit] = useState([])

  // Add useEffect to load view type preference
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api.get('/api/settings')
        if (response.data.collection_viewtype) {
          setViewType(response.data.collection_viewtype)
        }
        if (response.data.collection_show_entries_per_page) {
          setEntriesPerPage(parseInt(response.data.collection_show_entries_per_page))
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
    loadSettings()
  }, [])

  // Add this function to handle entries per page change
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

  // Add this before the table to calculate paginated data
  const paginatedMinis = minis.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  )

  const fetchMinis = async () => {
    try {
      const response = await api.get('/api/minis')
      const timestamp = Date.now()
      const minisWithCacheBusting = response.data.map(mini => ({
        ...mini,
        image_path: mini.image_path ? `${mini.image_path}?t=${timestamp}` : null,
        original_image_path: mini.original_image_path ? `${mini.original_image_path}?t=${timestamp}` : null
      }))
      setMinis(minisWithCacheBusting)
    } catch (err) {
      console.error('Error fetching minis:', err)
      setError(err.message)
    }
  }

  useEffect(() => {
    fetchData()
    fetchMinis()
  }, [])

  const fetchData = async () => {
    try {
      const [categoriesRes, typesRes, tagsRes, productSetsRes] = await Promise.all([
        api.get('/api/categories'),
        api.get('/api/types'),
        api.get('/api/tags'),
        api.get('/api/product-sets')
      ])
      setCategories(categoriesRes.data)
      setTypes(typesRes.data)
      setExistingTags(tagsRes.data.map(tag => tag.name))
      setProductSets(productSetsRes.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMini = async (e) => {
    e.preventDefault()
    
    // Reset previous validation errors
    setError(null)
    
    // Check all validations
    const newValidationErrors = {
      name: !newMini.name.trim(),
      location: !newMini.location.trim(),
      categories: newMini.categories.length === 0,
      types: newMini.types.length === 0
    }
    
    setValidationErrors(newValidationErrors)
    
    // If any validation fails, stop here
    if (Object.values(newValidationErrors).some(Boolean)) {
      return
    }
    
    try {
      const miniToSave = {
        ...newMini,
        name: newMini.name.trim(),
        location: newMini.location.trim(),
        description: newMini.description.trim(),
      }
      
      console.log('Attempting to save mini with data:', JSON.stringify(miniToSave, null, 2))
      
      const response = await api.post('/api/minis', miniToSave)
      console.log('Server response:', response)
      
      setShowAddModal(false)
      setNewMini({
        name: '',
        description: '',
        location: '',
        image_path: '',
        quantity: 1,
        categories: [],
        types: [],
        proxy_types: [],
        tags: [],
        product_sets: [],
        painted_by: 'prepainted' // Reset to default value
      })
      // Reset validation errors
      setValidationErrors({
        name: false,
        location: false,
        categories: false,
        types: false
      })
      fetchMinis()
    } catch (err) {
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        fullError: err
      })
      setError(err.response?.data?.error || err.message)
    }
  }

  // Filter and format types based on selected categories
  const getFilteredTypes = () => {
    if (selectedCategories.length === 0) return types

    return types
      .filter(type => selectedCategories.includes(type.category_id.toString()))
      .sort((a, b) => {
        // First sort by category name
        const catCompare = a.category_name.localeCompare(b.category_name)
        // If same category, sort by type name
        if (catCompare === 0) {
          return a.name.localeCompare(b.name)
        }
        return catCompare
      })
  }

  // Update the handleMultiSelect function
  const handleMultiSelect = (e, field) => {
    const options = [...e.target.selectedOptions]
    const values = options.map(option => option.value)
    
    if (field === 'categories') {
      setSelectedCategories(values)
      // Clear type selection if selected category is removed
      const newTypes = newMini.types.filter(typeId => {
        const type = types.find(t => t.id.toString() === typeId)
        return type && values.includes(type.category_id.toString())
      })
      setNewMini(prev => ({ 
        ...prev, 
        categories: values,
        types: newTypes,
        // Clear proxy types if no types remain
        proxy_types: newTypes.length === 0 ? [] : prev.proxy_types
      }))
    } else if (field === 'types') {
      setNewMini(prev => ({ 
        ...prev, 
        types: values,
        // Clear proxy types if no types remain
        proxy_types: values.length === 0 ? [] : prev.proxy_types
      }))
    } else {
      setNewMini(prev => ({ ...prev, [field]: values }))
    }
  }

  const handleTagInput = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
    setNewMini({ ...newMini, tags })
  }

  // Update the handleProxyTypeSearch function
  const handleProxyTypeSearch = (value) => {
    setProxyTypeSearch(value)
    if (value.trim()) {
      const filtered = types
        .filter(type => {
          // Exclude types that are already selected as regular types
          const isRegularType = newMini.types.includes(type.id.toString())
          // Exclude types that are already selected as proxy types
          const isProxyType = newMini.proxy_types.includes(type.id.toString())
          
          return !isRegularType && !isProxyType && 
            `${type.category_name}: ${type.name}`.toLowerCase()
              .includes(value.toLowerCase())
        })
        .slice(0, 5) // Limit to 5 suggestions
      setFilteredProxyTypes(filtered)
    } else {
      setFilteredProxyTypes([])
    }
  }

  // Also update the handleAddType function to remove the type from proxy types if it exists
  const handleAddType = (type) => {
    if (!newMini.types.includes(type.id.toString())) {
      // If this is the first type being added, clear proxy types
      const shouldClearProxyTypes = newMini.types.length === 0
      
      setNewMini({
        ...newMini,
        types: [...newMini.types, type.id.toString()],
        // Clear proxy types if this is the first type
        proxy_types: shouldClearProxyTypes ? [] : newMini.proxy_types
      })
      setSelectedTypes([...selectedTypes, type])
      // Clear selected proxy types if this is the first type
      if (shouldClearProxyTypes) {
        setSelectedProxyTypes([])
      }
    }
    setTypeSearch('')
    setFilteredTypes([])
  }

  // And update handleAddProxyType to check if the type is already a regular type
  const handleAddProxyType = (type) => {
    if (!newMini.proxy_types.includes(type.id.toString()) && 
        !newMini.types.includes(type.id.toString())) {
      setNewMini({
        ...newMini,
        proxy_types: [...newMini.proxy_types, type.id.toString()]
      })
      setSelectedProxyTypes([...selectedProxyTypes, type])
    }
    setProxyTypeSearch('')
    setFilteredProxyTypes([])
  }

  // Add this function to remove a proxy type
  const handleRemoveProxyType = (typeId) => {
    console.log('=== REMOVING PROXY TYPE ===')
    console.log('Before removal:', {
      types: newMini.types.length,
      proxyTypes: newMini.proxy_types.length
    })

    const updatedMini = {
      ...newMini,
      proxy_types: newMini.proxy_types.filter(id => id !== typeId.toString())
    }

    console.log('After removal:', {
      types: updatedMini.types.length,
      proxyTypes: updatedMini.proxy_types.length
    })

    setNewMini(updatedMini)
    setSelectedProxyTypes(prev => 
      prev.filter(type => type.id.toString() !== typeId.toString())
    )
  }

  // Add these handlers
  const handleCategorySearch = (value) => {
    setCategorySearch(value)
    if (value.trim()) {
      const filtered = categories
        .filter(cat => 
          cat.name.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 5)
      setFilteredCategories(filtered)
    } else {
      setFilteredCategories([])
    }
  }

  const handleTypeSearch = (value) => {
    setTypeSearch(value)
    if (value.trim()) {
      const filtered = types
        .filter(type => {
          // Only show types from selected categories
          if (newMini.categories.length > 0) {
            return newMini.categories.includes(type.category_id.toString()) &&
              `${type.category_name}: ${type.name}`.toLowerCase()
                .includes(value.toLowerCase())
          }
          return `${type.category_name}: ${type.name}`.toLowerCase()
            .includes(value.toLowerCase())
        })
        .slice(0, 5)
      setFilteredTypes(filtered)
    } else {
      setFilteredTypes([])
    }
  }

  const handleAddCategory = (category) => {
    if (!newMini.categories.includes(category.id.toString())) {
      const updatedMini = {
        ...newMini,
        categories: [...newMini.categories, category.id.toString()],
        types: []
      }

      // Run cleanup after the update
      setNewMini(cleanupDependencies(updatedMini))
      
      setSelectedCategories([...selectedCategories, category])
      setSelectedTypes([])
    }
    setCategorySearch('')
    setFilteredCategories([])
  }

  const handleRemoveCategory = (categoryId) => {
    console.log('=== REMOVING CATEGORY ===', categoryId)
    console.log('Before removal:', {
      categories: newMini.categories.length,
      types: newMini.types.length,
      proxyTypes: newMini.proxy_types.length
    })

    setNewMini(prev => {
      // Remove the category
      const updatedCategories = prev.categories.filter(id => id !== categoryId.toString())
      
      // Remove types belonging to the removed category
      const updatedTypes = prev.types.filter(typeId => {
        const type = types.find(t => t.id.toString() === typeId)
        return type && type.category_id.toString() !== categoryId.toString()
      })

      console.log('After filtering categories and types:', {
        categories: updatedCategories.length,
        types: updatedTypes.length,
        proxyTypesBefore: prev.proxy_types.length
      })

      // **ONLY** clear proxy_types if no types remain
      let updatedProxyTypes = prev.proxy_types
      if (updatedTypes.length === 0) {
        updatedProxyTypes = []
        console.log('Clearing all proxy types as no types remain.')
      }

      console.log('Final proxy types after removal:', updatedProxyTypes.length)

      return {
        ...prev,
        categories: updatedCategories,
        types: updatedTypes,
        proxy_types: updatedProxyTypes
      }
    })

    setSelectedCategories(prev => 
      prev.filter(cat => cat.id !== categoryId)
    )

    console.log('handleRemoveCategory completed.')
  }

  const handleRemoveType = (typeId) => {
    console.log('=== REMOVING TYPE ===')
    console.log('Before removal:', {
      types: newMini.types.length,
      proxyTypes: newMini.proxy_types.length
    })

    const updatedTypes = newMini.types.filter(id => id !== typeId.toString())

    const updatedMini = {
      ...newMini,
      types: updatedTypes,
      // **ONLY** clear proxy types if no types remain
      proxy_types: updatedTypes.length === 0 ? [] : newMini.proxy_types
    }

    console.log('After removal:', {
      types: updatedMini.types.length,
      proxyTypes: updatedMini.proxy_types.length
    })

    setNewMini(updatedMini)
    
    setSelectedTypes(prev => 
      prev.filter(type => type.id.toString() !== typeId.toString())
    )

    if (updatedTypes.length === 0) {
      console.log('No types remain - clearing proxy types')
      setSelectedProxyTypes([])
    }
  }

  // Add this function to handle image compression
  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          
          // Max dimensions
          const MAX_WIDTH = 1200
          const MAX_HEIGHT = 1200
          
          // Calculate new dimensions
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }
          
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert to WebP with reduced quality
          const compressedImage = canvas.toDataURL('image/webp', 0.8)
          resolve(compressedImage)
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  // Update the image handling in both add and edit modals
  const handleImageUpload = async (file) => {
    if (!file) return
    
    try {
      const compressedImage = await compressImage(file)
      if (showAddModal) {
        setNewMini({
          ...newMini,
          image_path: compressedImage
        })
      } else if (showEditModal) {
        setEditingMini({
          ...editingMini,
          image_path: compressedImage
        })
      }
    } catch (error) {
      console.error('Error compressing image:', error)
      setError('Error processing image. Please try again.')
    }
  }

  const handleProductSetSearch = (value) => {
    setProductSetSearch(value)
    if (value.trim()) {
      const filtered = productSets
        .filter(set => 
          `${set.manufacturer_name}: ${set.product_line_name}: ${set.name}`.toLowerCase()
            .includes(value.toLowerCase())
        )
        .slice(0, 5) // Limit to 5 suggestions
      setFilteredProductSets(filtered)
    } else {
      setFilteredProductSets([])
    }
  }

  const handleAddProductSet = (productSet) => {
    if (newMini.product_sets.length === 0) {
      setNewMini({
        ...newMini,
        product_sets: [productSet.id.toString()]
      })
    }
    setProductSetSearch('')
    setFilteredProductSets([])
  }

  const handleRemoveProductSet = (setId) => {
    setNewMini({
      ...newMini,
      product_sets: newMini.product_sets.filter(id => id !== setId.toString())
    })
  }

  const handleDeleteMini = async (id) => {
    if (window.confirm('Are you sure you want to delete this mini?')) {
      try {
        await api.delete(`/api/minis/${id}`)
        fetchMinis()
      } catch (err) {
        console.error('Error deleting mini:', err)
        setError(err.response?.data?.error || err.message)
      }
    }
  }

  // **Updated: handleEditMini Function**
  const handleEditMini = (mini) => {
    // Store the original mini data for comparison
    setOriginalMini(mini)
    
    // Set the editing mini with all its properties
    setEditingMini({
      ...mini,
      // Ensure all properties are present and correctly typed
      categories: mini.categories || [],
      types: mini.types || [],
      proxy_types: mini.proxy_types || [],
      tags: mini.tags || [],
      product_sets: mini.product_sets || [],
      painted_by: mini.painted_by || 'prepainted',
      quantity: mini.quantity || 1,
      description: mini.description || ''
    })

    // **Initialize selected states for the edit form**
    setSelectedCategoriesEdit(
      categories.filter(cat => mini.categories?.includes(cat.id.toString()))
    )
    setSelectedTypesEdit(
      types.filter(type => mini.types?.includes(type.id.toString()))
    )
    setSelectedProxyTypesEdit(
      types.filter(type => mini.proxy_types?.includes(type.id.toString()))
    )
    setSelectedTagsEdit(mini.tags || [])
    setSelectedProductSetsEdit(mini.product_sets || [])

    // Reset validation errors
    setValidationErrors({
      name: false,
      location: false,
      categories: false,
      types: false
    })

    setShowEditModal(true)
  }

  // **New: useEffect to Sync editingMini with Selected States**
  useEffect(() => {
    if (editingMini) {
      setSelectedCategoriesEdit(
        categories.filter(cat => editingMini.categories?.includes(cat.id.toString()))
      )
      setSelectedTypesEdit(
        types.filter(type => editingMini.types?.includes(type.id.toString()))
      )
      setSelectedProxyTypesEdit(
        types.filter(type => editingMini.proxy_types?.includes(type.id.toString()))
      )
      setSelectedTagsEdit(editingMini.tags || [])
      setSelectedProductSetsEdit(editingMini.product_sets || [])
    }
  }, [editingMini, categories, types])

  // **Updated: handleRemoveCategoryEdit Function**
  const handleRemoveCategoryEdit = (categoryId) => {
    setSelectedCategoriesEdit(prev => 
      prev.filter(cat => cat.id !== categoryId)
    )
    setEditingMini(prev => ({
      ...prev,
      categories: prev.categories.filter(id => id !== categoryId.toString()),
      // Clear types that belong to the removed category
      types: prev.types.filter(typeId => {
        const type = types.find(t => t.id.toString() === typeId)
        return type && type.category_id.toString() !== categoryId.toString()
      }),
      // Clear proxy types if no types remain
      proxy_types: prev.types.length === 0 ? [] : prev.proxy_types
    }))
  }

  // **Updated: handleRemoveTypeEdit Function**
  const handleRemoveTypeEdit = (typeId) => {
    setSelectedTypesEdit(prev => 
      prev.filter(type => type.id !== typeId)
    )
    setEditingMini(prev => {
      const updatedTypes = prev.types.filter(id => id !== typeId.toString())
      return {
        ...prev,
        types: updatedTypes,
        // Clear proxy types if no types remain
        proxy_types: updatedTypes.length === 0 ? [] : prev.proxy_types
      }
    })
    
    if (selectedTypesEdit.length <= 1) { // Will be 0 after removal
      setSelectedProxyTypesEdit([])
    }
  }

  // **Updated: handleRemoveProxyTypeEdit Function**
  const handleRemoveProxyTypeEdit = (typeId) => {
    setSelectedProxyTypesEdit(prev => 
      prev.filter(type => type.id !== typeId)
    )
    setEditingMini(prev => ({
      ...prev,
      proxy_types: prev.proxy_types.filter(id => id !== typeId.toString())
    }))
  }

  // **Updated: handleRemoveProductSetEdit Function**
  const handleRemoveProductSetEdit = (setId) => {
    setSelectedProductSetsEdit(prev => 
      prev.filter(set => set.id !== setId)
    )
    setEditingMini(prev => ({
      ...prev,
      product_sets: prev.product_sets.filter(id => id !== setId.toString())
    }))
  }

  // **Updated: handleUpdateMini Function**
  const handleUpdateMini = async () => {
    try {
      // Validate required fields
      const errors = {
        name: !editingMini.name.trim(),
        location: !editingMini.location.trim(),
        categories: !(selectedCategoriesEdit && selectedCategoriesEdit.length > 0),
        types: !(selectedTypesEdit && selectedTypesEdit.length > 0)
      }

      setValidationErrors(errors)

      if (Object.values(errors).some(Boolean)) {
        return
      }

      const miniToUpdate = {
        ...editingMini,
        name: editingMini.name.trim(),
        location: editingMini.location.trim(),
        categories: selectedCategoriesEdit.map(cat => cat.id.toString()),
        types: selectedTypesEdit.map(type => type.id.toString()),
        proxy_types: selectedProxyTypesEdit.map(type => type.id.toString()),
        tags: selectedTagsEdit,
        product_sets: selectedProductSetsEdit.map(set => set.id.toString()),
      }

      const response = await api.put(`/api/minis/${editingMini.id}`, miniToUpdate)
      
      // Add timestamp to image URLs to bust cache
      const updatedMini = {
        ...response.data,
        image_path: response.data.image_path ? `${response.data.image_path}?t=${Date.now()}` : null,
        original_image_path: response.data.original_image_path ? `${response.data.original_image_path}?t=${Date.now()}` : null
      }
      
      // Update the mini in the local state with cache-busting URLs
      setMinis(prevMinis => prevMinis.map(mini => 
        mini.id === editingMini.id ? updatedMini : mini
      ))

      setShowEditModal(false)
      setEditingMini(null)
      setValidationErrors({})
    } catch (error) {
      console.error('Error updating mini:', error)
      setError('Error updating mini. Please try again.')
    }
  }

  // Add handler for image click
  const handleImageClick = (mini) => {
    setSelectedImage({
      path: mini.original_image_path,
      name: mini.name
    })
    setShowImageModal(true)
  }

  // Update the isValidMini function
  const isValidMini = (mini) => {
    if (!mini) return false
    
    return (
      mini.name?.trim() &&
      mini.location?.trim() &&
      Array.isArray(mini.categories) && mini.categories.length > 0 &&
      Array.isArray(mini.types) && mini.types.length > 0
    )
  }

  // Also update the hasChanges function with similar safety checks
  const hasChanges = (current, original) => {
    if (!current || !original) return false
    
    return (
      current.name !== original.name ||
      current.location !== original.location ||
      current.description !== original.description ||
      current.quantity !== original.quantity ||
      current.image_path !== original.image_path ||
      !arraysEqual(current.categories || [], original.categories || []) ||
      !arraysEqual(current.types || [], original.types || []) ||
      !arraysEqual(current.proxy_types || [], original.proxy_types || []) ||
      !arraysEqual(current.tags || [], original.tags || []) ||
      !arraysEqual(current.product_sets || [], original.product_sets || [])
    )
  }

  // Update the arraysEqual function to handle null/undefined
  const arraysEqual = (a, b) => {
    if (!Array.isArray(a) || !Array.isArray(b)) return false
    if (a.length !== b.length) return false
    const sortedA = [...a].sort()
    const sortedB = [...b].sort()
    return sortedA.every((val, idx) => val === sortedB[idx])
  }

  // Add handler for view type change
  const handleViewTypeChange = async (type) => {
    setViewType(type)
    try {
      await api.put(`/api/settings/collection_viewtype`, {
        value: type
      })
    } catch (error) {
      console.error('Error saving view type setting:', error)
    }
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    // ... rest of your reset logic ...
  }

  // Add this cleanup function
  const cleanupDependencies = (updatedMini) => {
    // If we have no types at all, clear proxy types
    if (!updatedMini.types || updatedMini.types.length === 0) {
      updatedMini.proxy_types = []
      setSelectedProxyTypes([])
    }
    return updatedMini
  }

  if (error) return <div>Error: {error}</div>

  return (
    <Container fluid className="content">
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
                style={{ width: '65px' }}  // Made even smaller
                value={entriesPerPage}
                onChange={(e) => handleEntriesPerPageChange(e.target.value)}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </Form.Select>
              <span className="ms-2">entries</span>
            </div>
            <div className="btn-group me-4">  {/* Added margin to the right */}
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
          <Table hover responsive className="table-with-actions">
            <thead>
              <tr>
                <th style={{ width: '50px' }}></th>
                <th>Name</th>
                <th>Location</th>
                <th>Categories</th>
                <th>Types</th>
                <th>Proxy Types</th>
                <th>Product Sets</th>
                <th>Tags</th>
                <th>Quantity</th>
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
                  <td>
                    <a 
                      href={`https://www.miniscollector.com/minis/gallery?title=${encodeURIComponent(mini.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-none"
                    >
                      {mini.name}
                    </a>
                  </td>
                  <td>{mini.location}</td>
                  <td>{mini.category_names?.split(',').join(', ')}</td>
                  <td>{mini.type_names?.split(',').join(', ')}</td>
                  <td>{mini.proxy_type_names?.split(',').join(', ')}</td>
                  <td>{mini.product_set_names?.split(',').join(', ')}</td>
                  <td>{mini.tag_names?.split(',').join(', ')}</td>
                  <td>{mini.quantity}</td>
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
            minis={paginatedMinis}
            onEdit={handleEditMini}
            onDelete={handleDeleteMini}
            onImageClick={handleImageClick}
          />
        )}
      </div>

      {/* Add Mini Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton className="bg-primary bg-opacity-10">
          <Modal.Title>Add New Mini</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddMini}>
            {/* Basic Information Card */}
            <Card className="mb-3">
              <Card.Header className="bg-light d-flex align-items-center">
                <h6 className="mb-0">Basic Information</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3}>
                    <h6 className="mb-2">Image</h6>
                    <div 
                      className="image-drop-zone"
                      style={{
                        height: '76px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      onClick={() => document.getElementById('image-upload').click()}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.currentTarget.classList.add('dragging')
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault()
                        e.currentTarget.classList.remove('dragging')
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        e.currentTarget.classList.remove('dragging')
                        const file = e.dataTransfer.files[0]
                        if (file && file.type.startsWith('image/')) {
                          handleImageUpload(file)
                        }
                      }}
                    >
                      <input
                        type="file"
                        id="image-upload"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file) {
                            handleImageUpload(file)
                          }
                        }}
                      />
                      {newMini.image_path ? (
                        <img 
                          src={newMini.image_path} 
                          alt="Preview" 
                          style={{ 
                            maxHeight: '100%', 
                            maxWidth: '100%', 
                            objectFit: 'contain' 
                          }} 
                        />
                      ) : (
                        <FontAwesomeIcon 
                          icon={faImage} 
                          size="2x" 
                          className={darkMode ? 'text-light' : 'text-muted'} 
                        />
                      )}
                    </div>
                  </Col>
                  <Col md={9}>
                    <Row>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            value={newMini.name}
                            onChange={(e) => setNewMini({...newMini, name: e.target.value})}
                            required
                            isInvalid={validationErrors.name}
                          />
                          {validationErrors.name && (
                            <Form.Control.Feedback type="invalid">
                              Name is required
                            </Form.Control.Feedback>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Painted By</Form.Label>
                          <div className="d-flex gap-3">
                            <Form.Check
                              type="radio"
                              id="painted-prepainted"
                              label="Pre-painted"
                              name="paintedBy"
                              value="prepainted"
                              checked={newMini.painted_by === 'prepainted'}
                              onChange={(e) => setNewMini({...newMini, painted_by: e.target.value})}
                            />
                            <Form.Check
                              type="radio"
                              id="painted-self"
                              label="Self"
                              name="paintedBy"
                              value="self"
                              checked={newMini.painted_by === 'self'}
                              onChange={(e) => setNewMini({...newMini, painted_by: e.target.value})}
                            />
                            <Form.Check
                              type="radio"
                              id="painted-other"
                              label="Other"
                              name="paintedBy"
                              value="other"
                              checked={newMini.painted_by === 'other'}
                              onChange={(e) => setNewMini({...newMini, painted_by: e.target.value})}
                            />
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row className="mt-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Location <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            value={newMini.location}
                            onChange={(e) => setNewMini({...newMini, location: e.target.value})}
                            required
                            isInvalid={validationErrors.location}
                          />
                          {validationErrors.location && (
                            <Form.Control.Feedback type="invalid">
                              Location is required
                            </Form.Control.Feedback>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Description</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            value={newMini.description}
                            onChange={(e) => setNewMini({...newMini, description: e.target.value})}
                            style={{ minHeight: '38px' }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Combined Classification and Information Card */}
            <Card className="mb-3">
              <Card.Header className="bg-light d-flex align-items-center">
                <h6 className="mb-0">Classification & Information</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FontAwesomeIcon icon={faLayerGroup} className="me-2 text-primary" />
                        Categories <span className="text-danger">*</span>
                      </Form.Label>
                      <SearchableSelect
                        items={categories}
                        value={newMini?.categories || []}
                        onChange={(category) => {
                          if (!newMini?.categories.includes(category.id.toString())) {
                            setNewMini({
                              ...newMini,
                              categories: [...(newMini?.categories || []), category.id.toString()]
                            })
                          }
                        }}
                        placeholder="Search categories..."
                        isInvalid={validationErrors.categories}
                      />
                      <div className="mt-2">
                        {newMini?.categories?.map(catId => {
                          const category = categories.find(c => c.id.toString() === catId)
                          return category ? (
                            <span
                              key={category.id}
                              className="badge bg-primary me-1 mb-1"
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleRemoveCategory(category.id)}
                            >
                              {category.name} ×
                            </span>
                          ) : null
                        })}
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FontAwesomeIcon icon={faCube} className="me-2 text-primary" />
                        Types <span className="text-danger">*</span>
                      </Form.Label>
                      <SearchableSelect
                        items={types.filter(type => 
                          newMini?.categories?.includes(type.category_id.toString())
                        )}
                        value={newMini?.types || []}
                        onChange={(type) => {
                          if (!newMini?.types.includes(type.id.toString())) {
                            setNewMini({
                              ...newMini,
                              types: [...(newMini?.types || []), type.id.toString()]
                            })
                          }
                        }}
                        placeholder="Search types..."
                        renderOption={(type) => `${type.category_name}: ${type.name}`}
                        isInvalid={validationErrors.types}
                      />
                      <div className="mt-2">
                        {newMini?.types?.map(typeId => {
                          const type = types.find(t => t.id.toString() === typeId)
                          return type ? (
                            <span
                              key={type.id}
                              className="badge bg-primary me-1 mb-1"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                const updatedTypes = newMini.types.filter(id => id !== typeId)
                                setNewMini(prev => ({
                                  ...prev,
                                  types: updatedTypes,
                                  // Always clear proxy types if no types remain
                                  proxy_types: updatedTypes.length === 0 ? [] : prev.proxy_types
                                }))
                                setSelectedTypes(prev => 
                                  prev.filter(t => t.id !== type.id)
                                )
                                // Clear selectedProxyTypes if no types remain
                                if (updatedTypes.length === 0) {
                                  setSelectedProxyTypes([])
                                }
                              }}
                            >
                              {`${type.category_name}: ${type.name}`} ×
                            </span>
                          ) : null
                        })}
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FontAwesomeIcon icon={faExchangeAlt} className="me-2 text-primary" />
                        Proxy Types
                      </Form.Label>
                      <SearchableSelect
                        items={types.filter(type => 
                          !newMini?.types?.includes(type.id.toString())
                        )}
                        value={newMini?.proxy_types || []}
                        onChange={(type) => {
                          if (!newMini?.proxy_types?.includes(type.id.toString())) {
                            setNewMini({
                              ...newMini,
                              proxy_types: [...(newMini?.proxy_types || []), type.id.toString()]
                            })
                          }
                        }}
                        placeholder="Search proxy types..."
                        renderOption={(type) => `${type.category_name}: ${type.name}`}
                        disabled={!newMini?.types?.length}
                      />
                      <div className="mt-2">
                        {newMini?.proxy_types?.map(typeId => {
                          const type = types.find(t => t.id.toString() === typeId)
                          return type ? (
                            <span
                              key={type.id}
                              className="badge bg-primary me-1 mb-1"
                              style={{ cursor: 'pointer' }}
                              onClick={() => {
                                // Remove the proxy type
                                setNewMini(prev => ({
                                  ...prev,
                                  proxy_types: prev.proxy_types.filter(id => id !== typeId)
                                }))
                                setSelectedProxyTypes(prev => 
                                  prev.filter(t => t.id !== type.id)
                                )
                              }}
                            >
                              {`${type.category_name}: ${type.name}`} ×
                            </span>
                          ) : null
                        })}
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FontAwesomeIcon icon={faTags} className="me-2 text-primary" />
                        Tags
                      </Form.Label>
                      <TagInput
                        value={newMini.tags}
                        onChange={(tags) => setNewMini({...newMini, tags})}
                        existingTags={existingTags}
                        placeholder="Type tag and press Enter or comma to add..."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        <FontAwesomeIcon icon={faBox} className="me-2 text-primary" />
                        Product Set
                      </Form.Label>
                      <SearchableSelect
                        items={productSets}
                        value={newMini?.product_sets || []}
                        onChange={(set) => {
                          setNewMini({
                            ...newMini,
                            product_sets: [set.id.toString()]
                          })
                        }}
                        placeholder="Search product sets..."
                        renderOption={(set) => `${set.manufacturer_name} » ${set.product_line_name} » ${set.name}`}
                      />
                      <div className="mt-2">
                        {Array.isArray(newMini.product_sets) && newMini.product_sets.map(setId => {
                          const set = productSets?.find(s => s.id.toString() === setId);
                          return set ? (
                            <span
                              key={set.id}
                              className="badge bg-primary"
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleRemoveProductSet(set.id)}
                            >
                              {`${set.manufacturer_name} » ${set.product_line_name} » ${set.name}`} ×
                            </span>
                          ) : null;
                        })}
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddMini}
            disabled={!isValidMini(newMini)}
          >
            Add Mini
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Mini Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Mini</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpdateMini}>
            {/* Basic Information Card */}
            <Card className="mb-3">
              <Card.Header className="bg-light d-flex align-items-center">
                <h6 className="mb-0">Basic Information</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3}>
                    <div 
                      className="image-drop-zone"
                      style={{
                        height: '76px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      onClick={() => document.getElementById('edit-image-upload').click()}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.currentTarget.classList.add('dragging')
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault()
                        e.currentTarget.classList.remove('dragging')
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        e.currentTarget.classList.remove('dragging')
                        const file = e.dataTransfer.files[0]
                        if (file && file.type.startsWith('image/')) {
                          handleImageUpload(file)
                        }
                      }}
                    >
                      <input
                        type="file"
                        id="edit-image-upload"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file) {
                            handleImageUpload(file)
                          }
                        }}
                      />
                      {editingMini?.image_path ? (
                        <img 
                          src={editingMini.image_path} 
                          alt="Preview" 
                          style={{ 
                            maxHeight: '100%', 
                            maxWidth: '100%', 
                            objectFit: 'contain' 
                          }} 
                        />
                      ) : (
                        <FontAwesomeIcon 
                          icon={faImage} 
                          size="2x" 
                          className={darkMode ? 'text-light' : 'text-muted'} 
                        />
                      )}
                    </div>
                  </Col>
                  <Col md={9}>
                    <Row>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            value={editingMini?.name || ''}
                            onChange={(e) => setEditingMini({...editingMini, name: e.target.value})}
                            required
                            isInvalid={validationErrors.name}
                          />
                          {validationErrors.name && (
                            <Form.Control.Feedback type="invalid">
                              Name is required
                            </Form.Control.Feedback>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Painted By</Form.Label>
                          <div className="d-flex gap-3">
                            <Form.Check
                              type="radio"
                              id="painted-prepainted-edit"
                              label="Pre-painted"
                              name="paintedByEdit"
                              value="prepainted"
                              checked={editingMini?.painted_by === 'prepainted'}
                              onChange={(e) => setEditingMini({...editingMini, painted_by: e.target.value})}
                            />
                            <Form.Check
                              type="radio"
                              id="painted-self-edit"
                              label="Self"
                              name="paintedByEdit"
                              value="self"
                              checked={editingMini?.painted_by === 'self'}
                              onChange={(e) => setEditingMini({...editingMini, painted_by: e.target.value})}
                            />
                            <Form.Check
                              type="radio"
                              id="painted-other-edit"
                              label="Other"
                              name="paintedByEdit"
                              value="other"
                              checked={editingMini?.painted_by === 'other'}
                              onChange={(e) => setEditingMini({...editingMini, painted_by: e.target.value})}
                            />
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row className="mt-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Location <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            value={editingMini?.location || ''}
                            onChange={(e) => setEditingMini({...editingMini, location: e.target.value})}
                            required
                            isInvalid={validationErrors.location}
                          />
                          {validationErrors.location && (
                            <Form.Control.Feedback type="invalid">
                              Location is required
                            </Form.Control.Feedback>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Description</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            value={editingMini?.description || ''}
                            onChange={(e) => setEditingMini({...editingMini, description: e.target.value})}
                            style={{ minHeight: '38px' }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Col>
                </Row>

                <Form.Group>
                  <Form.Label>Quantity: {editingMini?.quantity}</Form.Label>
                  <Form.Range
                    min={1}
                    max={100}
                    value={editingMini?.quantity || 1}
                    onChange={(e) => setEditingMini({...editingMini, quantity: parseInt(e.target.value)})}
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Classification Card */}
            <Card className="mb-3">
              <Card.Header className="bg-light d-flex align-items-center">
                <h6 className="mb-0">Classification</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Categories <span className="text-danger">*</span></Form.Label>
                      <SearchableSelect
                        items={categories}
                        value={selectedCategoriesEdit}
                        onChange={(category) => {
                          if (!selectedCategoriesEdit.includes(category.id.toString())) {
                            setSelectedCategoriesEdit([...selectedCategoriesEdit, category.id.toString()])
                          }
                        }}
                        placeholder="Search categories..."
                        isInvalid={validationErrors.categories}
                      />
                      <div className="mt-2">
                        {selectedCategoriesEdit.map(catId => {
                          const category = categories.find(c => c.id.toString() === catId)
                          return category ? (
                            <span
                              key={category.id}
                              className="badge bg-primary me-1 mb-1"
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleRemoveCategoryEdit(category.id)}
                            >
                              {category.name} ×
                            </span>
                          ) : null
                        })}
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Types <span className="text-danger">*</span></Form.Label>
                      <SearchableSelect
                        items={types.filter(type => 
                          selectedCategoriesEdit.includes(type.category_id.toString())
                        )}
                        value={selectedTypesEdit}
                        onChange={(type) => {
                          if (!selectedTypesEdit.includes(type.id.toString())) {
                            setSelectedTypesEdit([...selectedTypesEdit, type.id.toString()])
                          }
                        }}
                        placeholder="Search types..."
                        renderOption={(type) => `${type.category_name}: ${type.name}`}
                        isInvalid={validationErrors.types}
                      />
                      <div className="mt-2">
                        {selectedTypesEdit.map(typeId => {
                          const type = types.find(t => t.id.toString() === typeId)
                          return type ? (
                            <span
                              key={type.id}
                              className="badge bg-primary me-1 mb-1"
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleRemoveTypeEdit(type.id)}
                            >
                              {`${type.category_name}: ${type.name}`} ×
                            </span>
                          ) : null
                        })}
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Proxy Types</Form.Label>
                      <SearchableSelect
                        items={types.filter(type => 
                          !selectedTypesEdit.includes(type.id.toString())
                        )}
                        value={selectedProxyTypesEdit}
                        onChange={(type) => {
                          if (!selectedProxyTypesEdit.includes(type.id.toString())) {
                            setSelectedProxyTypesEdit([...selectedProxyTypesEdit, type.id.toString()])
                          }
                        }}
                        placeholder="Search proxy types..."
                        renderOption={(type) => `${type.category_name}: ${type.name}`}
                        disabled={!selectedTypesEdit.length}
                      />
                      <div className="mt-2">
                        {selectedProxyTypesEdit.map(typeId => {
                          const type = types.find(t => t.id.toString() === typeId)
                          return type ? (
                            <span
                              key={type.id}
                              className="badge bg-primary me-1 mb-1"
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleRemoveProxyTypeEdit(type.id)}
                            >
                              {`${type.category_name}: ${type.name}`} ×
                            </span>
                          ) : null
                        })}
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Tags and Product Information Card */}
            <Card className="mb-3">
              <Card.Header className="bg-light d-flex align-items-center">
                <h6 className="mb-0">Tags and Product Information</h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tags</Form.Label>
                      <TagInput
                        value={selectedTagsEdit}
                        onChange={(tags) => setSelectedTagsEdit(tags)}
                        existingTags={existingTags}
                        placeholder="Type tag and press Enter or comma to add..."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Product Set</Form.Label>
                      <SearchableSelect
                        items={productSets}
                        value={selectedProductSetsEdit}
                        onChange={(set) => {
                          if (!selectedProductSetsEdit.includes(set.id.toString())) {
                            setSelectedProductSetsEdit([set.id.toString()])
                          }
                        }}
                        placeholder="Search product sets..."
                        renderOption={(set) => `${set.manufacturer_name} » ${set.product_line_name} » ${set.name}`}
                      />
                      <div className="mt-2">
                        {selectedProductSetsEdit.map(setId => {
                          const set = productSets.find(s => s.id.toString() === setId)
                          return set ? (
                            <span
                              key={set.id}
                              className="badge bg-primary me-1 mb-1"
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleRemoveProductSetEdit(set.id)}
                            >
                              {`${set.manufacturer_name} » ${set.product_line_name} » ${set.name}`} ×
                            </span>
                          ) : null
                        })}
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleUpdateMini}
            disabled={!isValidMini(editingMini) || !hasChanges(editingMini, originalMini)}
          >
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add ImageModal */}
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