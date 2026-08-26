// ============================================================
// EQUIPMENT PAGE
// ============================================================

// Maps each equipment type to a distinct icon (as inner SVG markup) so
// users can tell equipment apart at a glance from the card grid alone,
// without reading the type label. Falls back to a generic asset icon
// for any type not in this list (e.g. future custom types).
const EQUIP_TYPE_ICONS = {
    'Tractor': `
        <path d="M10 17h4V5H2v12h3"/>
        <path d="M20 17h2v-4l-3-4h-5v8h2"/>
        <circle cx="7.5" cy="17.5" r="2.5"/>
        <circle cx="17.5" cy="17.5" r="2.5"/>
    `,
    'Trailer': `
        <rect x="1" y="8" width="21" height="6" rx="1"/>
        <path d="M1 11h21"/>
        <circle cx="6" cy="18" r="2"/>
        <circle cx="18" cy="18" r="2"/>
    `,
    'MHC': `
        <circle cx="6" cy="19" r="2"/>
        <circle cx="13" cy="19" r="2"/>
        <path d="M6 19V4"/>
        <path d="M6 4l15 5"/>
        <path d="M21 9v4"/>
        <path d="M21 13a1.5 1.5 0 1 1-1.5 1.5"/>
    `,
    'Forklift': `
        <rect x="2" y="10" width="9" height="7" rx="1"/>
        <path d="M13 4v13"/>
        <path d="M16 4v13"/>
        <path d="M13 17h8"/>
        <circle cx="6" cy="19" r="2"/>
        <circle cx="15" cy="19" r="2"/>
    `,
    'Empty Handler': `
        <rect x="2" y="10" width="9" height="7" rx="1"/>
        <path d="M13 4v13"/>
        <path d="M16 4v13"/>
        <rect x="12.5" y="3" width="8" height="3.5" rx="0.5"/>
        <circle cx="6" cy="19" r="2"/>
        <circle cx="15" cy="19" r="2"/>
    `,
    'Reach Stacker': `
        <rect x="1" y="13" width="10" height="6" rx="1"/>
        <path d="M10 14l11-8"/>
        <rect x="16.5" y="2.5" width="6" height="5" rx="0.5"/>
        <circle cx="5" cy="21" r="2"/>
        <circle cx="10" cy="21" r="2"/>
    `,
    'Light Vehicles': `
        <path d="M6 11l1.5-5h9L18 11"/>
        <rect x="2.5" y="11" width="19" height="5" rx="1.5"/>
        <circle cx="7.5" cy="18.5" r="2"/>
        <circle cx="16.5" cy="18.5" r="2"/>
    `,
    'Crane': `
        <path d="M5 21V4"/>
        <path d="M2 4h6"/>
        <path d="M5 4h17"/>
        <path d="M19 4v6"/>
        <path d="M19 10a1.5 1.5 0 1 1-1.5 1.5"/>
    `,
    'Truck': `
        <rect x="1.5" y="11" width="7" height="6" rx="1"/>
        <rect x="8.5" y="6" width="13" height="11" rx="1"/>
        <circle cx="6" cy="19" r="2"/>
        <circle cx="17" cy="19" r="2"/>
    `,
    'Other': `
        <path d="M3 7.5 12 3l9 4.5"/>
        <path d="M3 7.5v9L12 21l9-4.5v-9"/>
        <path d="M3 7.5 12 12l9-4.5"/>
        <path d="M12 12v9"/>
    `
};

