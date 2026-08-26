let adminPeriod = 'monthly';

function setAdminPeriod(period) {
    adminPeriod = period;
    renderAdmin();
}

let adminActionRegistry = {};

function runAdminAction(key) {
    const fn = adminActionRegistry[key];
    if (fn) fn();
}

// Soft-deletes every active non-admin user in one action, so only
// administrator account(s) remain active. Uses the same soft-delete
// pattern as deleteUser() — nothing is lost, and each account can still
// be restored individually from the Deleted Users tab below if needed.
async function removeAllNonAdminUsers() {
    if (!isCurrentUserAdmin()) { showToast('Only an administrator can manage users'); return; }
    const targets = users.filter(u => !u.deleted && !u.isAdmin);
    if (targets.length === 0) { showToast('No non-admin users to remove'); return; }
    showConfirm(
        `This will move ${targets.length} non-admin user account${targets.length === 1 ? '' : 's'} to deleted, leaving only administrator${users.filter(u => !u.deleted && u.isAdmin).length === 1 ? '' : 's'} active. You can restore any of them individually from the Deleted Users tab below.`,
        async () => {
            try {
                await Promise.all(targets.map(u => api.updateUserFields(u.username, { deleted: true })));
            } catch (err) {
                showToast('Could not remove all non-admin users: ' + err.message);
                await loadData(); // some may have succeeded before the failure — resync with what's actually stored
                renderAdmin();
                return;
            }
            users = users.map(u => (!u.deleted && !u.isAdmin) ? { ...u, deleted: true } : u);
            renderAdmin();
            if (typeof renderUsers === 'function') renderUsers();
            renderProfile();
            showToast('Removed ' + targets.length + ' non-admin user' + (targets.length === 1 ? '' : 's'));
            logActivity(`${targets.length} non-admin user${targets.length === 1 ? '' : 's'} removed`, 'red');
        },
        { title: 'Remove all non-admin users?', confirmLabel: 'Remove' }
    );
}
// ============================================================
// DROPDOWN LISTS — admin-editable, no code changes needed
// ============================================================
// Backed by app_state.config_lists in Supabase (see supabase/migrations/
// 0002_config_lists.sql), which has a database trigger that rejects
// changes to this column from anyone who isn't an admin — this
// isCurrentUserAdmin() check is a UI convenience, not the real
// enforcement.

let currentDropdownListTab = 'tyreBrands';

function slugify(str) {
    return String(str).trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'item';
}

function currentConfigLists() {
    return {
        tyreBrands: TYRE_BRANDS,
        equipmentTypes: EQUIPMENT_TYPES,
        observationOptions: OBSERVATION_OPTIONS,
        actionTakenOptions: ACTION_TAKEN_OPTIONS
    };
}

async function saveConfigLists() {
    if (!isCurrentUserAdmin()) { showToast('Only an administrator can edit dropdown lists'); return; }
    const attempted = currentConfigLists();
    const ok = await saveData(attempted);
    if (!ok) {
        // The save failed server-side (e.g. migration 0002 hasn't been run
        // yet, or the admin check on the server disagreed) — re-fetch
        // what's actually stored rather than leaving the UI showing an
        // edit that was never really saved.
        await loadData();
    }
    renderAdmin();
}

function addTyreBrand() {
    const input = document.getElementById('newTyreBrand');
    const value = input.value.trim();
    if (!value) return;
    input.value = '';
    if (TYRE_BRANDS.some(b => b.toLowerCase() === value.toLowerCase())) { showToast('That brand already exists'); return; }
    TYRE_BRANDS = [...TYRE_BRANDS, value];
    pushActivityLocal(`Tyre brand "${value}" added`, 'emerald');
    saveConfigLists();
}
function removeTyreBrand(brand) {
    showConfirm(`Remove "${brand}" from Tyre Brands? Existing tyres already using it keep their value — this only affects the dropdown going forward.`, () => {
        TYRE_BRANDS = TYRE_BRANDS.filter(b => b !== brand);
        pushActivityLocal(`Tyre brand "${brand}" removed`, 'red');
        saveConfigLists();
    }, { title: 'Remove brand?', confirmLabel: 'Remove' });
}

