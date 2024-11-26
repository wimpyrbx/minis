import Pagination from '@/components/Pagination';

export default function ProductsAdmin() {
  // ... existing code

  return (
    <div>
      {/* ... existing content */}
      <Pagination 
        currentPage={currentPage} 
        totalPages={Math.ceil(totalProducts / itemsPerPage)}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
} 