import React from 'react'
import MenuSection from './MenuSection.jsx'
import MenuItem from './MenuItem.jsx'
import { Form } from 'react-bootstrap'
import { 
  faTable,
  faBoxes,
  faCubes,
  faCog,
  faDatabase,
  faPalette,
  faCode,
  faSun,
  faMoon
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
          <MenuItem icon={faTable} to="/overview">
            Mini Overview
          </MenuItem>
          <MenuItem icon={faBoxes} to="/product-admin">
            Product Admin
          </MenuItem>
          <MenuItem icon={faCubes} to="/minis-admin">
            Minis Admin
          </MenuItem>
        </MenuSection>

        <MenuSection title="SYSTEM">
          <MenuItem icon={faCog} to="/settings">
            Settings
          </MenuItem>
          <MenuItem icon={faDatabase} to="/database">
            Database
          </MenuItem>
          <MenuItem icon={faCode} to="/manual-sql">
            Manual SQL
          </MenuItem>
          <MenuItem icon={faPalette} to="/ui">
            UI Elements
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