function addEquipmentType() {
    const input = document.getElementById('newEquipmentType');
    const value = input.value.trim();
    if (!value) return;
    input.value = '';
    if (EQUIPMENT_TYPES.some(t => t.toLowerCase() === value.toLowerCase())) { showToast('That type already exists'); return; }
    EQUIPMENT_TYPES = [...EQUIPMENT_TYPES, value];
    pushActivityLocal(`Object type "${value}" added`, 'emerald');
    saveConfigLists();
}
function removeEquipmentType(type) {
    showConfirm(`Remove "${type}" from Object Types? Existing equipment already using it keep their value — this only affects the dropdown going forward. It'll also fall back to a generic icon on the Equipment page.`, () => {
        EQUIPMENT_TYPES = EQUIPMENT_TYPES.filter(t => t !== type);
        pushActivityLocal(`Object type "${type}" removed`, 'red');
        saveConfigLists();
    }, { title: 'Remove type?', confirmLabel: 'Remove' });
}

function addObservationOption() {
    const labelInput = document.getElementById('newObservationLabel');
    const severitySelect = document.getElementById('newObservationSeverity');
    const label = labelInput.value.trim();
    if (!label) return;
    labelInput.value = '';
    const value = slugify(label);
    if (OBSERVATION_OPTIONS.some(o => o.value === value)) { showToast('That observation already exists'); return; }
    OBSERVATION_OPTIONS = [...OBSERVATION_OPTIONS, { value, label, severity: severitySelect.value }];
    pushActivityLocal(`Observation option "${label}" added`, 'emerald');
    saveConfigLists();
}
function removeObservationOption(value) {
    const opt = OBSERVATION_OPTIONS.find(o => o.value === value);
    showConfirm(`Remove "${opt ? opt.label : value}" from Observation options? Past inspections that recorded it keep their record — this only affects the dropdown going forward.`, () => {
        OBSERVATION_OPTIONS = OBSERVATION_OPTIONS.filter(o => o.value !== value);
        pushActivityLocal(`Observation option removed`, 'red');
        saveConfigLists();
    }, { title: 'Remove observation option?', confirmLabel: 'Remove' });
}

function addActionTakenOption() {
    const labelInput = document.getElementById('newActionLabel');
    const label = labelInput.value.trim();
    if (!label) return;
    labelInput.value = '';
    const value = slugify(label);
    if (ACTION_TAKEN_OPTIONS.some(a => a.value === value)) { showToast('That action already exists'); return; }
    ACTION_TAKEN_OPTIONS = [...ACTION_TAKEN_OPTIONS, { value, label }];
    pushActivityLocal(`Action taken option "${label}" added`, 'emerald');
    saveConfigLists();
}
function removeActionTakenOption(value) {
    const opt = ACTION_TAKEN_OPTIONS.find(a => a.value === value);
    showConfirm(`Remove "${opt ? opt.label : value}" from Actions Taken? Past inspections that recorded it keep their record — this only affects the dropdown going forward.`, () => {
        ACTION_TAKEN_OPTIONS = ACTION_TAKEN_OPTIONS.filter(a => a.value !== value);
        pushActivityLocal(`Action taken option removed`, 'red');
        saveConfigLists();
    }, { title: 'Remove action?', confirmLabel: 'Remove' });
}

window.addTyreBrand = addTyreBrand;
window.removeTyreBrand = removeTyreBrand;
window.addEquipmentType = addEquipmentType;
window.removeEquipmentType = removeEquipmentType;
window.addObservationOption = addObservationOption;
window.removeObservationOption = removeObservationOption;
window.addActionTakenOption = addActionTakenOption;
window.removeActionTakenOption = removeActionTakenOption;

const SEVERITY_CHIP_CLASS = { good: 'bg-emerald-100 text-emerald-700', warning: 'bg-amber-100 text-amber-700', critical: 'bg-red-100 text-red-700' };

function renderChipList(items, onRemove) {
    if (items.length === 0) return `<div class="py-4 text-center text-xs text-slate-500">No items yet — add one below.</div>`;
    return `<div class="flex flex-wrap gap-2">${items.join('')}</div>`;
}

