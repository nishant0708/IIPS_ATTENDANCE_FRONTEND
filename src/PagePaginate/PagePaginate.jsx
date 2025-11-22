// PagePaginate/PagePaginate.jsx
import React from 'react';
import ReactPaginate from 'react-paginate';
import './PagePaginate.css';

const PagePaginate = ({ page = 1, setPage, totalPages = 1 }) => {
  // react-paginate uses 0-based page index, your state is 1-based
  const handlePageChange = (selectedItem) => {
    const newPage = selectedItem.selected + 1;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!totalPages || totalPages <= 1) {
    return null; // no pagination needed
  }

  return (
    <div className="paginate">
      <ReactPaginate
        previousLabel="<"
        nextLabel=">"
        breakLabel="..."
        onPageChange={handlePageChange}
        marginPagesDisplayed={1}
        pageRangeDisplayed={3}
        pageCount={totalPages}
        forcePage={page - 1} // sync with current page

        // class names for styling (defined in PagePaginate.css)
        containerClassName="pagination-container"
        pageClassName="pagination-item"
        previousClassName="pagination-item pagination-prev-next"
        nextClassName="pagination-item pagination-prev-next"
        breakClassName="pagination-item pagination-break"
        activeClassName="pagination-item-active"
        disabledClassName="pagination-item-disabled"
      />
    </div>
  );
};

export default PagePaginate;
