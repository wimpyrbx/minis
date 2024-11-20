import React from 'react'
import { Nav } from 'react-bootstrap'
import PropTypes from 'prop-types'

const MenuSection = ({ title, children }) => {
  return (
    <div className="mb-4">
      <small className="text-muted px-2 mb-2 d-block">{title}</small>
      <Nav className="flex-column">
        {children}
      </Nav>
    </div>
  )
}

MenuSection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
}

export default MenuSection 