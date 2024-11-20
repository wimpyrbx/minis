import React, { useState, useEffect } from 'react'
import { Form } from 'react-bootstrap'

const TagInput = ({ value = [], onChange, existingTags = [], placeholder }) => {
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

  const handleSuggestionClick = (tag) => {
    if (!value.includes(tag)) {
      onChange([...value, tag])
    }
    setInput('')
  }

  const removeTag = (tagToRemove) => {
    onChange(value.filter(tag => tag !== tagToRemove))
  }

  return (
    <div>
      <div className="d-flex flex-wrap gap-2 mb-2">
        {value.map((tag, index) => (
          <span
            key={index}
            className="badge bg-primary"
            style={{ cursor: 'pointer' }}
            onClick={() => removeTag(tag)}
          >
            {tag} ×
          </span>
        ))}
      </div>
      <div className="position-relative">
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
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSuggestionClick(tag)}
              >
                {tag}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TagInput 