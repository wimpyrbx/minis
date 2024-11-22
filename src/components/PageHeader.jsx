import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const PageHeader = ({ icon, iconColor, title, subtitle, children }) => {
  return (
    <div className="mb-4">
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <div className="d-flex align-items-center mb-1">
            {icon && (
              <FontAwesomeIcon 
                icon={icon} 
                className={`${iconColor || 'text-primary'} me-2`} 
                size="lg"
              />
            )}
            <h4 className="mb-0">{title}</h4>
          </div>
          {subtitle && (
            <div className="text-muted small">{subtitle}</div>
          )}
        </div>
        {children && (
          <div>
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

export default PageHeader 