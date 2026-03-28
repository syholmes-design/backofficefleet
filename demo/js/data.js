async function loadDashboardMetrics() {
    const response = await fetch('data/demo-data.json');
    const data = await response.json();

    // Metrics
    // Card 1: Total de conductores
    document.querySelector('.metric-card:nth-child(1) .metric-number').innerText = data.drivers.length;

    // Card 2: Total de cargas
    document.querySelector('.metric-card:nth-child(2) .metric-number').innerText = data.loads.length;

    // Card 3: Total de alertas de compliance (ejemplo: conductores con documentos vencidos o por vencer)
    // Consideramos alerta si el cldExpiration o medCardExpiration es pasado o está vacío
    const today = new Date();
    const complianceAlerts = data.drivers.filter(driver => {
        let alert = false;
        if (driver.cldExpiration) {
            const cldDate = new Date(driver.cldExpiration);
            if (isNaN(cldDate) || cldDate < today) alert = true;
        } else {
            alert = true;
        }
        if (driver.medCardExpiration) {
            const medDate = new Date(driver.medCardExpiration);
            if (isNaN(medDate) || medDate < today) alert = true;
        } else {
            alert = true;
        }
        return alert;
    }).length;
    document.querySelector('.metric-card:nth-child(3) .metric-number').innerText = complianceAlerts;

    // Card 4: Settlements pendientes
    const pendingSettlements = data.settlements.filter(s => s.status && s.status.toLowerCase() === 'pending').length;
    document.querySelector('.metric-card:nth-child(4) .metric-number').innerText = pendingSettlements;

    // Recent Compliance Alerts table (drivers with extra columns)
    const alertsBox = document.querySelectorAll('.data-list-box')[0];
    alertsBox.innerHTML = '';
    data.drivers.forEach(driver => {
        const truck = data.fleet.find(t => t.id === driver.truckId);
        const row = document.createElement('div');
        row.className = 'data-row';
        row.innerHTML = `
            <img src="${driver.photo}" alt="${driver.name}" class="row-avatar">
            <div class="row-info">
                <strong>${driver.name}</strong>
                <p>ID: ${driver.id}</p>
                <p>Status: ${driver.status}</p>
                <p>Truck: ${truck ? truck.name : 'N/A'}</p>
            </div>
            <span class="badge badge-high">• High</span>
        `;
        alertsBox.appendChild(row);
    });

    // Active Loads table (with extra columns)
    const loadsBox = document.querySelectorAll('.data-list-box')[1];
    loadsBox.innerHTML = '';
    data.loads.forEach(load => {
        const driver = data.drivers.find(d => d.truckId === load.truckId);
        const truck = data.fleet.find(t => t.id === load.truckId);
        const row = document.createElement('div');
        row.className = 'data-row';
        row.innerHTML = `
            <div class="row-info">
                <div class="row-title">
                    <strong>${load.id}</strong>
                    <span class="status-tag transit">${load.status}</span>
                </div>
                <p>${load.origin} → ${load.destination}</p>
                <p>Driver: ${driver ? driver.name : 'N/A'} (ID: ${driver ? driver.id : 'N/A'})</p>
                <p>Truck: ${truck ? truck.name : 'N/A'} (ID: ${truck ? truck.id : 'N/A'})</p>
            </div>
            <span class="price">$${(Math.random()*5000+2000).toFixed(0)}</span>
        `;
        loadsBox.appendChild(row);
    });
}

// Run on page load
if (window.location.pathname.includes('dashboard')) {
  loadDashboardMetrics();
}