function switchDropdownListTab(tab) {
    if (!isCurrentUserAdmin()) return;
    currentDropdownListTab = tab;
    const tabs = document.querySelectorAll('#dropdownListTabs button');
    tabs.forEach(btn => {
        btn.style.color = btn.dataset.tab === tab ? '#e2694a' : '#64748b';
        btn.style.borderBottom = btn.dataset.tab === tab ? '2px solid #e2694a' : '2px solid transparent';
    });

    const container = document.getElementById('dropdownListContent');
    if (!container) return;

    if (tab === 'tyreBrands') {
        const chips = TYRE_BRANDS.map(b => `
            <span class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                ${escapeHtml(b)}
                <button onclick="removeTyreBrand('${escapeHtml(b).replace(/'/g, "\\'")}')" class="text-slate-400 hover:text-red-600" title="Remove">✕</button>
            </span>
        `);
        container.innerHTML = `
            ${renderChipList(chips)}
            <div class="mt-4 flex gap-2">
                <input id="newTyreBrand" class="input-field flex-1" placeholder="e.g. Hankook" onkeydown="if(event.key==='Enter') addTyreBrand()" />
                <button onclick="addTyreBrand()" class="rounded-md bg-[#3d3c41] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Add</button>
            </div>
        `;
    } else if (tab === 'equipmentTypes') {
        const chips = EQUIPMENT_TYPES.map(t => `
            <span class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                ${escapeHtml(t)}
                <button onclick="removeEquipmentType('${escapeHtml(t).replace(/'/g, "\\'")}')" class="text-slate-400 hover:text-red-600" title="Remove">✕</button>
            </span>
        `);
        container.innerHTML = `
            ${renderChipList(chips)}
            <div class="mt-4 flex gap-2">
                <input id="newEquipmentType" class="input-field flex-1" placeholder="e.g. Sweeper" onkeydown="if(event.key==='Enter') addEquipmentType()" />
                <button onclick="addEquipmentType()" class="rounded-md bg-[#3d3c41] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Add</button>
            </div>
            <p class="mt-2 text-[11px] text-slate-500">New types get a generic icon on the Equipment page until a matching icon is added in code — everything else (dropdowns, filtering, swap-target matching) works immediately.</p>
        `;
    } else if (tab === 'observationOptions') {
        const chips = OBSERVATION_OPTIONS.map(o => `
            <span class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${SEVERITY_CHIP_CLASS[o.severity] || SEVERITY_CHIP_CLASS.good}">
                ${escapeHtml(o.label)}
                <button onclick="removeObservationOption('${o.value}')" class="opacity-60 hover:opacity-100" title="Remove">✕</button>
            </span>
        `);
        container.innerHTML = `
            ${renderChipList(chips)}
            <div class="mt-4 flex flex-col gap-2 sm:flex-row">
                <input id="newObservationLabel" class="input-field flex-1" placeholder="e.g. Sidewall Bubble" onkeydown="if(event.key==='Enter') addObservationOption()" />
                <select id="newObservationSeverity" class="input-field sm:w-40">
                    <option value="good">Good</option>
                    <option value="warning" selected>Warning</option>
                    <option value="critical">Critical</option>
                </select>
                <button onclick="addObservationOption()" class="rounded-md bg-[#3d3c41] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 sm:shrink-0">Add</button>
            </div>
            <p class="mt-2 text-[11px] text-slate-500">Severity determines how this observation affects an inspection's overall result (Good / Warning / Critical) — pick the worst-case outcome this finding represents.</p>
        `;
    } else if (tab === 'actionTakenOptions') {
        const chips = ACTION_TAKEN_OPTIONS.map(a => `
            <span class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                ${escapeHtml(a.label)}
                <button onclick="removeActionTakenOption('${a.value}')" class="text-slate-400 hover:text-red-600" title="Remove">✕</button>
            </span>
        `);
        container.innerHTML = `
            ${renderChipList(chips)}
            <div class="mt-4 flex gap-2">
                <input id="newActionLabel" class="input-field flex-1" placeholder="e.g. Rebalance Wheel" onkeydown="if(event.key==='Enter') addActionTakenOption()" />
                <button onclick="addActionTakenOption()" class="rounded-md bg-[#3d3c41] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Add</button>
            </div>
        `;
    }
}
window.switchDropdownListTab = switchDropdownListTab;

