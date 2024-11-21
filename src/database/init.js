import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

const initDatabase = async () => {
  try {
    // Open database connection
    const db = await open({
      filename: './minis.db',
      driver: sqlite3.Database
    })

    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON;')

    console.log('Database initialized successfully')
    return db

  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

export default initDatabase 