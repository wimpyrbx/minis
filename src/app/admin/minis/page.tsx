import Pagination from '@/components/Pagination';

export default function MinisAdmin() {
  // ... existing code

  return (
    <div>
      {/* ... existing content */}
      <Pagination 
        currentPage={currentPage} 
        totalPages={Math.ceil(totalMinis / itemsPerPage)}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </div>
  );
} 