function renderAdmin() {
    const container = document.getElementById('page-ADMIN');

    if (!isCurrentUserAdmin()) {
        container.innerHTML = `
            <div class="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div class="text-3xl">🔒</div>
                <div class="mt-3 text-lg font-bold text-slate-900">Admin Access Required</div>
                <p class="mt-1 text-sm text-slate-500">This page is only available to administrators.</p>
            </div>
        `;
        return;
    }

    const delTyres = tyres.filter(t => t.deleted).length;
    const delEquip = equipment.filter(e => e.deleted).length;
    const delInsp = inspections.filter(i => i.deleted).length;
    const delUsers = users.filter(u => u.deleted).length;
    const totalDel = delTyres + delEquip + delInsp + delUsers;
    const activeUsersList = users.filter(u => !u.deleted);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = startOfToday - 6 * 24 * 60 * 60 * 1000;
    const actionsToday = activityLog.filter(a => a.timestamp >= startOfToday).length;
    const actionsThisWeek = activityLog.filter(a => a.timestamp >= startOfWeek).length;

    const countsByUser = {};
    activityLog.forEach(a => { countsByUser[a.user || 'Unknown'] = (countsByUser[a.user || 'Unknown'] || 0) + 1; });
    const mostActive = Object.entries(countsByUser).sort((a, b) => b[1] - a[1])[0];

    const tyreDateItems = tyres.filter(t => !t.deleted && t.createdAt).map(t => ({ date: new Date(t.createdAt).toISOString().slice(0, 10), createdAt: t.createdAt }));
    const inspDateItems = inspections.filter(i => !i.deleted);
    const regGrouped = groupInspectionsByPeriod(tyreDateItems, adminPeriod);
    const inspGrouped = groupInspectionsByPeriod(inspDateItems, adminPeriod);

    const periodOptions = [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'yearly', label: 'Yearly' }
    ];

    const userBreakdown = activeUsersList.map(u => {
        const entries = activityLog.filter(a => a.user === u.name);
        return {
            name: u.name,
            total: entries.length,
            registered: entries.filter(a => /registered|created|logged for/i.test(a.message)).length,
            updated: entries.filter(a => /updated|swapped|installed/i.test(a.message)).length,
            deleted: entries.filter(a => /deleted|purged|terminated/i.test(a.message)).length
        };
    }).sort((a, b) => b.total - a.total);

    const dotClass = { emerald: 'bg-emerald-500', sky: 'bg-orange-500', amber: 'bg-amber-500', red: 'bg-red-500', slate: 'bg-slate-400' };
    const recent = [...activityLog].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

    container.innerHTML = `
        <div class="space-y-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-slate-900">Admin Dashboard</h2>
                    <p class="text-sm text-slate-500">Oversight of user activity, fleet trends, and deleted records</p>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <button onclick="removeAllNonAdminUsers()" class="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                        Remove Non-Admin Users
                    </button>
                    <span class="text-xs text-slate-500 font-medium">Trend period:</span>
                    <div class="flex rounded-md border border-slate-200 overflow-hidden bg-white">
                        ${periodOptions.map(p => `
                            <button onclick="setAdminPeriod('${p.value}')" class="px-3 py-1.5 text-xs font-semibold transition-colors ${adminPeriod === p.value ? 'bg-[#3d3c41] text-white' : 'text-slate-600 hover:bg-slate-50'}">${p.label}</button>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="text-xs uppercase text-slate-500">Total Users</div>
                    <div class="text-2xl font-bold text-slate-900">${activeUsersList.length}</div>
                </div>
                <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="text-xs uppercase text-slate-500">Actions Today</div>
                    <div class="text-2xl font-bold text-slate-900">${actionsToday}</div>
                </div>
                <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="text-xs uppercase text-slate-500">Actions This Week</div>
                    <div class="text-2xl font-bold text-slate-900">${actionsThisWeek}</div>
                </div>
                <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="text-xs uppercase text-slate-500">Most Active User</div>
                    <div class="truncate text-lg font-bold text-slate-900">${mostActive ? escapeHtml(mostActive[0]) : '—'}</div>
                    <div class="text-xs text-slate-500">${mostActive ? mostActive[1] + ' action' + (mostActive[1] === 1 ? '' : 's') : 'No activity yet'}</div>
                </div>
            </div>

            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 class="mb-3 text-sm font-semibold text-slate-900">Tyre Registrations (${adminPeriod})</h3>
                    <div class="h-48 w-full"><canvas id="admin-reg-chart"></canvas></div>
                </div>
                <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 class="mb-3 text-sm font-semibold text-slate-900">Inspections Logged (${adminPeriod})</h3>
                    <div class="h-48 w-full"><canvas id="admin-insp-chart"></canvas></div>
                </div>
            </div>

            <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 class="mb-3 text-sm font-semibold text-slate-900">Activity by User</h3>
                ${userBreakdown.length === 0 || userBreakdown.every(u => u.total === 0) ? `
                    <div class="py-6 text-center text-sm text-slate-500">No user activity recorded yet.</div>
                ` : `
                <div class="overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead>
                            <tr class="text-left text-xs uppercase text-slate-500">
                                <th class="px-3 py-2 font-semibold">User</th>
                                <th class="px-3 py-2 font-semibold">Registered</th>
                                <th class="px-3 py-2 font-semibold">Updated</th>
                                <th class="px-3 py-2 font-semibold">Deleted</th>
                                <th class="px-3 py-2 font-semibold">Total</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${userBreakdown.map(u => `
                                <tr class="hover:bg-slate-50">
                                    <td class="px-3 py-3 font-semibold">${escapeHtml(u.name)}</td>
                                    <td class="px-3 py-3">${u.registered}</td>
                                    <td class="px-3 py-3">${u.updated}</td>
                                    <td class="px-3 py-3">${u.deleted}</td>
                                    <td class="px-3 py-3 font-semibold">${u.total}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                `}
            </div>

            <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="mb-3 flex items-center justify-between">
                    <h3 class="text-sm font-semibold text-slate-900">Recent Activity</h3>
                    <button onclick="navigate('ACTIVITY')" class="text-xs font-semibold text-orange-600 hover:underline">View full log →</button>
                </div>
                ${recent.length === 0 ? `
                    <div class="py-6 text-center text-sm text-slate-500">No activity recorded yet.</div>
                ` : `
                <ul class="divide-y divide-slate-100">
                    ${recent.map(a => `
                        <li class="flex items-start gap-2.5 py-2.5">
                            <span class="mt-1 h-2 w-2 shrink-0 rounded-full ${dotClass[a.color] || dotClass.slate}"></span>
                            <div class="min-w-0 flex-1">
                                <div class="text-sm text-slate-700">${escapeHtml(a.message)}</div>
                                <div class="text-xs text-slate-500">${escapeHtml(a.user || 'Unknown')}${a.meta ? ' · ' + escapeHtml(a.meta) : ''}</div>
                            </div>
                            <div class="shrink-0 text-xs text-slate-400">${typeof formatActivityTimestamp === 'function' ? formatActivityTimestamp(a.timestamp) : new Date(a.timestamp).toLocaleString()}</div>
                        </li>
                    `).join('')}
                </ul>
                `}
            </div>

            <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="mb-3">
                    <div class="text-sm font-bold text-slate-900">Dropdown Lists</div>
                    <div class="text-xs text-slate-500">Add or remove the options shown in Tyre Brand, Object Type, and Inspection dropdowns across the app — no code changes needed. Changes apply for everyone immediately.</div>
                </div>
                <div class="mb-3 flex flex-wrap gap-1 border-b border-slate-100" id="dropdownListTabs">
                    <button class="px-3 py-2 text-xs font-semibold text-orange-500" style="border-bottom:2px solid #e2694a" data-tab="tyreBrands" onclick="switchDropdownListTab('tyreBrands')">Tyre Brands (${TYRE_BRANDS.length})</button>
                    <button class="px-3 py-2 text-xs font-semibold text-slate-500" style="border-bottom:2px solid transparent" data-tab="equipmentTypes" onclick="switchDropdownListTab('equipmentTypes')">Object Types (${EQUIPMENT_TYPES.length})</button>
                    <button class="px-3 py-2 text-xs font-semibold text-slate-500" style="border-bottom:2px solid transparent" data-tab="observationOptions" onclick="switchDropdownListTab('observationOptions')">Observations (${OBSERVATION_OPTIONS.length})</button>
                    <button class="px-3 py-2 text-xs font-semibold text-slate-500" style="border-bottom:2px solid transparent" data-tab="actionTakenOptions" onclick="switchDropdownListTab('actionTakenOptions')">Actions Taken (${ACTION_TAKEN_OPTIONS.length})</button>
                </div>
                <div id="dropdownListContent"></div>
            </div>

            <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="mb-3 flex items-center justify-between">
                    <div>
                        <div class="text-sm font-bold text-slate-900">Deleted Content</div>
                        <div class="text-xs text-slate-500">${totalDel} total — restore or permanently purge</div>
                    </div>
                </div>
                <div class="mb-3 flex flex-wrap gap-1 border-b border-slate-100" id="deletedTabs">
                    <button class="px-3 py-2 text-xs font-semibold text-orange-500" style="border-bottom:2px solid #e2694a" data-tab="tyres" onclick="switchDeletedTab('tyres')">Tyres (${delTyres})</button>
                    <button class="px-3 py-2 text-xs font-semibold text-slate-500" style="border-bottom:2px solid transparent" data-tab="equipment" onclick="switchDeletedTab('equipment')">Equipment (${delEquip})</button>
                    <button class="px-3 py-2 text-xs font-semibold text-slate-500" style="border-bottom:2px solid transparent" data-tab="inspections" onclick="switchDeletedTab('inspections')">Inspections (${delInsp})</button>
                    <button class="px-3 py-2 text-xs font-semibold text-slate-500" style="border-bottom:2px solid transparent" data-tab="users" onclick="switchDeletedTab('users')">Users (${delUsers})</button>
                </div>
                <div id="deletedContent">
                    ${delTyres === 0 ? '<div class="py-8 text-center text-sm text-slate-500">No deleted tyres.</div>' : ''}
                </div>
            </div>
        </div>
    `;

    const regCanvas = document.getElementById('admin-reg-chart');
    if (regCanvas) {
        if (typeof Chart === 'undefined') {
            regCanvas.parentElement.innerHTML = `<div class="flex h-full items-center justify-center text-xs text-slate-500">Chart library failed to load.</div>`;
        } else if (regGrouped.length === 0) {
            regCanvas.parentElement.innerHTML = `<div class="flex h-full items-center justify-center text-xs text-slate-500">No tyres registered in this period.</div>`;
        } else {
            renderChartWithChartJS(regCanvas, regGrouped, 'bar', adminPeriod, 'tyre registered', 'tyres registered');
        }
    }
    const inspCanvas = document.getElementById('admin-insp-chart');
    if (inspCanvas) {
        if (typeof Chart === 'undefined') {
            inspCanvas.parentElement.innerHTML = `<div class="flex h-full items-center justify-center text-xs text-slate-500">Chart library failed to load.</div>`;
        } else if (inspGrouped.length === 0) {
            inspCanvas.parentElement.innerHTML = `<div class="flex h-full items-center justify-center text-xs text-slate-500">No inspections logged in this period.</div>`;
        } else {
            renderChartWithChartJS(inspCanvas, inspGrouped, 'bar', adminPeriod);
        }
    }

    if (delTyres > 0) switchDeletedTab('tyres');
    switchDropdownListTab(currentDropdownListTab);
}

