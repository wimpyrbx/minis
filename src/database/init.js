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

    // Create tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS mini_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          image_path TEXT,
          UNIQUE(name)
      );
      CREATE INDEX IF NOT EXISTS idx_mini_categories_name ON mini_categories(name);

      CREATE TABLE IF NOT EXISTS mini_types (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          category_id INTEGER NOT NULL,
          image_path TEXT,
          FOREIGN KEY (category_id) REFERENCES mini_categories(id) ON DELETE CASCADE,
          UNIQUE(name, category_id)
      );
      CREATE INDEX IF NOT EXISTS idx_mini_types_category ON mini_types(category_id);
      CREATE INDEX IF NOT EXISTS idx_mini_types_name ON mini_types(name);

      CREATE TABLE IF NOT EXISTS production_companies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          UNIQUE(name)
      );
      CREATE INDEX IF NOT EXISTS idx_production_companies_name ON production_companies(name);

      CREATE TABLE IF NOT EXISTS product_lines (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          company_id INTEGER NOT NULL,
          FOREIGN KEY (company_id) REFERENCES production_companies(id) ON DELETE CASCADE,
          UNIQUE(name, company_id)
      );
      CREATE INDEX IF NOT EXISTS idx_product_lines_company ON product_lines(company_id);
      CREATE INDEX IF NOT EXISTS idx_product_lines_name ON product_lines(name);

      CREATE TABLE IF NOT EXISTS product_sets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          product_line_id INTEGER NOT NULL,
          FOREIGN KEY (product_line_id) REFERENCES product_lines(id) ON DELETE CASCADE,
          UNIQUE(name, product_line_id)
      );
      CREATE INDEX IF NOT EXISTS idx_product_sets_line ON product_sets(product_line_id);
      CREATE INDEX IF NOT EXISTS idx_product_sets_name ON product_sets(name);

      CREATE TABLE IF NOT EXISTS tags (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          UNIQUE(name)
      );
      CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

      CREATE TABLE IF NOT EXISTS minis (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          location TEXT,
          image_path TEXT,
          quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
          painted BOOLEAN DEFAULT 0,
          assembled BOOLEAN DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_minis_name ON minis(name);

      CREATE TABLE IF NOT EXISTS mini_to_categories (
          mini_id INTEGER NOT NULL,
          category_id INTEGER NOT NULL,
          FOREIGN KEY (mini_id) REFERENCES minis(id) ON DELETE CASCADE,
          FOREIGN KEY (category_id) REFERENCES mini_categories(id) ON DELETE CASCADE,
          PRIMARY KEY (mini_id, category_id)
      );
      CREATE INDEX IF NOT EXISTS idx_mini_to_categories_mini ON mini_to_categories(mini_id);
      CREATE INDEX IF NOT EXISTS idx_mini_to_categories_category ON mini_to_categories(category_id);

      CREATE TABLE IF NOT EXISTS mini_to_types (
          mini_id INTEGER NOT NULL,
          type_id INTEGER NOT NULL,
          FOREIGN KEY (mini_id) REFERENCES minis(id) ON DELETE CASCADE,
          FOREIGN KEY (type_id) REFERENCES mini_types(id) ON DELETE CASCADE,
          PRIMARY KEY (mini_id, type_id)
      );
      CREATE INDEX IF NOT EXISTS idx_mini_to_types_mini ON mini_to_types(mini_id);
      CREATE INDEX IF NOT EXISTS idx_mini_to_types_type ON mini_to_types(type_id);

      CREATE TABLE IF NOT EXISTS mini_to_product_sets (
          mini_id INTEGER NOT NULL,
          set_id INTEGER NOT NULL,
          FOREIGN KEY (mini_id) REFERENCES minis(id) ON DELETE CASCADE,
          FOREIGN KEY (set_id) REFERENCES product_sets(id) ON DELETE CASCADE,
          PRIMARY KEY (mini_id, set_id)
      );
      CREATE INDEX IF NOT EXISTS idx_mini_to_product_sets_mini ON mini_to_product_sets(mini_id);
      CREATE INDEX IF NOT EXISTS idx_mini_to_product_sets_set ON mini_to_product_sets(set_id);

      CREATE TABLE IF NOT EXISTS mini_to_tags (
          mini_id INTEGER NOT NULL,
          tag_id INTEGER NOT NULL,
          FOREIGN KEY (mini_id) REFERENCES minis(id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
          PRIMARY KEY (mini_id, tag_id)
      );
      CREATE INDEX IF NOT EXISTS idx_mini_to_tags_mini ON mini_to_tags(mini_id);
      CREATE INDEX IF NOT EXISTS idx_mini_to_tags_tag ON mini_to_tags(tag_id);

      CREATE TABLE IF NOT EXISTS mini_to_proxy_types (
          mini_id INTEGER NOT NULL,
          type_id INTEGER NOT NULL,
          FOREIGN KEY (mini_id) REFERENCES minis(id) ON DELETE CASCADE,
          FOREIGN KEY (type_id) REFERENCES mini_types(id) ON DELETE CASCADE,
          PRIMARY KEY (mini_id, type_id)
      );
      CREATE INDEX IF NOT EXISTS idx_mini_to_proxy_types_mini ON mini_to_proxy_types(mini_id);
      CREATE INDEX IF NOT EXISTS idx_mini_to_proxy_types_type ON mini_to_proxy_types(type_id);
    `)

    console.log('Database initialized successfully')
    return db

  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

export default initDatabase 