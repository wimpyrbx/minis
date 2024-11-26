import React, { useState } from 'react'
import { api } from '../utils/db'
import {
  Container,
  Row,
  Col,
  Card,
  Accordion,
  Button,
  Form,
  Alert,
  Spinner
} from 'react-bootstrap'
import { faCode } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import PageHeader from '../components/PageHeader/PageHeader'

const endpoints = {
  'Database Management': [
    { 
      method: 'GET', 
      path: '/api/database/:table', 
      description: 'Get table schema and recent records',
      exampleParams: { table: 'minis' }
    },
    { 
      method: 'POST', 
      path: '/api/execute-sql', 
      description: 'Execute custom SQL statements',
      exampleBody: { sql: 'SELECT * FROM minis LIMIT 5;' }
    },
    { 
      method: 'POST', 
      path: '/api/export-schema', 
      description: 'Export database schema to file'
    }
  ],
  'Manufacturers': [
    { method: 'GET', path: '/api/manufacturers', description: 'List all manufacturers' },
    { 
      method: 'POST', 
      path: '/api/manufacturers', 
      description: 'Create new manufacturer',
      exampleBody: { name: 'New Manufacturer' }
    },
    { 
      method: 'PUT', 
      path: '/api/manufacturers/:id', 
      description: 'Update manufacturer',
      exampleParams: { id: '1' },
      exampleBody: { name: 'Updated Manufacturer' }
    },
    { 
      method: 'DELETE', 
      path: '/api/manufacturers/:id', 
      description: 'Delete manufacturer',
      exampleParams: { id: '1' }
    }
  ],
  'Products': [
    { method: 'GET', path: '/api/product-lines', description: 'List all product lines' },
    { 
      method: 'POST', 
      path: '/api/product-lines', 
      description: 'Create new product line',
      exampleBody: { 
        name: 'New Product Line',
        company_id: 1
      }
    },
    { 
      method: 'PUT', 
      path: '/api/product-lines/:id', 
      description: 'Update product line',
      exampleParams: { id: '1' },
      exampleBody: { 
        name: 'Updated Product Line',
        company_id: 1
      }
    },
    { 
      method: 'DELETE', 
      path: '/api/product-lines/:id', 
      description: 'Delete product line',
      exampleParams: { id: '1' }
    },
    { method: 'GET', path: '/api/product-sets', description: 'List all product sets' },
    { 
      method: 'GET', 
      path: '/api/product-lines/:lineId/sets', 
      description: 'Get product sets by product line',
      exampleParams: { lineId: '1' }
    },
    { 
      method: 'GET', 
      path: '/api/product-sets/sets', 
      description: 'Get all product sets with relationships' 
    },
    { 
      method: 'POST', 
      path: '/api/product-sets/sets', 
      description: 'Create new product set',
      exampleBody: {
        name: 'New Set',
        product_line_id: 1
      }
    },
    { 
      method: 'PUT', 
      path: '/api/product-sets/sets/:id', 
      description: 'Update product set',
      exampleParams: { id: '1' },
      exampleBody: {
        name: 'Updated Set',
        product_line_id: 1
      }
    },
    { 
      method: 'DELETE', 
      path: '/api/product-sets/sets/:id', 
      description: 'Delete product set',
      exampleParams: { id: '1' }
    }
  ],
  'Minis': [
    { method: 'GET', path: '/api/minis', description: 'List all minis' },
    { 
      method: 'POST', 
      path: '/api/minis', 
      description: 'Create new mini',
      exampleBody: {
        name: 'New Mini',
        description: 'A cool mini',
        location: 'Box 1',
        quantity: 1,
        painted_by_id: 1,
        base_size_id: 3,
        categories: [1],
        types: [1],
        proxy_types: [2],
        tags: ['unpainted', 'hero'],
        product_set_id: 1
      }
    },
    { 
      method: 'PUT', 
      path: '/api/minis/:id', 
      description: 'Update mini',
      exampleParams: { id: '1' },
      exampleBody: {
        name: 'Updated Mini',
        description: 'An even cooler mini',
        location: 'Box 2',
        quantity: 2,
        painted_by_id: 1,
        base_size_id: 3,
        categories: [1, 2],
        types: [1],
        proxy_types: [2, 3],
        tags: ['painted', 'hero'],
        product_set_id: 1
      }
    },
    { 
      method: 'DELETE', 
      path: '/api/minis/:id', 
      description: 'Delete mini',
      exampleParams: { id: '1' }
    },
    { 
      method: 'GET', 
      path: '/api/minis/:id/relationships', 
      description: 'Get mini relationships with IDs and names',
      exampleParams: { id: '1' }
    }
  ],
  'Categories': [
    { method: 'GET', path: '/api/categories', description: 'List all categories' },
    { 
      method: 'POST', 
      path: '/api/categories', 
      description: 'Create new category',
      exampleBody: { name: 'New Category' }
    },
    { 
      method: 'PUT', 
      path: '/api/categories/:id', 
      description: 'Update category',
      exampleParams: { id: '1' },
      exampleBody: { name: 'Updated Category' }
    },
    { 
      method: 'DELETE', 
      path: '/api/categories/:id', 
      description: 'Delete category',
      exampleParams: { id: '1' }
    }
  ],
  'Types': [
    { method: 'GET', path: '/api/types', description: 'List all types' },
    { 
      method: 'POST', 
      path: '/api/types', 
      description: 'Create new type',
      exampleBody: { 
        name: 'New Type',
        category_id: 1
      }
    },
    { 
      method: 'PUT', 
      path: '/api/types/:id', 
      description: 'Update type',
      exampleParams: { id: '1' },
      exampleBody: { 
        name: 'Updated Type',
        category_id: 1
      }
    },
    { 
      method: 'DELETE', 
      path: '/api/types/:id', 
      description: 'Delete type',
      exampleParams: { id: '1' }
    }
  ],
  'Tags': [
    { method: 'GET', path: '/api/tags', description: 'List all tags' },
    { 
      method: 'DELETE', 
      path: '/api/tags/cleanup', 
      description: 'Remove unused tags' 
    }
  ],
  'Reference Data': [
    { method: 'GET', path: '/api/base-sizes', description: 'List all base sizes' },
    { method: 'GET', path: '/api/painted-by', description: 'List all painted by options' }
  ],
  'Settings': [
    { method: 'GET', path: '/api/settings', description: 'Get all settings' },
    { 
      method: 'PUT', 
      path: '/api/settings/:name', 
      description: 'Update setting',
      exampleParams: { name: 'productadmin_entries_per_page' },
      exampleBody: { value: '20' }
    },
    { 
      method: 'GET', 
      path: '/api/settings/productadmin_entries_per_page', 
      description: 'Get product admin pagination setting' 
    },
    { 
      method: 'GET', 
      path: '/api/settings/minisadmin_entries_per_page', 
      description: 'Get minis admin pagination setting' 
    },
    {
      method: 'GET',
      path: '/api/settings/:name',
      description: 'Get specific setting value',
      exampleParams: { name: 'productadmin_entries_per_page' }
    }
  ],
  'System': [
    { 
      method: 'GET', 
      path: '/status', 
      description: 'Get system and database health status' 
    }
  ],
  'New Category': [
    { method: 'GET', path: '/api/new-endpoint', description: 'Description of the new endpoint' },
    // Add more endpoints as needed
  ]
}

