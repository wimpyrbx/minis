import React, { useState, useEffect } from 'react'
import { Container, Nav, Tab, Row, Col, Card, Table, Button } from 'react-bootstrap'
import { faDatabase } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { api } from '../database/db'

const TABLES = [
  'mini_categories',
  'sqlite_sequence',
  'mini_types',
  'production_companies',
  'product_lines',
  'product_sets',
  'tags',
  'minis',
  'mini_to_categories',
  'mini_to_types',
  'mini_to_product_sets',
  'mini_to_tags',
  'mini_to_proxy_types'
]

const DatabaseOverview = () => {
  const [tableData, setTableData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTableData = async () => {
      try {
        const results = {}
        for (const table of TABLES) {
          const response = await api.get(`/api/database/${table}`)
          results[table] = response.data
        }
        setTableData(results)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTableData()
  }, [])

  const handleCopySchema = (schema) => {
    navigator.clipboard.writeText(schema)
      .then(() => {
        // Optional: Add visual feedback
        const button = document.activeElement
        const originalText = button.textContent
        button.textContent = 'Copied!'
        setTimeout(() => {
          button.textContent = originalText
        }, 1500)
      })
      .catch(err => console.error('Failed to copy:', err))
  }

  if (loading) {
    return (
      <Container fluid className="content">
        <div className="text-center">Loading...</div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container fluid className="content">
        <div className="text-danger">Error: {error}</div>
      </Container>
    )
  }

  return (
    <Container fluid className="content">
      <Card className="mb-4">
        <Card.Body className="d-flex align-items-center">
          <FontAwesomeIcon icon={faDatabase} className="text-primary me-3" size="2x" />
          <div>
            <h4 className="mb-0">Database Overview</h4>
            <small className="text-muted">View database schema and recent records</small>
          </div>
        </Card.Body>
      </Card>

      <div className="bg-white p-4 rounded shadow-sm">
        <Tab.Container defaultActiveKey={TABLES[0]}>
          <Row>
            <Col sm={3}>
              <Nav variant="pills" className="flex-column">
                {TABLES.map(table => (
                  <Nav.Item key={table}>
                    <Nav.Link eventKey={table}>
                      {table}
                    </Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>
            </Col>
            <Col sm={9}>
              <Tab.Content>
                {TABLES.map(table => (
                  <Tab.Pane key={table} eventKey={table}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0">Schema</h5>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleCopySchema(tableData[table]?.schema)}
                        disabled={!tableData[table]?.schema}
                      >
                        Copy SQL
                      </Button>
                    </div>
                    <pre className="bg-light p-3 rounded">
                      <code>{tableData[table]?.schema || 'No schema available'}</code>
                    </pre>

                    <h5 className="mb-3 mt-4">Recent Records</h5>
                    {tableData[table]?.records?.length > 0 ? (
                      <Table hover responsive>
                        <thead>
                          <tr>
                            {Object.keys(tableData[table].records[0]).map(column => (
                              <th key={column}>{column}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableData[table].records.map((record, idx) => (
                            <tr key={idx}>
                              {Object.values(record).map((value, i) => (
                                <td key={i}>{value?.toString() || 'null'}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <div className="text-muted text-center py-3">
                        No records found
                      </div>
                    )}
                  </Tab.Pane>
                ))}
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </div>
    </Container>
  )
}

export default DatabaseOverview 