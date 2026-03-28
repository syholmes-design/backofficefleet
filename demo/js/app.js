/**
 * APP.JS - BackOfficeFleet
 * Manejo global de navegación, sidebar y autenticación
 */

// 1. ÚNICA FUNCIÓN DE TOGGLE (Abre y Cierra la sidebar)
function setupSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    const openBtn = document.getElementById('sidebar-toggle'); // Botón hamburguesa fuera
    const closeBtn = document.getElementById('sidebar-close'); // Botón X dentro
    
    // Buscar o crear el backdrop (fondo oscuro para móviles)
    let backdrop = document.getElementById('sidebar-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'sidebar-backdrop';
        backdrop.className = 'sidebar-backdrop';
        document.body.appendChild(backdrop);
    }

    // Lógica para abrir
    if (openBtn) {
        openBtn.onclick = function() {
            if (sidebar) {
                sidebar.classList.add('sidebar-open');
                backdrop.classList.add('active');
            }
        };
    }

    // Función unificada para cerrar
    const closeSidebar = () => {
        if (sidebar) {
            sidebar.classList.remove('sidebar-open');
            sidebar.classList.remove('sidebar-collapsed');
        }
        if (backdrop) {
            backdrop.classList.remove('active');
        }
    };

    // Asignar cierre a botón interno y al fondo oscuro
    if (closeBtn) closeBtn.onclick = closeSidebar;
    backdrop.onclick = closeSidebar;
}

// 2. HIGHLIGHT DE NAVEGACIÓN (Marca el link activo)
function setActiveSidebarLink() {
    const currentPath = window.location.pathname;
    const cleanPath = (currentPath.split('/').pop() || '').replace('.html', '');

    const sectionMap = {
        'dashboard': 'dashboard',
        'drivers': 'drivers',
        'driver-detail': 'drivers',
        'add-driver': 'drivers',
        'driver-documents': 'drivers',
        'loads': 'loads',
        'add-loads': 'loads',
        'load-detail': 'loads',
        'compliance': 'compliance',
        'settlements': 'settlements',
        'documents': 'documents',
        'settings': 'settings'
    };

    let section = 'dashboard'; // Default
    if (cleanPath && cleanPath !== 'index') {
        section = sectionMap[cleanPath] || cleanPath;
    }

    // Limpiar estados previos
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    // Activar link correspondiente
    const activeLink = document.querySelector(`.sidebar-link[data-route="${section}"]`);
    if (activeLink) {
        const parentItem = activeLink.closest('.nav-item');
        if (parentItem) parentItem.classList.add('active');
    }
}

// 3. UTILIDADES Y REDIRECCIONES
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Redirección de seguridad para index
if (window.location.pathname.endsWith('/index.html') || window.location.pathname === '/') {
    window.location.replace('login.html');
}

// 4. INICIALIZACIÓN AL CARGAR EL DOM
document.addEventListener('DOMContentLoaded', () => {
    // Manejo del Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            
            if (!emailInput?.value || !passwordInput?.value) {
                alert('Please complete all fields');
                return;
            }
            window.location.href = 'dashboard.html';
        });
    }

    // Si la sidebar YA está en el HTML (no cargada por fetch), inicializar aquí
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        setupSidebarToggle();
        setActiveSidebarLink();
    }
});