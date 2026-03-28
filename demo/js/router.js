// Highlights the active link in the sidebar according to the current route
function setActiveSidebarLink() {
    // 1. Get the current path (e.g., "/drivers" or "/drivers.html")
    let currentPath = window.location.pathname;
    
    // 2. Clean to get only the base name (e.g., "drivers")
    let cleanPath = currentPath.split('/').pop().replace('.html', '');
    
    // 3. Special case for root or index
    if (cleanPath === '' || cleanPath === 'index') {
        cleanPath = 'dashboard';
    }

    // 4. Remove the active class from ALL items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // 5. Find the link whose data-route matches our cleanPath exactly
    const activeLink = document.querySelector(`.sidebar-link[data-route="${cleanPath}"]`);
    
    if (activeLink) {
        activeLink.parentElement.classList.add('active');
    }
}

async function navigate(path) {
    // 1. Get the corresponding HTML file
    const page = routes[path] || 'login.html';
    try {
        const response = await fetch(page);
        const html = await response.text();
        // 2. Inject the HTML into the index container
        document.getElementById('view-container').innerHTML = html;
        // 3. Optionally hide the sidebar if on Login and toggle .with-sidebar on body
        const sidebar = document.getElementById('sidebar');
        const body = document.body;
        if (path === '/') {
            sidebar.style.display = 'none';
            body.classList.remove('with-sidebar');
        } else {
            sidebar.style.display = 'flex';
            body.classList.add('with-sidebar');
        }
        // 4. Load drivers pagination script if on drivers page
        if (path === '/drivers') {
            import('./js/utils.js').then(({ loadScript }) => {
                loadScript('js/drivers-pagination.js');
            });
        }
    } catch (error) {
        console.error("Error loading page:", error);
    }
}


// Listen for browser navigation (back/forward)
window.onpopstate = () => {
    navigate(window.location.pathname);
    setActiveSidebarLink();
};

// Handle sidebar navigation clicks for SPA routing
document.addEventListener('DOMContentLoaded', () => {
    setActiveSidebarLink();
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const path = this.getAttribute('href');
            window.history.pushState({}, '', path);
            navigate(path);
            setActiveSidebarLink();
        });
    });
});