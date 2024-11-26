import React, { useState, useEffect } from 'react'
import { Form } from 'react-bootstrap'

const TagInput = ({ value = [], onChange, existingTags = [], placeholder = '', renderTags = true }) => {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    if (input.trim()) {
      const filtered = existingTags
        .filter(tag => 
          !value.includes(tag) && 
          tag.toLowerCase().includes(input.toLowerCase())
        )
        .slice(0, 5)
      setSuggestions(filtered)
    } else {
      setSuggestions([])
    }
  }, [input, existingTags, value])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const newTag = input.trim()
      if (newTag && !value.includes(newTag)) {
        onChange([...value, newTag])
      }
      setInput('')
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    onChange(value.filter(tag => tag !== tagToRemove))
  }

  return (
    <div>
      <Form.Control
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      {suggestions.length > 0 && (
        <div 
          className="position-absolute w-100 bg-white border rounded shadow-sm" 
          style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}
        >
          {suggestions.map((tag, index) => (
            <div
              key={index}
              className="p-2 cursor-pointer hover-bg-light"
              onClick={() => {
                if (!value.includes(tag)) {
                  onChange([...value, tag])
                }
                setInput('')
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      )}
      {renderTags && (
        <div className="mt-2">
          {value.map((tag, index) => (
            <span
              key={index}
              className="badge bg-primary me-1 mb-1"
              style={{ cursor: 'pointer' }}
              onClick={() => handleRemoveTag(tag)}
            >
              {tag} ×
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default TagInput 