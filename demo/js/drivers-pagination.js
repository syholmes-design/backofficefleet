document.addEventListener('DOMContentLoaded', function () {
    const rows = Array.from(document.querySelectorAll('.drivers-table tbody tr'));
    const pageNums = document.querySelectorAll('.page-num');
    const arrows = document.querySelectorAll('.pagination-arrow');
    const prevBtn = arrows[0]; // The first button is Previous
    const nextBtn = arrows[1]; // The second button is Next
    
        const rowsPerPage = 8;
    let currentPage = 1;
    const totalPages = Math.ceil(rows.length / rowsPerPage);

    function showPage(page) {
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        currentPage = page;

        // Hide all rows
        rows.forEach(row => row.style.display = 'none');

        // Show only those of the current page
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        rows.slice(start, end).forEach(row => row.style.display = '');

        // Update numbers
        pageNums.forEach((el, i) => {
            if (i + 1 === page) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });

        // Disable arrows if necessary
        prevBtn.disabled = (currentPage === 1);
        nextBtn.disabled = (currentPage === totalPages);
    }

    // Events for page numbers
    pageNums.forEach((el) => {
        el.addEventListener('click', () => {
            const pageInt = parseInt(el.textContent);
            if (!isNaN(pageInt)) showPage(pageInt);
        });
    });

    // Events for arrows
    prevBtn.addEventListener('click', () => showPage(currentPage - 1));
    nextBtn.addEventListener('click', () => showPage(currentPage + 1));

    // Start on page 1
    showPage(1);
});