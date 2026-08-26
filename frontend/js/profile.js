// ============================================================
// PROFILE PAGE
// ============================================================

function renderProfile() {
    const container = document.getElementById('page-PROFILE');
    const activeTyres = tyres.filter(t => !t.deleted).length;
    const activeEquip = equipment.filter(e => !e.deleted).length;
    const activeInsp = inspections.filter(i => !i.deleted).length;
    const activeUsers = users.filter(u => !u.deleted).length;
    const delTyres = tyres.filter(t => t.deleted).length;
    const delEquip = equipment.filter(e => e.deleted).length;
    const delInsp = inspections.filter(i => i.deleted).length;
    const delUsers = users.filter(u => u.deleted).length;

    const me = users.find(u => u.username === loggedInUsername);
    const displayName = me ? me.name : (CURRENT_USER || 'Unknown User');
    const displayRole = me ? `${me.role} · ${me.dept}` : '—';
    const initials = displayName.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
    const isAdmin = isCurrentUserAdmin();

    container.innerHTML = `
        <div class="space-y-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-slate-900">Profile</h2>
                    <p class="text-sm text-slate-500">Your account and system overview</p>
                </div>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div class="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-orange-400">${escapeHtml(initials)}</div>
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <div class="text-lg font-bold text-slate-900">${escapeHtml(displayName)}</div>
                            ${isAdmin ? '<span class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">ADMIN</span>' : ''}
                        </div>
                        <div class="text-sm text-slate-500">${escapeHtml(displayRole)}</div>
                        <div class="mt-1 text-xs text-slate-500">Tyre management · WACT v1.0</div>
                    </div>
                    <div class="flex gap-2">
                        ${isAdmin ? `
                            <button onclick="navigate('ADMIN')" class="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                                Admin Page
                            </button>
                            <button onclick="resetAllData()" class="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">
                                Reset All Data
                            </button>
                        ` : ''}
                        <button onclick="logout()" class="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                            Log Out
                        </button>
                    </div>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="text-xs uppercase text-slate-500">Active Tyres</div>
                    <div class="text-2xl font-bold text-slate-900">${activeTyres}</div>
                    <div class="text-[11px] text-slate-500">${delTyres} deleted</div>
                </div>
                <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="text-xs uppercase text-slate-500">Equipment</div>
                    <div class="text-2xl font-bold text-slate-900">${activeEquip}</div>
                    <div class="text-[11px] text-slate-500">${delEquip} deleted</div>
                </div>
                <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="text-xs uppercase text-slate-500">Inspections</div>
                    <div class="text-2xl font-bold text-slate-900">${activeInsp}</div>
                    <div class="text-[11px] text-slate-500">${delInsp} deleted</div>
                </div>
                <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="text-xs uppercase text-slate-500">Users</div>
                    <div class="text-2xl font-bold text-slate-900">${activeUsers}</div>
                    <div class="text-[11px] text-slate-500">${delUsers} deleted</div>
                </div>
            </div>
            ${!isAdmin ? `
                <div class="rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5 text-xs text-orange-800">
                    Deleted records and data reset are managed by an administrator.
                </div>
            ` : ''}
            <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="text-sm font-bold text-slate-900">About This System</div>
                <div class="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-500 sm:grid-cols-2">
                    <div><span class="font-semibold text-slate-700">Organization:</span> WACT</div>
                    <div><span class="font-semibold text-slate-700">Module:</span> Fleet & Tyre Lifecycle Management</div>
                    <div><span class="font-semibold text-slate-700">Version:</span> 1.0.0</div>
                    <div><span class="font-semibold text-slate-700">Storage:</span> Back-end</div>
                    <div class="sm:col-span-2 pt-1">All changes you make (register, edit, delete) are saved in the Database.</div>
                </div>
            </div>
        </div>
    `;
}