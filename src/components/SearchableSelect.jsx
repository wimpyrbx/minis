import React, { useState, useEffect } from 'react'
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

  useEffect(() => {
    if (search.trim()) {
      const filtered = items.filter(item => 
        searchKeys.some(key => 
          item[key]?.toLowerCase().includes(search.toLowerCase())
        )
      )
      setFilteredItems(filtered)
    } else {
      setFilteredItems([])
    }
  }, [search, items, searchKeys])

  return (
    <div className="position-relative">
      <Form.Control
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => setShowDropdown(true)}
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
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(item)
                setSearch('')
                setShowDropdown(false)
              }}
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