import Pagination from '@/components/Pagination';

export default function Home() {
  // ... existing code

  return (
    <main>
      {/* ... existing content */}
      <Pagination 
        currentPage={currentPage} 
        totalPages={Math.ceil(totalItems / itemsPerPage)}
        onPageChange={(page) => setCurrentPage(page)}
      />
    </main>
  );
} 