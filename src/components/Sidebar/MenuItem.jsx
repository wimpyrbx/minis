import React from 'react'
import { NavLink } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'

const MenuItem = ({ icon, to, children }) => {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `nav-link ${isActive ? 'active' : ''}`
      }
    >
      <FontAwesomeIcon icon={icon} className="me-2" fixedWidth />
      {children}
    </NavLink>
  )
}

MenuItem.propTypes = {
  icon: PropTypes.object.isRequired,
  to: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
}

export default MenuItem 