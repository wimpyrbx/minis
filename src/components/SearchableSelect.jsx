import React, { useState, useEffect, useCallback } from 'react'
import { Form } from 'react-bootstrap'

const SearchableSelect = ({ 
  items, 
  value, 
  onChange, 
  placeholder,
  searchKeys = ['name'],
  renderOption = (item) => item.name,
  disabled = false
}) => {
  const [search, setSearch] = useState('')
  const [filteredItems, setFilteredItems] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)

  // Memoize the filter function
  const filterItems = useCallback((searchTerm) => {
    if (!searchTerm.trim()) {
      return []
    }
    return items.filter(item => 
      searchKeys.some(key => 
        item[key]?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }, [items, searchKeys])

  // Handle search change
  const handleSearchChange = (e) => {
    const newSearch = e.target.value
    setSearch(newSearch)
    setFilteredItems(filterItems(newSearch))
  }

  // Handle blur
  const handleBlur = () => {
    // Use setTimeout to allow click events to fire on dropdown items
    setTimeout(() => {
      setShowDropdown(false)
    }, 200)
  }

  // Handle item selection
  const handleSelect = (item) => {
    onChange(item)
    setSearch('')
    setFilteredItems([])
    setShowDropdown(false)
  }

  return (
    <div className="position-relative">
      <Form.Control
        type="text"
        value={search}
        onChange={handleSearchChange}
        onFocus={() => setShowDropdown(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
      />
      {showDropdown && filteredItems.length > 0 && (
        <div 
          className="position-absolute w-100 bg-white border rounded shadow-sm" 
          style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}
        >
          {filteredItems.map((item, index) => (
            <div
              key={item.id || index}
              className="p-2 cursor-pointer hover-bg-light"
              onMouseDown={(e) => e.preventDefault()} // Prevent blur from firing before click
              onClick={() => handleSelect(item)}
            >
              {renderOption(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchableSelect 