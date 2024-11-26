import React from 'react';
import { Modal, Table } from 'react-bootstrap';

const UsageDetailsModal = ({ 
  show, 
  onHide, 
  title, 
  count, 
  items, 
  type // 'category', 'type', or 'proxy'
}) => {
  const getTypeLabel = () => {
    switch (type) {
      case 'proxy':
        return 'Proxy Type';
      case 'type':
        return 'Type';
      case 'category':
        return 'Category';
      default:
        return '';
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton className="bg-dark text-white">
        <Modal.Title>
          {getTypeLabel()}: {title} ({count})
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Table hover>
          <thead>
            <tr>
              <th>Mini Name</th>
              <th>Used As</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td>{item.mini_name}</td>
                <td>{type === 'proxy' ? 'Proxy Type' : type === 'type' ? 'Type' : 'Category'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Modal.Body>
    </Modal>
  );
};

export default UsageDetailsModal; 