import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Pagination from "@/components/ui/Pagination";

const PaginationPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(6);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // You can add any other logic you need here, such as making an API call to fetch data for the new page
  };
  return (
    
     
      <Card title="Pagination With Background">
        <Pagination
          className="bg-slate-100 dark:bg-slate-500  w-fit py-2 px-3 rounded-sm mx-auto"
          totalPages={totalPages}
          currentPage={currentPage}
          handlePageChange={handlePageChange}
        />
      </Card>
     
   
  );
};

export default PaginationPage;