function equipTypeIcon(type) {
    const inner = EQUIP_TYPE_ICONS[type] || EQUIP_TYPE_ICONS['Other'];
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

function renderEquipment() {
    const container = document.getElementById('page-EQUIPMENT');
    const q = (document.getElementById('equipSearch')?.value || '').toLowerCase();
    const sort = document.getElementById('equipSort')?.value || 'id-asc';
    const active = equipment.filter(e => {
        if (e.deleted) return false;
        if (!q) return true;
        return [e.id, e.type].some(x => String(x).toLowerCase().includes(q));
    });

    active.sort((a, b) => {
        switch (sort) {
            case 'id-desc': return b.id.localeCompare(a.id);
            case 'newest': return (b.createdAt || 0) - (a.createdAt || 0);
            case 'oldest': return (a.createdAt || 0) - (b.createdAt || 0);
            case 'type-asc': return a.type.localeCompare(b.type) || a.id.localeCompare(b.id);
            case 'type-desc': return b.type.localeCompare(a.type) || a.id.localeCompare(b.id);
            case 'id-asc':
            default: return a.id.localeCompare(b.id);
        }
    });

    container.innerHTML = `
        <div class="space-y-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-slate-900">Equipment</h2>
                    <p class="text-sm text-slate-500">All registered assets and their tyre configurations</p>
                </div>
                ${canManageEquipment() ? `
                <button onclick="openEquipModal()" class="rounded-md bg-[#3d3c41] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90">
                    + Register Equipment
                </button>
                ` : ''}
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div class="flex flex-col gap-2 sm:flex-row">
                    <input id="equipSearch" oninput="filterEquipment()" value="${escapeHtml(q)}" placeholder="Search Object ID or type" class="input-field flex-1" />
                    <select id="equipSort" onchange="filterEquipment()" class="input-field w-full sm:w-44 shrink-0">
                        <option value="id-asc" ${sort === 'id-asc' ? 'selected' : ''}>Object ID (A–Z)</option>
                        <option value="id-desc" ${sort === 'id-desc' ? 'selected' : ''}>Object ID (Z–A)</option>
                        <option value="type-asc" ${sort === 'type-asc' ? 'selected' : ''}>Object Type (A–Z)</option>
                        <option value="type-desc" ${sort === 'type-desc' ? 'selected' : ''}>Object Type (Z–A)</option>
                        <option value="newest" ${sort === 'newest' ? 'selected' : ''}>Newest First</option>
                        <option value="oldest" ${sort === 'oldest' ? 'selected' : ''}>Oldest First</option>
                    </select>
                </div>
            </div>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                ${active.length === 0 ? `
                    <div class="col-span-full py-8 text-center text-sm text-slate-500">${q ? 'No equipment matches your search.' : 'No equipment registered.'}</div>
                ` : active.map(e => {
                    const assigned = tyres.filter(t => t.equip === e.id && !t.deleted).length;
                    const registeredAt = e.createdAt
                        ? (typeof formatActivityTimestamp === 'function' ? formatActivityTimestamp(e.createdAt) : new Date(e.createdAt).toLocaleString())
                        : '—';
                    return `
                        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div class="flex items-start justify-between">
                                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-orange-400">
                                    ${equipTypeIcon(e.type)}
                                </div>
                                <span class="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Operational</span>
                            </div>
                            <div class="mt-3 text-sm font-bold text-slate-900">${escapeHtml(e.id)}</div>
                            <div class="text-xs text-slate-500">${escapeHtml(e.type)} · Registered ${registeredAt}</div>
                            ${e.description ? `<div class="mt-2 text-xs text-slate-500 italic">${escapeHtml(e.description)}</div>` : ''}
                            <div class="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                                <span>Tyre slots</span><span class="font-semibold text-slate-900">${e.tyres}</span>
                            </div>
                            <div class="mt-1 flex items-center justify-between text-xs text-slate-500">
                                <span>Tyres assigned</span><span class="font-semibold text-slate-900">${assigned}</span>
                            </div>
                            <div class="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                                <button onclick="openEquipView('${e.id}')" class="flex-1 rounded-md border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100">View</button>
                                ${canManageEquipment() ? `
                                <button onclick="editEquip('${e.id}')" class="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Edit</button>
                                <button onclick="deleteEquip('${e.id}')" class="flex-1 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    if (equipSearchWasFocused) {
        const searchInput = document.getElementById('equipSearch');
        if (searchInput) {
            searchInput.focus();
            const pos = searchInput.value.length;
            searchInput.setSelectionRange(pos, pos);
        }
    }
}

let equipSearchWasFocused = false;

function filterEquipment() {
    equipSearchWasFocused = document.activeElement && document.activeElement.id === 'equipSearch';
    renderEquipment();
}

function editEquip(id) {
    openEquipModal(id);
}

function deleteEquip(id) {
    if (!canManageEquipment()) { showToast('Only a Manager or Administrator can delete equipment'); return; }
    showConfirm('Delete equipment ' + id + '? Tyres assigned will be unassigned. You can restore it later from Profile.', () => {
        equipment = equipment.map(e => e.id === id ? { ...e, deleted: true } : e);
        tyres = tyres.map(t => t.equip === id ? { ...t, equip: '—', pos: '—' } : t);
        saveData();
        renderEquipment();
        renderTyres();
        renderProfile();
        renderDashboard();
        updateNotifications();
        showToast('Equipment ' + id + ' moved to deleted');
        logActivity(`Equipment ${id} deleted`, 'red');
    });
}