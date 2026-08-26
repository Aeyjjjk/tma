// ============================================================
// USERS PAGE
// ============================================================

function renderUsers() {
    const container = document.getElementById('page-USERS');
    const isAdmin = isCurrentUserAdmin();

    // Users is admin-only now — render nothing but a plain notice for
    // anyone else, rather than building the full table into the DOM (even
    // hidden/unreachable via nav, that data would still be sitting there
    // for anyone who opened DevTools).
    if (!isAdmin) {
        container.innerHTML = `
            <div class="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <div class="text-sm font-semibold text-slate-700">Restricted</div>
                <div class="mt-1 text-xs text-slate-500">Only an administrator can view Users.</div>
            </div>
        `;
        return;
    }

    const active = users.filter(u => !u.deleted);

    container.innerHTML = `
        <div class="space-y-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-slate-900">Users</h2>
                    <p class="text-sm text-slate-500">Manage system access and roles</p>
                </div>
                <button onclick="openUserModal()" class="rounded-md bg-[#3d3c41] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90">
                    + Add User
                </button>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead>
                            <tr class="text-left text-xs uppercase text-slate-500">
                                <th class="px-3 py-2 font-semibold">Name</th>
                                <th class="px-3 py-2 font-semibold">Role</th>
                                <th class="px-3 py-2 font-semibold">Department</th>
                                <th class="px-3 py-2 font-semibold">Last Active</th>
                                <th class="px-3 py-2 font-semibold">Status</th>
                                <th class="px-3 py-2 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${active.map(u => {
                                const init = u.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
                                const statusCls = u.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600';
                                return `
                                    <tr class="hover:bg-slate-50">
                                        <td class="px-3 py-3">
                                            <div class="flex items-center gap-2">
                                                <div class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-orange-400">${init}</div>
                                                <span class="font-semibold">${escapeHtml(u.name)}</span>
                                                ${u.isAdmin ? '<span class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">ADMIN</span>' : ''}
                                            </div>
                                        </td>
                                        <td class="px-3 py-3">${escapeHtml(u.role)}</td>
                                        <td class="px-3 py-3">${escapeHtml(u.dept)}</td>
                                        <td class="px-3 py-3">${escapeHtml(u.last)}</td>
                                        <td class="px-3 py-3"><span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCls}">${u.status}</span></td>
                                        <td class="px-3 py-3">
                                            <div class="flex gap-2">
                                                <button onclick="openUserModal('${escapeHtml(u.username)}')" class="rounded-md bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-200">Edit</button>
                                                <button onclick="deleteUser('${escapeHtml(u.username)}')" class="rounded-md bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-200">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function deleteUser(username) {
    if (!isCurrentUserAdmin()) { showToast('Only an administrator can remove users'); return; }
    const u = users.find(x => x.username === username);
    if (!u) return;
    if (u.username === loggedInUsername) { showToast("You can't delete your own account while logged in"); return; }
    showConfirm('Delete ' + u.name + '? You can restore them later from the Admin page.', async () => {
        try {
            await api.updateUserFields(username, { deleted: true });
        } catch (err) {
            showToast('Could not delete user: ' + err.message);
            return;
        }
        users = users.map(x => x.username === username ? { ...x, deleted: true } : x);
        renderUsers();
        renderProfile();
        logActivity(`User ${u.name} deleted`, 'red');
        showToast('User ' + u.name + ' moved to deleted');
    });
}