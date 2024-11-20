import React from 'react'
import MenuSection from './MenuSection.jsx'
import MenuItem from './MenuItem.jsx'
import { 
  faTable,
  faBoxes,
  faCubes,
  faCog,
  faDatabase,
  faPalette,
  faCode
} from '@fortawesome/free-solid-svg-icons'

const Sidebar = () => {
  return (
    <div className="sidebar p-3">
      <h5 className="text-white mb-4 px-2">MINIS MANAGER</h5>
      
      <MenuSection title="MAIN">
        <MenuItem 
          icon={faTable} 
          to="/overview"
        >
          Mini Overview
        </MenuItem>
        <MenuItem 
          icon={faBoxes} 
          to="/product-admin"
        >
          Product Admin
        </MenuItem>
        <MenuItem 
          icon={faCubes} 
          to="/minis-admin"
        >
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
  )
}

export default Sidebar 