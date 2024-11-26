import React, { useState } from 'react'
import { Container, Card, Form, Button, Table, Alert, Row, Col } from 'react-bootstrap'
import { faCode } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { api } from '../database/db'
import PageHeader from '../components/PageHeader/PageHeader'

const EXAMPLE_QUERIES = {
  'Show Tables': `SELECT name FROM sqlite_master WHERE type='table';`,
  'List Categories': 'SELECT * FROM mini_categories;',
  'Count Minis': 'SELECT COUNT(*) as total FROM minis;'
}

const ManualSQL = () => {
  const [sql, setSql] = useState('')
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleExecute = async () => {
    setIsLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await api.post('/api/execute-sql', { sql })
      if (response.data.success) {
        setResults(response.data)
      } else {
        setError(response.data.error || 'Unknown error occurred')
      }
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
    if (!results?.results?.length) return null
    
    return (
      <div className="mt-4">
        {results.results.map((result, index) => (
          <div key={index} className="mb-4">
            <h5>Result {index + 1}</h5>
            {result.type === 'SELECT' ? (
              <>
                <Table hover responsive>
                  <thead>
                    <tr>
                      {result.rows.length > 0 && Object.keys(result.rows[0]).map(col => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((value, j) => (
                          <td key={j}>{value?.toString()}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <small className="text-muted">
                  {result.rowCount} row(s) returned
                </small>
              </>
            ) : (
              <div className="alert alert-info">
                {result.statement}<br/>
                Changes: {result.changes}, Last ID: {result.lastID || 'N/A'}
              </div>
            )}
          </div>
        ))}
        <div className="alert alert-success">
          {results.message}
        </div>
      </div>
    )
  }

  return (
    <Container fluid className="content">
      <PageHeader
        icon={faCode}
        iconColor="text-warning"
        title="Manual SQL"
        subtitle="Execute custom SQL queries"
      />

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