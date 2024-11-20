import React from 'react'
import { createRoot } from 'react-dom/client'
import { testConnection } from './database/db.js'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.jsx'

// Test database connection on startup
testConnection().then(connected => {
  if (connected) {
    console.log('Successfully connected to database')
  } else {
    console.error('Failed to connect to database')
  }
})

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
