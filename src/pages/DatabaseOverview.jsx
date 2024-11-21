import React, { useState, useEffect } from 'react'
import { Container, Card, Nav, Table } from 'react-bootstrap'
import { faDatabase } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { api } from '../database/db'

const DatabaseOverview = () => {
  const [tables, setTables] = useState([])
  const [activeTable, setActiveTable] = useState('')
  const [tableData, setTableData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch list of all tables on component mount
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await api.post('/api/execute-sql', {
          sql: "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
        })
        if (response.data.success && response.data.results[0].rows.length > 0) {
          const tableNames = response.data.results[0].rows.map(row => row.name)
          setTables(tableNames)
          // Set first table as active if none selected
          if (!activeTable && tableNames.length > 0) {
            setActiveTable(tableNames[0])
          }
        }
      } catch (err) {
        setError(err.message)
      }
    }
    fetchTables()
  }, [activeTable])

  // Fetch data for active table
  useEffect(() => {
    const fetchTableData = async () => {
      if (!activeTable) return

      try {
        setLoading(true)
        const response = await api.get(`/api/database/${activeTable}`)
        setTableData(prev => ({
          ...prev,
          [activeTable]: response.data
        }))
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (activeTable && !tableData[activeTable]) {
      fetchTableData()
    }
  }, [activeTable])

  if (error) return <div>Error: {error}</div>

  return (
    <Container fluid className="content">
      <Card className="mb-4">
        <Card.Body className="d-flex align-items-center">
          <FontAwesomeIcon icon={faDatabase} className="text-info me-2" />
          <div>
            <h4 className="mb-0">Database Overview</h4>
            <small className="text-muted">View database structure and contents</small>
          </div>
        </Card.Body>
      </Card>

      <div className="bg-white p-4 rounded shadow-sm">
        <div className="d-flex">
          <div style={{ width: '200px' }} className="me-4">
            <Nav variant="pills" className="flex-column">
              {tables.map(table => (
                <Nav.Item key={table}>
                  <Nav.Link
                    active={activeTable === table}
                    onClick={() => setActiveTable(table)}
                    className="text-truncate"
                  >
                    {table}
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
          </div>

          <div className="flex-grow-1">
            {loading ? (
              <div>Loading...</div>
            ) : activeTable && tableData[activeTable] ? (
              <>
                <h5 className="mb-3">Table Structure</h5>
                <pre className="bg-light p-3 rounded">
                  <code>{tableData[activeTable]?.schema || 'No schema available'}</code>
                </pre>

                <h5 className="mb-3 mt-4">Recent Records</h5>
                {tableData[activeTable]?.records?.length > 0 ? (
                  <Table hover responsive>
                    <thead>
                      <tr>
                        {Object.keys(tableData[activeTable].records[0]).map(column => (
                          <th key={column}>{column}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData[activeTable].records.map((record, idx) => (
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
              </>
            ) : (
              <div className="text-muted text-center py-3">
                Select a table to view its structure and data
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  )
}

export default DatabaseOverview 