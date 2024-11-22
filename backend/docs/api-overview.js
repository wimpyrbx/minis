/**
 * API Documentation Overview
 * 
 * Base URL: /api
 * 
 * Authentication: None (currently)
 * 
 * Common Response Formats:
 * Success: { data: <response_data> }
 * Error: { error: <error_message> }
 * 
 * Endpoints by Domain:
 * 
 * 1. Database Management
 * GET /database/:table - Get table schema and recent records
 * POST /execute-sql - Execute custom SQL statements
 * POST /export-schema - Export database schema
 * 
 * 2. Categories & Types
 * GET /categories - List all categories
 * POST /categories - Create new category
 * PUT /categories/:id - Update category
 * DELETE /categories/:id - Delete category
 * ...
 */ 