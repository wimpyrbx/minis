import React from 'react'
import MenuSection from './MenuSection.jsx'
import MenuItem from './MenuItem.jsx'
import { Form } from 'react-bootstrap'
import { 
  faPhotoFilm,
  faBoxes,
  faCubes,
  faDatabase,
  faCode,
  faSun,
  faMoon,
  faInfo
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useTheme } from '../../context/ThemeContext'

const Sidebar = () => {
  const { darkMode, setDarkMode } = useTheme()

  return (
    <div className="sidebar">
      <div className="p-3">
        <h5 className="text-white mb-4 px-2">MINIS MANAGER</h5>
        
        <MenuSection title="MAIN">
          <MenuItem icon={faPhotoFilm} to="/overview" color="info">
            Mini Overview
          </MenuItem>
          <MenuItem icon={faBoxes} to="/product-admin" color="warning">
            Product Admin
          </MenuItem>
          <MenuItem icon={faCubes} to="/minis-admin" color="success">
            Minis Admin
          </MenuItem>
        </MenuSection>

        <MenuSection title="SYSTEM">
          <MenuItem icon={faDatabase} to="/database" color="danger">
            Database
          </MenuItem>
          <MenuItem icon={faCode} to="/manual-sql" color="secondary">
            Manual SQL
          </MenuItem>
          <MenuItem icon={faInfo} to="/api-viewer" color="white">
            Api Viewer
          </MenuItem>
        </MenuSection>
      </div>

      {/* Theme switch at bottom */}
      <div className="theme-switch-container">
        <div className="d-flex align-items-center">
          <FontAwesomeIcon 
            icon={darkMode ? faMoon : faSun} 
            className="text-white me-2" 
          />
          <Form.Check
            type="switch"
            id="theme-switch"
            checked={darkMode}
            onChange={(e) => setDarkMode(e.target.checked)}
            className="theme-switch"
          />
        </div>
      </div>
    </div>
  )
}

export default Sidebar 