function switchDeletedTab(tab) {
    if (!isCurrentUserAdmin()) return;
    const tabs = document.querySelectorAll('#deletedTabs button');
    tabs.forEach(btn => {
        btn.style.color = btn.dataset.tab === tab ? '#e2694a' : '#64748b';
        btn.style.borderBottom = btn.dataset.tab === tab ? '2px solid #e2694a' : '2px solid transparent';
    });

    const container = document.getElementById('deletedContent');
    let items = [];
    let emptyMsg = '';
    adminActionRegistry = {};

    if (tab === 'tyres') {
        items = tyres.filter(t => t.deleted).map(t => ({
            key: t.sn,
            title: t.sn,
            sub: t.brand + ' · ' + t.size + ' · ' + (t.equip || 'unassigned'),
            onRestore: () => {
                tyres = tyres.map(x => x.sn === t.sn ? { ...x, deleted: false } : x);
                saveData();
                renderAll();
                switchDeletedTab(tab);
                logActivity(`Tyre ${t.sn} restored`, 'emerald');
                showToast('Tyre ' + t.sn + ' restored');
            },
            onPurge: () => {
                showConfirm('Permanently delete ' + t.sn + '?', () => {
                    tyres = tyres.filter(x => x.sn !== t.sn);
                    saveData();
                    renderAll();
                    switchDeletedTab(tab);
                    logActivity(`Tyre ${t.sn} permanently purged`, 'red');
                    showToast('Tyre ' + t.sn + ' purged');
                }, { title: 'Permanently delete?', confirmLabel: 'Permanently Delete' });
            }
        }));
        emptyMsg = 'No deleted tyres.';
    } else if (tab === 'equipment') {
        items = equipment.filter(e => e.deleted).map(e => ({
            key: e.id,
            title: e.id,
            sub: e.type + ' · Registered ' + (e.createdAt ? (typeof formatActivityTimestamp === 'function' ? formatActivityTimestamp(e.createdAt) : new Date(e.createdAt).toLocaleString()) : '—'),
            onRestore: () => {
                equipment = equipment.map(x => x.id === e.id ? { ...x, deleted: false } : x);
                saveData();
                renderAll();
                switchDeletedTab(tab);
                logActivity(`Equipment ${e.id} restored`, 'emerald');
                showToast('Equipment ' + e.id + ' restored');
            },
            onPurge: () => {
                showConfirm('Permanently delete ' + e.id + '?', () => {
                    equipment = equipment.filter(x => x.id !== e.id);
                    saveData();
                    renderAll();
                    switchDeletedTab(tab);
                    logActivity(`Equipment ${e.id} permanently purged`, 'red');
                    showToast('Equipment ' + e.id + ' purged');
                }, { title: 'Permanently delete?', confirmLabel: 'Permanently Delete' });
            }
        }));
        emptyMsg = 'No deleted equipment.';
    } else if (tab === 'inspections') {
        items = inspections.filter(i => i.deleted).map(i => ({
            key: i.id,
            title: i.asset + ' — ' + i.date,
            sub: i.count + ' tyres · ' + i.inspector + ' · ' + i.result,
            onRestore: () => {
                inspections = inspections.map(x => x.id === i.id ? { ...x, deleted: false } : x);
                saveData();
                renderAll();
                switchDeletedTab(tab);
                logActivity(`Inspection for ${i.asset} restored`, 'emerald');
                showToast('Inspection restored');
            },
            onPurge: () => {
                showConfirm('Permanently delete inspection?', () => {
                    inspections = inspections.filter(x => x.id !== i.id);
                    saveData();
                    renderAll();
                    switchDeletedTab(tab);
                    logActivity(`Inspection for ${i.asset} permanently purged`, 'red');
                    showToast('Inspection purged');
                }, { title: 'Permanently delete?', confirmLabel: 'Permanently Delete' });
            }
        }));
        emptyMsg = 'No deleted inspections.';
    } else if (tab === 'users') {
        items = users.filter(u => u.deleted).map(u => ({
            key: u.username,
            title: u.name,
            sub: u.role + ' · ' + u.dept + ' · ' + u.username,
            onRestore: async () => {
                try {
                    await api.updateUserFields(u.username, { deleted: false });
                } catch (err) {
                    showToast('Could not restore user: ' + err.message);
                    return;
                }
                users = users.map(x => x.username === u.username ? { ...x, deleted: false } : x);
                renderAll();
                switchDeletedTab(tab);
                logActivity(`User ${u.name} restored`, 'emerald');
                showToast(u.name + ' restored');
            },
            onPurge: () => {
                showConfirm('Permanently delete ' + u.name + '?', async () => {
                    try {
                        await api.purgeUser(u.username);
                    } catch (err) {
                        showToast('Could not purge user: ' + err.message);
                        return;
                    }
                    users = users.filter(x => x.username !== u.username);
                    renderAll();
                    switchDeletedTab(tab);
                    logActivity(`User ${u.name} permanently purged`, 'red');
                    showToast(u.name + ' purged');
                }, { title: 'Permanently delete?', confirmLabel: 'Permanently Delete' });
            }
        }));
        emptyMsg = 'No deleted users.';
    }

    if (items.length === 0) {
        container.innerHTML = `<div class="py-8 text-center text-sm text-slate-500">${emptyMsg}</div>`;
        return;
    }

    items.forEach((it, idx) => {
        adminActionRegistry[tab + '-restore-' + idx] = it.onRestore;
        adminActionRegistry[tab + '-purge-' + idx] = it.onPurge;
    });

    container.innerHTML =
        `<ul class="divide-y divide-slate-100">` +
        items.map((it, idx) => `
            <li class="flex items-center justify-between gap-3 py-3">
                <div class="min-w-0">
                    <div class="truncate text-sm font-semibold text-slate-900">${escapeHtml(it.title)}</div>
                    <div class="truncate text-xs text-slate-500">${escapeHtml(it.sub)}</div>
                </div>
                <div class="flex shrink-0 gap-2">
                    <button onclick="runAdminAction('${tab}-restore-${idx}')" class="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-200">Restore</button>
                    <button onclick="runAdminAction('${tab}-purge-${idx}')" class="rounded-md bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-200">Purge</button>
                </div>
            </li>
        `).join('') +
        `</ul>`;
}