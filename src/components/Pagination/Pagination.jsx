import React from 'react';
import { Pagination } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faAngleDoubleLeft, 
  faAngleLeft, 
  faAngleRight, 
  faAngleDoubleRight 
} from '@fortawesome/free-solid-svg-icons';
import './Pagination.css';

const PaginationControl = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || 
        i === totalPages || 
        (i >= currentPage - 2 && i <= currentPage + 2)
      ) {
        pages.push(i);
      } else if (i === currentPage - 3 || i === currentPage + 3) {
        pages.push('...');
      }
    }
    return pages.filter((page, index, array) => 
      page === '...' ? array[index - 1] !== '...' : true
    );
  };

  return (
    <Pagination className="mt-3 mb-0 justify-content-end">
      <Pagination.First 
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
      >
        <FontAwesomeIcon icon={faAngleDoubleLeft} />
      </Pagination.First>
      <Pagination.Prev 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <FontAwesomeIcon icon={faAngleLeft} />
      </Pagination.Prev>

      {getPageNumbers().map((page, index) => (
        <Pagination.Item
          key={index}
          active={page === currentPage}
          onClick={() => typeof page === 'number' && onPageChange(page)}
          disabled={typeof page !== 'number'}
        >
          {page}
        </Pagination.Item>
      ))}

      <Pagination.Next 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <FontAwesomeIcon icon={faAngleRight} />
      </Pagination.Next>
      <Pagination.Last 
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
      >
        <FontAwesomeIcon icon={faAngleDoubleRight} />
      </Pagination.Last>
    </Pagination>
  );
};

export default PaginationControl; 