const RequestBodyInput = ({ method, onBodyChange, exampleBody }) => {
  const [bodyText, setBodyText] = useState('')

  const handleChange = (event) => {
    const newValue = event.target.value
    setBodyText(newValue)
    try {
      const parsedBody = newValue ? JSON.parse(newValue) : {}
      onBodyChange(parsedBody)
    } catch (err) {
      // Arrr, invalid JSON be okay for now
    }
  }

  const loadExample = () => {
    const example = JSON.stringify(exampleBody, null, 2)
    setBodyText(example)
    onBodyChange(exampleBody)
  }

  if (!['POST', 'PUT'].includes(method)) return null

  return (
    <Form.Group className="mb-3">
      <Form.Label className="d-flex justify-content-between align-items-center">
        Request Body (JSON)
        {exampleBody && (
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={loadExample}
          >
            Load Example
          </Button>
        )}
      </Form.Label>
      <Form.Control
        as="textarea"
        rows={4}
        value={bodyText}
        onChange={handleChange}
        isInvalid={bodyText && !isValidJson(bodyText)}
      />
      {bodyText && !isValidJson(bodyText) && (
        <Form.Control.Feedback type="invalid">
          Yarr! That be invalid JSON, matey!
        </Form.Control.Feedback>
      )}
    </Form.Group>
  )
}

