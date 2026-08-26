// ============================================================
// TYRES PAGE
// ============================================================

function renderTyres() {
    const container = document.getElementById('page-TYRES');
    const q = (document.getElementById('tyreSearch')?.value || '').toLowerCase();
    const status = document.getElementById('tyreStatusFilter')?.value || 'all';
    const sort = document.getElementById('tyreSort')?.value || 'sn-asc';
    
    const filtered = tyres.filter(t => {
        if (t.deleted) return false;
        const okS = status === 'all' || t.status === status;
        const okQ = !q || [t.sn, t.brand, t.equip].some(x => x.toLowerCase().includes(q));
        return okS && okQ;
    });

    filtered.sort((a, b) => {
        switch (sort) {
            case 'sn-desc': return b.sn.localeCompare(a.sn);
            case 'newest': return (b.createdAt || 0) - (a.createdAt || 0);
            case 'oldest': return (a.createdAt || 0) - (b.createdAt || 0);
            case 'sn-asc':
            default: return a.sn.localeCompare(b.sn);
        }
    });

    container.innerHTML = `
        <div class="space-y-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-slate-900">Tyres</h2>
                    <p class="text-sm text-slate-500">All registered tyres across the fleet</p>
                </div>
                ${canManageTyres() ? `
                <button onclick="openTyreModal()" class="rounded-md bg-[#3d3c41] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90">
                    + Register New Tyre
                </button>
                ` : ''}
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="mb-4 flex flex-col gap-2 sm:flex-row">
                    <input id="tyreSearch" oninput="filterTyres()" value="${escapeHtml(q)}" placeholder="Search serial, brand, equipment" class="input-field flex-1" />
                    <select id="tyreStatusFilter" onchange="filterTyres()" class="input-field w-full sm:w-44 shrink-0">
                        <option value="all" ${status === 'all' ? 'selected' : ''}>All Status</option>
                        <option value="active" ${status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="warning" ${status === 'warning' ? 'selected' : ''}>Warning</option>
                        <option value="critical" ${status === 'critical' ? 'selected' : ''}>Critical</option>
                        <option value="reserve" ${status === 'reserve' ? 'selected' : ''}>Reserve</option>
                        <option value="terminated" ${status === 'terminated' ? 'selected' : ''}>Terminated</option>
                    </select>
                    <select id="tyreSort" onchange="filterTyres()" class="input-field w-full sm:w-44 shrink-0">
                        <option value="sn-asc" ${sort === 'sn-asc' ? 'selected' : ''}>Serial (A–Z)</option>
                        <option value="sn-desc" ${sort === 'sn-desc' ? 'selected' : ''}>Serial (Z–A)</option>
                        <option value="newest" ${sort === 'newest' ? 'selected' : ''}>Newest First</option>
                        <option value="oldest" ${sort === 'oldest' ? 'selected' : ''}>Oldest First</option>
                    </select>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead>
                            <tr class="text-left text-xs uppercase text-slate-500">
                                <th class="px-3 py-2 font-semibold">Serial No.</th>
                                <th class="px-3 py-2 font-semibold">Brand / Size</th>
                                <th class="px-3 py-2 font-semibold">Equipment</th>
                                <th class="px-3 py-2 font-semibold">Position</th>
                                <th class="px-3 py-2 font-semibold">Tread (mm)</th>
                                <th class="px-3 py-2 font-semibold">Pressure (psi)</th>
                                <th class="px-3 py-2 font-semibold">Load Index</th>
                                <th class="px-3 py-2 font-semibold">Status</th>
                                <th class="px-3 py-2 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${filtered.length === 0 ? `
                                <tr><td colspan="9" class="py-8 text-center text-sm text-slate-500">No tyres match your filters.</td></tr>
                            ` : filtered.map(t => `
                                <tr class="hover:bg-slate-50">
                                    <td class="px-3 py-3 font-mono font-semibold">${escapeHtml(t.sn)}</td>
                                    <td class="px-3 py-3">${escapeHtml(t.brand)}<div class="text-xs text-slate-500">${escapeHtml(t.size)}</div></td>
                                    <td class="px-3 py-3">${escapeHtml(t.equip)}</td>
                                    <td class="px-3 py-3">${escapeHtml(t.pos)}</td>
                                    <td class="px-3 py-3">${escapeHtml(t.tread)}</td>
                                    <td class="px-3 py-3">${escapeHtml(t.pressure || '—')}</td>
                                    <td class="px-3 py-3">${escapeHtml(t.loadIndex || '—')}</td>
                                    <td class="px-3 py-3"><span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyle(t.status)}">${t.status}</span></td>
                                    <td class="px-3 py-3">
                                        <div class="flex gap-2">
                                            <button onclick="openTyreView('${t.sn}')" class="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">View</button>
                                            ${t.status !== 'terminated' && canManageTyres() ? `<button onclick="editTyre('${t.sn}')" class="rounded-md bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-200">Edit</button>` : ''}
                                            ${t.status !== 'terminated' && canTerminateTyres() ? `<button onclick="openTerminateForm('${t.sn}')" class="rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100" title="Terminate this tyre">Terminate</button>` : ''}
                                            ${canDeleteRecords() ? `<button onclick="deleteTyre('${t.sn}')" class="rounded-md bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-200">Delete</button>` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // The whole page's HTML is rebuilt on every keystroke (see q/status above),
    // which destroys and recreates the search input, dropping focus. Restore
    // focus and cursor position so typing isn't interrupted.
    if (tyreSearchWasFocused) {
        const searchInput = document.getElementById('tyreSearch');
        if (searchInput) {
            searchInput.focus();
            const pos = searchInput.value.length;
            searchInput.setSelectionRange(pos, pos);
        }
    }
}

let tyreSearchWasFocused = false;

function filterTyres() {
    tyreSearchWasFocused = document.activeElement && document.activeElement.id === 'tyreSearch';
    renderTyres();
}

function editTyre(sn) {
    if (!canManageTyres()) { showToast('Only a Manager, Supervisor, or Administrator can edit tyres'); return; }
    openTyreModal(sn);
}

function deleteTyre(sn) {
    if (!canDeleteRecords()) { showToast('Only a Manager or Administrator can delete tyres'); return; }
    showConfirm('Delete ' + sn + '? it cannot be retrieved.', () => {
        tyres = tyres.map(t => t.sn === sn ? { ...t, deleted: true } : t);
        saveData();
        renderTyres();
        renderEquipment();
        renderProfile();
        renderDashboard();
        updateNotifications();
        showToast('Tyre ' + sn + ' moved to deleted');
        logActivity(`Tyre ${sn} deleted`, 'red');
    });
}