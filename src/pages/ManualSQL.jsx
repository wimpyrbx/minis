import React, { useState } from 'react'
import { Container, Card, Form, Button, Table, Alert, Row, Col } from 'react-bootstrap'
import { faCode } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { api } from '../database/db'

const EXAMPLE_QUERIES = {
  'Show Tables': `SELECT name FROM sqlite_master WHERE type='table';`,
  'List Categories': 'SELECT * FROM mini_categories;',
  'Count Minis': 'SELECT COUNT(*) as total FROM minis;',
  'Complex Join': `
SELECT m.name, mc.name as category, mt.name as type, pl.name as product_line
FROM minis m
LEFT JOIN mini_to_categories mtc ON m.id = mtc.mini_id
LEFT JOIN mini_categories mc ON mtc.category_id = mc.id
LEFT JOIN mini_to_types mtt ON m.id = mtt.mini_id
LEFT JOIN mini_types mt ON mtt.type_id = mt.id
LEFT JOIN mini_to_product_sets mtps ON m.id = mtps.mini_id
LEFT JOIN product_sets ps ON mtps.set_id = ps.id
LEFT JOIN product_lines pl ON ps.product_line_id = pl.id
LIMIT 10;
  `
}

const ManualSQL = () => {
  const [sql, setSql] = useState('')
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleExecute = async () => {
    setIsLoading(true)
    setError(null)
    setResults([])

    try {
      const response = await api.post('/api/execute-sql', { sql })
      setResults(response.data)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const loadExampleQuery = (query) => {
    setSql(EXAMPLE_QUERIES[query])
  }

  const renderResults = () => {
    if (!results.length) return null
    
    // Get column names from first result
    const columns = Object.keys(results[0])

    return (
      <div className="mt-4">
        <h5>Results</h5>
        <Table hover responsive>
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((row, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col}>{row[col]?.toString()}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
        <small className="text-muted">
          {results.length} row(s) returned
        </small>
      </div>
    )
  }

  return (
    <Container fluid className="content">
      <Card className="mb-4">
        <Card.Body className="d-flex align-items-center">
          <FontAwesomeIcon icon={faCode} className="text-primary me-3" size="2x" />
          <div>
            <h4 className="mb-0">Manual SQL</h4>
            <small className="text-muted">Execute custom SQL queries</small>
          </div>
        </Card.Body>
      </Card>

      <div className="bg-white p-4 rounded shadow-sm">
        <Row className="mb-3">
          <Col>
            <h6>Example Queries:</h6>
            <div className="d-flex gap-2 flex-wrap">
              {Object.keys(EXAMPLE_QUERIES).map(query => (
                <Button
                  key={query}
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => loadExampleQuery(query)}
                >
                  {query}
                </Button>
              ))}
            </div>
          </Col>
        </Row>

        <Form>
          <Form.Group className="mb-3">
            <Form.Label>SQL Query</Form.Label>
            <Form.Control
              as="textarea"
              rows={6}
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              placeholder="Enter SQL queries (separate multiple queries with semicolon)"
              className="font-monospace"
            />
            <Form.Text className="text-muted">
              Be careful with DELETE/DROP operations - they cannot be undone
            </Form.Text>
          </Form.Group>

          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          <Button 
            variant="primary" 
            onClick={handleExecute}
            disabled={!sql.trim() || isLoading}
          >
            {isLoading ? 'Executing...' : 'Execute'}
          </Button>
        </Form>

        {renderResults()}
      </div>
    </Container>
  )
}

export default ManualSQL 