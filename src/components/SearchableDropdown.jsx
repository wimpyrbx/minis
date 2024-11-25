import React from 'react'
import Select from 'react-select'

const SearchableDropdown = ({ 
  items, 
  value, 
  onChange, 
  placeholder = "Select...",
  renderOption = (item) => item.name
}) => {
  const options = items.map(item => ({
    value: item.id.toString(),
    label: renderOption(item),
    id: item.id.toString()
  }))

  const selectedOption = options.find(option => option.value === value) || null

  return (
    <Select
      value={selectedOption}
      onChange={(selected) => {
        onChange({
          target: {
            value: selected ? selected.value : ''
          }
        })
      }}
      options={options}
      placeholder={placeholder}
      isClearable={false}
      isSearchable={true}
      classNamePrefix="react-select"
      styles={{
        control: (base, state) => ({
          ...base,
          minHeight: '31px',
          backgroundColor: '#2b3035',
          borderRadius: '0.375rem',
          borderColor: '#495057',
          boxShadow: state.isFocused ? '0 0 0 0.15rem rgba(13, 110, 253, 0.25)' : 'none',
          '&:hover': {
            borderColor: '#495057'
          },
          fontSize: '0.875rem'
        }),
        valueContainer: (base) => ({
          ...base,
          padding: '2px 8px'
        }),
        input: (base) => ({
          ...base,
          color: '#fff',
          margin: '0',
          padding: '0',
          fontSize: '0.875rem'
        }),
        singleValue: (base) => ({
          ...base,
          color: '#fff',
          fontSize: '0.875rem'
        }),
        indicatorSeparator: () => ({
          display: 'none'
        }),
        dropdownIndicator: (base) => ({
          ...base,
          padding: '4px',
          color: '#fff',
          '&:hover': {
            color: '#fff'
          }
        }),
        menu: (base) => ({
          ...base,
          backgroundColor: '#2b3035',
          zIndex: 9999,
          marginTop: '4px',
          borderRadius: '0.375rem',
          border: '1px solid #495057',
          boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.4)',
          fontSize: '0.875rem'
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isFocused ? '#0d6efd' : 'transparent',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '0.875rem',
          padding: '4px 8px',
          '&:hover': {
            backgroundColor: '#0d6efd',
            color: '#fff'
          },
          '&:active': {
            backgroundColor: '#0d6efd',
            color: '#fff'
          }
        }),
        placeholder: (base) => ({
          ...base,
          color: '#6c757d',
          fontSize: '0.875rem'
        })
      }}
      theme={(theme) => ({
        ...theme,
        colors: {
          ...theme.colors,
          primary: '#0d6efd',
          primary25: '#0d6efd',
          primary50: '#0d6efd',
          primary75: '#0d6efd',
          neutral0: '#2b3035',
          neutral5: '#2b3035',
          neutral10: '#2b3035',
          neutral20: '#495057',
          neutral30: '#495057',
          neutral40: '#fff',
          neutral50: '#6c757d',
          neutral60: '#fff',
          neutral70: '#fff',
          neutral80: '#fff',
          neutral90: '#fff'
        }
      })}
    />
  )
}

export default SearchableDropdown 