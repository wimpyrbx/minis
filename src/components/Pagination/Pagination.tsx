import React from 'react'
import { Pagination as BSPagination } from 'react-bootstrap'
import './Pagination.css'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  className = ''
}) => {
  if (totalPages <= 1) return null
  
  return (
    <div className={`pagination-wrapper ${className}`}>
      <BSPagination size="sm">
        <BSPagination.First 
          onClick={() => onPageChange(1)} 
          disabled={currentPage === 1}
        />
        <BSPagination.Prev 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        />
        
        {currentPage > 2 && <BSPagination.Item onClick={() => onPageChange(1)}>1</BSPagination.Item>}
        {currentPage > 3 && <BSPagination.Ellipsis />}
        {currentPage > 1 && <BSPagination.Item onClick={() => onPageChange(currentPage - 1)}>{currentPage - 1}</BSPagination.Item>}
        <BSPagination.Item active>{currentPage}</BSPagination.Item>
        {currentPage < totalPages && <BSPagination.Item onClick={() => onPageChange(currentPage + 1)}>{currentPage + 1}</BSPagination.Item>}
        {currentPage < totalPages - 2 && <BSPagination.Ellipsis />}
        {currentPage < totalPages - 1 && <BSPagination.Item onClick={() => onPageChange(totalPages)}>{totalPages}</BSPagination.Item>}
        
        <BSPagination.Next 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        />
        <BSPagination.Last 
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        />
      </BSPagination>
    </div>
  )
}

export default Pagination 