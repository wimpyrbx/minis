import { Container, Row, Col, Nav, Navbar } from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'

function App() {
  return (
    <div className="d-flex">
      {/* Sidebar */}
      <div className="sidebar p-3" style={{ width: '250px' }}>
        <h3 className="text-white mb-4">D&D Minis</h3>
        <Nav className="flex-column">
          <Nav.Link href="#dashboard">Dashboard</Nav.Link>
          <Nav.Link href="#miniatures">Miniatures</Nav.Link>
          <Nav.Link href="#categories">Categories</Nav.Link>
          <Nav.Link href="#sets">Sets</Nav.Link>
          <Nav.Link href="#manufacturers">Manufacturers</Nav.Link>
        </Nav>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1">
        {/* Top Navbar */}
        <Navbar bg="light" className="border-bottom">
          <Container fluid>
            <Navbar.Brand>Dashboard</Navbar.Brand>
            <Navbar.Toggle />
            <Navbar.Collapse className="justify-content-end">
              <Navbar.Text>
                Admin User
              </Navbar.Text>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        {/* Main Content Area */}
        <Container fluid className="content">
          <Row className="mb-4">
            <Col md={3}>
              <div className="p-3 bg-primary text-white rounded">
                <h5>Total Miniatures</h5>
                <h2>150</h2>
              </div>
            </Col>
            <Col md={3}>
              <div className="p-3 bg-success text-white rounded">
                <h5>Categories</h5>
                <h2>12</h2>
              </div>
            </Col>
            <Col md={3}>
              <div className="p-3 bg-warning text-white rounded">
                <h5>Sets</h5>
                <h2>8</h2>
              </div>
            </Col>
            <Col md={3}>
              <div className="p-3 bg-info text-white rounded">
                <h5>Manufacturers</h5>
                <h2>5</h2>
              </div>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <div className="bg-white p-4 rounded shadow-sm">
                <h4>Recent Miniatures</h4>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Set</th>
                      <th>Manufacturer</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Ancient Red Dragon</td>
                      <td>Dragons</td>
                      <td>Icons of the Realms</td>
                      <td>WizKids</td>
                      <td>
                        <button className="btn btn-sm btn-primary me-2">Edit</button>
                        <button className="btn btn-sm btn-danger">Delete</button>
                      </td>
                    </tr>
                    {/* Add more rows as needed */}
                  </tbody>
                </table>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  )
}

export default App
