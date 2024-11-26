import React from 'react'
import { Card } from 'react-bootstrap'
import SectionHeader from '../SectionHeader/SectionHeader'

const PageHeader = ({ icon, iconColor, title, subtitle, children }) => {
  return (
    <Card className="mb-4">
      <Card.Body 
        className="d-flex align-items-center justify-content-between"
        style={{ height: '72px', padding: '1rem 1.5rem' }}
      >
        <SectionHeader
          icon={icon}
          iconColor={iconColor}
          title={title}
          subtitle={subtitle}
        />
        {children}
      </Card.Body>
    </Card>
  )
}

export default PageHeader 