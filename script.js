const money = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
fetch('data.json').then(r=>r.json()).then(data=>{
document.getElementById('activeLoads').textContent=data.summary.activeLoads;
document.getElementById('complianceAlerts').textContent=data.summary.complianceAlerts;
document.getElementById('incidentsThisWeek').textContent=data.summary.incidentsThisWeek;
document.getElementById('revenueAtRisk').textContent=money(data.summary.revenueAtRisk);
document.getElementById('mtdSavings').textContent=money(data.summary.mtdSavings);
document.getElementById('weeklySavings').textContent=money(data.summary.weeklySavings);
document.getElementById('annualSavings').textContent=money(data.summary.annualSavings);
const tbody=document.querySelector('#loadsTable tbody');
data.loads.forEach(load=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${load.loadId}</td><td>${load.driver}</td><td>${load.status}</td><td>${money(load.riskExposure)}</td><td>${money(load.netOutcome)}</td><td>${money(load.savings)}</td>`;tbody.appendChild(tr);});
const blockedSet=new Set(['DRV-004','DRV-009']);
const grid=document.getElementById('driversGrid');
data.drivers.forEach(driver=>{const card=document.createElement('div');card.className='driver';const initials=driver.name.split(' ').map(s=>s[0]).join('').slice(0,2);const blocked=blockedSet.has(driver.driverId);const score=blocked?76:92;const status=blocked?'🔴 Blocked':'🟢 Cleared';const detail=blocked?'Reason: Tire failure + seal issue':'Last Pre-Trip: Completed';const tier=score>=90?'Elite':'At Risk';card.innerHTML=`<img src="${driver.photo}" alt="${driver.name}" onerror="this.outerHTML='<div class=avatar>${initials}</div>'"><strong>${driver.name}</strong><div>${driver.driverId}</div><div style="margin-top:6px;color:${blocked ? '#b91c1c' : '#047857'};font-weight:700;">${status}</div><div style="font-size:.9rem;color:#6b7280;">${detail}</div><div style="margin-top:8px;font-weight:700;">Score: ${score}/100</div><div style="font-size:.9rem;color:${score >= 90 ? '#047857' : '#b91c1c'};">Tier: ${tier}</div>`;grid.appendChild(card);});});