const ApiEndpoint = ({ method, path, description, exampleParams = {}, exampleBody }) => {
  const [response, setResponse] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [params, setParams] = useState({})
  const [requestBody, setRequestBody] = useState({})

  const testEndpoint = async () => {
    setLoading(true)
    setError(null)
    try {
      let finalPath = path
      // Replace path parameters with values from params object
      Object.entries(params).forEach(([key, value]) => {
        finalPath = finalPath.replace(`:${key}`, value)
      })

      let response
      switch (method) {
        case 'GET':
          response = await api.get(finalPath)
          break
        case 'POST':
          response = await api.post(finalPath, requestBody)
          break
        case 'PUT':
          response = await api.put(finalPath, requestBody)
          break
        case 'DELETE':
          response = await api.delete(finalPath)
          break
        default:
          throw new Error(`Unsupported method: ${method}`)
      }
      
      setResponse(response.data)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleParamChange = (param) => (event) => {
    setParams(prev => ({
      ...prev,
      [param]: event.target.value
    }))
  }

  // Extract path parameters
  const pathParams = path.match(/:[a-zA-Z]+/g)?.map(p => p.substring(1)) || []

  return (
    <Card className="mb-2">
      <Card.Body className="p-2">
        <div className="d-flex align-items-center mb-2" style={{ minHeight: 'auto' }}>
          <span 
            className={`me-2 badge bg-${
              method === 'GET' ? 'success' : 
              method === 'POST' ? 'primary' : 
              method === 'PUT' ? 'warning' : 'danger'
            }`}
            style={{ minWidth: '60px', display: 'inline-block' }}
          >
            {method}
          </span>
          <div className="d-flex align-items-center" style={{ flex: '1 1 auto', minHeight: 'auto' }}>
            <code className="small">{path}</code>
          </div>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={testEndpoint}
            disabled={loading}
            className="ms-2"
          >
            {loading ? (
              <><Spinner size="sm" className="me-1" /> Test</>
            ) : (
              'Test'
            )}
          </Button>
        </div>

        <p className="text-muted small mb-2">{description}</p>

        {pathParams.length > 0 && (
          <div className="mb-2">
            {pathParams.map(param => (
              <Form.Group key={param} className="mb-2">
                <Form.Label className="small mb-1">{param}</Form.Label>
                <Form.Control
                  size="sm"
                  onChange={handleParamChange(param)}
                />
              </Form.Group>
            ))}
          </div>
        )}

        <RequestBodyInput 
          method={method} 
          onBodyChange={body => setRequestBody(body)}
          exampleBody={exampleBody}
        />

        {error && (
          <Alert variant="danger" className="mb-2 p-2 small">
            {error}
          </Alert>
        )}

        {response && (
          <div className="bg-dark text-light p-2 rounded small" style={{ maxHeight: '150px', overflow: 'auto' }}>
            <pre className="m-0" style={{ fontSize: '0.75rem' }}>
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </Card.Body>
    </Card>
  )
}

// Helper function to validate JSON
const isValidJson = (str) => {
  try {
    JSON.parse(str)
    return true
  } catch (e) {
    return false
  }
}

const ApiViewer = () => {
  return (
    <Container fluid className="content">
      <PageHeader
        icon={faCode}
        iconColor="text-primary"
        title="API Viewer"
        subtitle="Test and explore available API endpoints"
      />

      <Card>
        <Card.Body className="p-0">
          <Accordion>
            {Object.entries(endpoints).map(([category, endpoints]) => (
              <Accordion.Item key={category} eventKey={category}>
                <Accordion.Header className="py-2">
                  <span className="fw-bold">{category}</span>
                  <span className="text-muted ms-2 small">
                    ({endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''})
                  </span>
                </Accordion.Header>
                <Accordion.Body className="bg-light p-2">
                  {endpoints.map((endpoint, index) => (
                    <ApiEndpoint key={index} {...endpoint} />
                  ))}
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default ApiViewer 