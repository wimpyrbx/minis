import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const SectionHeader = ({ icon, iconColor = 'text-primary', title, subtitle, children }) => {
  return (
    <div className="d-flex align-items-center justify-content-between">
      <div className="d-flex align-items-center">
        <FontAwesomeIcon icon={icon} className={`${iconColor} me-3`} size="lg" />
        <div>
          <h5 className="mb-0">{title}</h5>
          {subtitle && <small className="text-muted">{subtitle}</small>}
        </div>
      </div>
      {children}
    </div>
  )
}

export default SectionHeader 