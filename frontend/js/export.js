function csvEscape(value) {
    const str = value == null ? '' : String(value);
    if (/[",\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function downloadCSV(filename, headers, rows) {
    const lines = [headers.map(csvEscape).join(',')];
    rows.forEach(row => lines.push(row.map(csvEscape).join(',')));
    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded ' + filename);
}

function exportInspections() {
    const active = inspections.filter(i => !i.deleted);
    if (active.length === 0) { showToast('No inspections to export'); return; }
    downloadCSV(
        'inspection-report.csv',
        ['Date', 'Asset', 'Tyres Inspected', 'Odometer (km)', 'Inspector', 'Result', 'Notes'],
        active.map(i => [i.date, i.asset, i.count, i.odo, i.inspector, i.result, i.notes || ''])
    );
}

function exportTyreInventory() {
    const active = tyres.filter(t => !t.deleted);
    if (active.length === 0) { showToast('No tyres to export'); return; }
    downloadCSV(
        'tyre-inventory.csv',
        ['Serial Number', 'Brand', 'Size', 'Equipment', 'Position', 'Tread (mm)', 'Pressure (psi)', 'Load Index', 'Status', 'Mfg Week', 'Mfg Year', 'Date of Fitment', 'Odometer at Fitment', 'Inspector'],
        active.map(t => [t.sn, t.brand, t.size, t.equip, t.pos, t.tread, t.pressure, t.loadIndex, t.status, t.mfgWeek || '', t.mfgYear || '', t.fitmentDate || '', t.odoAtFitment || '', t.inspector || ''])
    );
}

function exportSwapHistory() {
    const swaps = activityLog.filter(a => a.message && a.message.includes('swapped'));
    if (swaps.length === 0) { showToast('No swap history to export'); return; }
    downloadCSV(
        'swap-history.csv',
        ['Timestamp', 'Event', 'Details'],
        swaps.map(a => [new Date(a.timestamp).toISOString(), a.message, a.meta || ''])
    );
}

function exportTerminatedTyres() {
    const terminated = tyres.filter(t => !t.deleted && t.status === 'terminated');
    if (terminated.length === 0) { showToast('No terminated tyres to export'); return; }
    downloadCSV(
        'terminated-tyres.csv',
        ['Serial Number', 'Brand', 'Size', 'Tread (mm)', 'Last Equipment', 'Inspector'],
        terminated.map(t => [t.sn, t.brand, t.size, t.tread, t.equip, t.inspector || ''])
    );
}

function exportFleetSummary() {
    const active = equipment.filter(e => !e.deleted);
    if (active.length === 0) { showToast('No equipment to export'); return; }
    downloadCSV(
        'fleet-summary.csv',
        ['Object ID', 'Object Type', 'Date Registered', 'Tyre Slots', 'Tyres Assigned', 'Description'],
        active.map(e => [e.id, e.type, e.createdAt ? new Date(e.createdAt).toISOString() : '', e.tyres, tyres.filter(t => !t.deleted && t.equip === e.id).length, e.description || ''])
    );
}

function exportUserAccounts() {
    if (!isCurrentUserAdmin()) { showToast('Only an administrator can export user accounts'); return; }
    const active = users.filter(u => !u.deleted);
    if (active.length === 0) { showToast('No users to export'); return; }
    downloadCSV(
        'user-accounts.csv',
        ['Name', 'Role', 'Department', 'Username', 'Admin', 'Status', 'Last Active'],
        active.map(u => [u.name, u.role, u.dept, u.username, u.isAdmin ? 'Yes' : 'No', u.status, u.last])
    );
}

function exportActivityLog() {
    if (!isCurrentUserAdmin()) { showToast('Only an administrator can export the activity log'); return; }
    if (activityLog.length === 0) { showToast('No activity to export'); return; }
    downloadCSV(
        'activity-log.csv',
        ['Timestamp', 'User', 'Message', 'Details'],
        [...activityLog].sort((a, b) => b.timestamp - a.timestamp).map(a => [new Date(a.timestamp).toISOString(), a.user || 'Unknown', a.message, a.meta || ''])
    );
}

function exportDeletedTyres() {
    if (!isCurrentUserAdmin()) { showToast('Only an administrator can export deleted tyres'); return; }
    const deleted = tyres.filter(t => t.deleted);
    if (deleted.length === 0) { showToast('No deleted tyres to export'); return; }
    downloadCSV(
        'deleted-tyres.csv',
        ['Serial Number', 'Brand', 'Size', 'Last Equipment', 'Last Position', 'Tread (mm)', 'Pressure (psi)', 'Load Index', 'Status', 'Mfg Week', 'Mfg Year', 'Date of Fitment', 'Odometer at Fitment', 'Inspector'],
        deleted.map(t => [t.sn, t.brand, t.size, t.equip, t.pos, t.tread, t.pressure, t.loadIndex, t.status, t.mfgWeek || '', t.mfgYear || '', t.fitmentDate || '', t.odoAtFitment || '', t.inspector || ''])
    );
}

function exportDeletedEquipment() {
    if (!isCurrentUserAdmin()) { showToast('Only an administrator can export deleted equipment'); return; }
    const deleted = equipment.filter(e => e.deleted);
    if (deleted.length === 0) { showToast('No deleted equipment to export'); return; }
    downloadCSV(
        'deleted-equipment.csv',
        ['Object ID', 'Object Type', 'Date Registered', 'Tyre Slots', 'Description'],
        deleted.map(e => [e.id, e.type, e.createdAt ? new Date(e.createdAt).toISOString() : '', e.tyres, e.description || ''])
    );
}

function exportDeletedInspections() {
    if (!isCurrentUserAdmin()) { showToast('Only an administrator can export deleted inspections'); return; }
    const deleted = inspections.filter(i => i.deleted);
    if (deleted.length === 0) { showToast('No deleted inspections to export'); return; }
    downloadCSV(
        'deleted-inspections.csv',
        ['Date', 'Asset', 'Tyres Inspected', 'Odometer (km)', 'Inspector', 'Result', 'Notes'],
        deleted.map(i => [i.date, i.asset, i.count, i.odo, i.inspector, i.result, i.notes || ''])
    );
}

function exportDeletedUsers() {
    if (!isCurrentUserAdmin()) { showToast('Only an administrator can export deleted users'); return; }
    const deleted = users.filter(u => u.deleted);
    if (deleted.length === 0) { showToast('No deleted users to export'); return; }
    downloadCSV(
        'deleted-users.csv',
        ['Name', 'Role', 'Department', 'Username', 'Admin', 'Status', 'Last Active'],
        deleted.map(u => [u.name, u.role, u.dept, u.username, u.isAdmin ? 'Yes' : 'No', u.status, u.last])
    );
}

function exportAnalyticsReport() {
    const activeTyres = tyres.filter(t => !t.deleted);
    const activeEquip = equipment.filter(e => !e.deleted);
    const activeInsp = inspections.filter(i => !i.deleted);

    const treadValues = activeTyres.map(t => parseFloat(t.tread)).filter(n => !isNaN(n));
    const avgTread = treadValues.length ? (treadValues.reduce((s, n) => s + n, 0) / treadValues.length).toFixed(1) : '—';
    const criticalCount = activeTyres.filter(t => t.status === 'critical').length;

    const typeStats = {};
    activeEquip.forEach(e => { if (!typeStats[e.type]) typeStats[e.type] = { total: 0, alert: 0 }; });
    activeTyres.forEach(t => {
        const e = activeEquip.find(x => x.id === t.equip);
        if (!e) return;
        typeStats[e.type].total++;
        if (t.status === 'warning' || t.status === 'critical') typeStats[e.type].alert++;
    });
    const typeRows = Object.entries(typeStats)
        .filter(([, v]) => v.total > 0)
        .map(([type, v]) => `<tr><td>${escapeHtml(type)}</td><td>${v.alert}/${v.total}</td><td>${Math.round((v.alert / v.total) * 100)}%</td></tr>`)
        .join('');

    const win = window.open('', '_blank');
    if (!win) { showToast('Please allow popups to generate the report'); return; }
    win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Fleet Analytics Report — ${new Date().toLocaleDateString()}</title>
            <style>
                body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; padding: 40px; color: #0f172a; }
                h1 { font-size: 22px; margin-bottom: 4px; }
                .sub { color: #64748b; font-size: 13px; margin-bottom: 24px; }
                .stats { display: flex; gap: 16px; margin-bottom: 24px; }
                .stat { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; flex: 1; }
                .stat .label { font-size: 11px; text-transform: uppercase; color: #64748b; }
                .stat .value { font-size: 22px; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
                th { text-transform: uppercase; font-size: 11px; color: #64748b; }
                h2 { font-size: 15px; margin-top: 28px; }
            </style>
        </head>
        <body>
            <h1>APM Terminals Onne — Fleet Analytics Report</h1>
            <div class="sub">Generated ${new Date().toLocaleString()}</div>
            <div class="stats">
                <div class="stat"><div class="label">Avg Tread Depth</div><div class="value">${avgTread} mm</div></div>
                <div class="stat"><div class="label">Critical Tyres</div><div class="value">${criticalCount}</div></div>
                <div class="stat"><div class="label">Inspections Logged</div><div class="value">${activeInsp.length}</div></div>
                <div class="stat"><div class="label">Active Tyres</div><div class="value">${activeTyres.length}</div></div>
            </div>
            <h2>Alerts by Asset Type</h2>
            <table>
                <thead><tr><th>Object Type</th><th>Tyres in Alert</th><th>% of Type</th></tr></thead>
                <tbody>${typeRows || '<tr><td colspan="3">No equipment with tyres assigned yet.</td></tr>'}</tbody>
            </table>
        </body>
        </html>
    `);
    win.document.close();
    win.focus();
    win.print();
}

function renderExport() {
    const container = document.getElementById('page-EXPORT');
    const isAdmin = isCurrentUserAdmin();

    // Export is not available to view-only (Internal User) accounts —
    // same reasoning as Users being admin-only: don't build the actual
    // content into the DOM for someone who shouldn't have it, even if
    // nav already keeps them from clicking their way there normally.
    if (!isAdmin && currentUserRole() === 'Internal User') {
        container.innerHTML = `
            <div class="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div class="text-sm font-semibold text-slate-700">Restricted</div>
                <div class="mt-1 text-xs text-slate-500">Export is not available for view-only accounts.</div>
            </div>
        `;
        return;
    }

    const items = [
        { t: 'Inspection Report', f: 'CSV', desc: (inspections.filter(i => !i.deleted).length) + ' inspection(s)', action: 'exportInspections' },
        { t: 'Tyre Inventory', f: 'CSV', desc: (tyres.filter(t => !t.deleted).length) + ' tyre(s)', action: 'exportTyreInventory' },
        { t: 'Swap History', f: 'CSV', desc: (activityLog.filter(a => a.message && a.message.includes('swapped')).length) + ' swap event(s)', action: 'exportSwapHistory' },
        { t: 'Terminated Tyres', f: 'CSV', desc: (tyres.filter(t => !t.deleted && t.status === 'terminated').length) + ' terminated tyre(s)', action: 'exportTerminatedTyres' },
        { t: 'Fleet Summary', f: 'CSV', desc: (equipment.filter(e => !e.deleted).length) + ' equipment record(s)', action: 'exportFleetSummary' },
        { t: 'Analytics Report', f: 'PDF', desc: 'Opens a printable summary — use your browser\'s Print to save as PDF', action: 'exportAnalyticsReport' },
        ...(isAdmin ? [
            { t: 'User Accounts', f: 'CSV', desc: (users.filter(u => !u.deleted).length) + ' user account(s) — admin only', action: 'exportUserAccounts' },
            { t: 'Activity Log', f: 'CSV', desc: activityLog.length + ' logged event(s) — admin only', action: 'exportActivityLog' },
            { t: 'Deleted Tyres', f: 'CSV', desc: (tyres.filter(t => t.deleted).length) + ' deleted tyre(s) — admin only', action: 'exportDeletedTyres' },
            { t: 'Deleted Equipment', f: 'CSV', desc: (equipment.filter(e => e.deleted).length) + ' deleted equipment record(s) — admin only', action: 'exportDeletedEquipment' },
            { t: 'Deleted Inspections', f: 'CSV', desc: (inspections.filter(i => i.deleted).length) + ' deleted inspection(s) — admin only', action: 'exportDeletedInspections' },
            { t: 'Deleted Users', f: 'CSV', desc: (users.filter(u => u.deleted).length) + ' deleted user(s) — admin only', action: 'exportDeletedUsers' }
        ] : [])
    ];

    container.innerHTML = `
        <div class="space-y-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-slate-900">Export</h2>
                    <p class="text-sm text-slate-500">Download real system data for offline use</p>
                </div>
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                ${items.map(i => `
                    <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-orange-400">📄</div>
                        <div class="mt-3 font-bold">${escapeHtml(i.t)}</div>
                        <div class="text-xs text-slate-500">${escapeHtml(i.desc)}</div>
                        <button onclick="${i.action}()" class="mt-4 w-full rounded-md bg-[#3d3c41] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                            Download ${i.f}
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}