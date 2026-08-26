function getPositionsForEquip(equipId) {
    if (!equipId) return [];
    const e = equipment.find(x => x.id === equipId);
    if (e && Array.isArray(e.positions)) return e.positions;
    if (ASSET_DB[equipId]) return ASSET_DB[equipId].positions.map(p => p.pos);
    return [];
}

function generatePositions(type, count) {
    if (!count || count <= 0) return [];

    if (type === 'Trailer') {
        const perSide = Math.ceil(count / 2);
        const positions = [];
        for (let i = 1; i <= perSide; i++) positions.push('L' + i);
        for (let i = 1; i <= perSide; i++) positions.push('R' + i);
        return positions.slice(0, count);
    }

    if (count === 2) return ['L', 'R'];
    if (count === 4) return ['FL', 'FR', 'RL', 'RR'];
    if (count === 6) return ['FL', 'FR', 'RL1', 'RL2', 'RR1', 'RR2'];
    if (count === 8) return ['FL1', 'FL2', 'FR1', 'FR2', 'RL1', 'RL2', 'RR1', 'RR2'];

    const half = Math.ceil(count / 2);
    const positions = [];
    for (let i = 1; i <= half; i++) positions.push('L' + i);
    for (let i = 1; i <= count - half; i++) positions.push('R' + i);
    return positions;
}

function openTyreView(sn) {
    const modal = document.getElementById('tyreModal');
    const t = tyres.find(x => x.sn === sn);
    if (!t) return;

    const row = (label, value) => `
        <div>
            <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">${label}</div>
            <div class="mt-0.5 text-sm text-slate-900">${value}</div>
        </div>
    `;

    modal.innerHTML = `
        <div class="modal-content">
            <div class="mb-4 flex items-center justify-between">
                <h3 class="text-lg font-bold">Tyre Details — ${escapeHtml(t.sn)}</h3>
                <button onclick="closeTyreModal()" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div class="mb-4">
                <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyle(t.status)}">${t.status}</span>
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                ${row('Serial Number', escapeHtml(t.sn))}
                ${row('Brand', escapeHtml(t.brand || '—'))}
                ${row('Size', escapeHtml(t.size || '—'))}
                ${row('Equipment', escapeHtml(t.equip || '—'))}
                ${row('Position', escapeHtml(t.pos || '—'))}
                ${row('Tread Depth', escapeHtml(t.tread ?? '—') + ' mm')}
                ${row('Required Pressure', escapeHtml(t.pressure && t.pressure !== '—' ? t.pressure + ' psi' : '—'))}
                ${row('Load Index', escapeHtml(t.loadIndex || '—'))}
                ${row('Manufacturing Date', t.mfgWeek && t.mfgYear ? `Week ${escapeHtml(t.mfgWeek)}, ${escapeHtml(t.mfgYear)}` : '—')}
                ${row('Date of Fitment', escapeHtml(t.fitmentDate || '—'))}
                ${row('Odometer at Installation', t.odoAtFitment ? escapeHtml(t.odoAtFitment) + ' km' : '—')}
                ${row('Inspector', escapeHtml(t.inspector || '—'))}
                ${row('Registered On', t.createdAt ? escapeHtml(typeof formatActivityTimestamp === 'function' ? formatActivityTimestamp(t.createdAt) : new Date(t.createdAt).toLocaleString()) : '— (registered before this was tracked)')}
            </div>
            ${t.terminationReason ? `
            <div class="mt-4 rounded-md bg-red-50 p-3">
                <div class="text-xs font-semibold uppercase tracking-wide text-red-600">Reason for Termination</div>
                <div class="mt-0.5 text-sm text-red-700">${escapeHtml(t.terminationReason)}</div>
            </div>` : ''}
            <div class="mt-5 flex justify-end gap-2">
                <button onclick="closeTyreModal()" class="rounded-md border border-slate-300 px-4 py-2 text-sm">Close</button>
                ${t.status !== 'terminated' && canManageTyres() ? `<button onclick="editTyre('${t.sn}')" class="rounded-md bg-[#3d3c41] px-4 py-2 text-sm font-semibold text-white">Edit</button>` : ''}
            </div>
        </div>
    `;
    modal.classList.add('active');
    modal.onclick = function (e) {
        if (e.target === modal) closeTyreModal();
    };
}

function showConfirm(message, onConfirm, opts) {
    opts = opts || {};
    const modal = document.getElementById('confirmModal');
    const title = opts.title || 'Are you sure?';
    const confirmLabel = opts.confirmLabel || 'Delete';
    const tone = opts.tone || 'danger';
    const iconWrapClass = tone === 'neutral' ? 'bg-slate-100 text-slate-500' : 'bg-red-100 text-red-600';
    const confirmBtnClass = tone === 'neutral'
        ? 'rounded-md px-4 py-2 text-sm font-semibold text-white hover:opacity-90'
        : 'rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700';
    const confirmBtnStyle = tone === 'neutral' ? 'background:#3d3c41' : '';
    const iconSvg = tone === 'neutral'
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>`;

    modal.innerHTML = `
        <div class="modal-content" style="max-width:420px;">
            <div class="mb-3 flex items-start gap-3">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconWrapClass}">
                    ${iconSvg}
                </div>
                <div class="min-w-0 flex-1 pt-1.5">
                    <h3 class="text-base font-bold text-slate-900">${escapeHtml(title)}</h3>
                    <p class="mt-1 text-sm text-slate-600">${escapeHtml(message)}</p>
                </div>
            </div>
            <div class="mt-4 flex justify-end gap-2">
                <button onclick="closeConfirm()" class="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button>
                <button id="confirmActionBtn" class="${confirmBtnClass}" style="${confirmBtnStyle}">${escapeHtml(confirmLabel)}</button>
            </div>
        </div>
    `;
    modal.classList.add('active');
    modal.onclick = function (e) {
        if (e.target === modal) closeConfirm();
    };
    document.getElementById('confirmActionBtn').onclick = function () {
        closeConfirm();
        onConfirm();
    };
}

function closeConfirm() {
    document.getElementById('confirmModal').classList.remove('active');
}

function openUserModal(username) {
    if (!isCurrentUserAdmin()) { showToast('Only an administrator can manage users'); return; }
    const modal = document.getElementById('tyreModal');
    const isEdit = !!username;
    const u = isEdit ? users.find(x => x.username === username) : null;
    editingUserUsername = isEdit ? username : null;

    modal.innerHTML = `
        <div class="modal-content">
            <div class="mb-4 flex items-center justify-between">
                <h3 class="text-lg font-bold">${isEdit ? 'Edit User' : 'Add New User'}</h3>
                <button onclick="closeUserModal()" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div class="sm:col-span-2">
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Full Name *</label>
                    <input id="userName" class="input-field" value="${escapeHtml(u?.name || '')}" placeholder="e.g. Ada Nwosu" />
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Role</label>
                    <select id="userRole" class="input-field">
                        <option value="">— select role —</option>
                        ${USER_ROLES.map(r => `<option value="${r}" ${u?.role === r ? 'selected' : ''}>${r}</option>`).join('')}
                        ${u?.role && !USER_ROLES.includes(u.role) ? `<option value="${escapeHtml(u.role)}" selected>${escapeHtml(u.role)} (legacy value)</option>` : ''}
                    </select>
                    <p class="mt-1 text-[11px] text-slate-500">Manager: full access incl. registering equipment &amp; terminating tyres. Supervisor: tyre management, inspections &amp; swaps. Inspector: inspections &amp; swaps only. Internal User: view only.</p>
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Department</label>
                    <input id="userDept" class="input-field" value="${escapeHtml(u?.dept || '')}" placeholder="e.g. Maintenance" />
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Username *</label>
                    <input id="userUsername" class="input-field" value="${escapeHtml(u?.username || '')}" ${isEdit ? 'disabled' : ''} placeholder="e.g. anwosu" />
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600">${isEdit ? 'Reset Password' : 'Password *'}</label>
                    <input id="userPassword" type="password" autocomplete="new-password" class="input-field" placeholder="${isEdit ? 'Leave blank to keep current password' : 'Set an initial password'}" />
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Status</label>
                    <select id="userStatus" class="input-field">
                        <option value="Active" ${!u || u.status === 'Active' ? 'selected' : ''}>Active</option>
                        <option value="Inactive" ${u?.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                <div class="flex items-center gap-2 pt-6">
                    <input id="userIsAdmin" type="checkbox" ${u?.isAdmin ? 'checked' : ''} class="h-4 w-4" ${isEdit && u?.username === loggedInUsername ? 'disabled title="You cannot remove your own admin access"' : ''} />
                    <label for="userIsAdmin" class="text-xs font-semibold text-slate-600">Grant admin access</label>
                </div>
            </div>
            <p class="mt-3 text-xs text-slate-500">Users cannot create their own accounts — only an administrator can add or edit accounts here.</p>
            <div class="mt-4 flex justify-end gap-2">
                <button onclick="closeUserModal()" class="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button>
                <button onclick="saveUser()" class="rounded-md bg-[#3d3c41] px-4 py-2 text-sm font-semibold text-white">${isEdit ? 'Save Changes' : 'Create User'}</button>
            </div>
        </div>
    `;
    modal.classList.add('active');
    modal.onclick = function (e) {
        if (e.target === modal) closeUserModal();
    };
}

function closeUserModal() {
    document.getElementById('tyreModal').classList.remove('active');
    editingUserUsername = null;
}

async function saveUser() {
    if (!isCurrentUserAdmin()) { showToast('Only an administrator can manage users'); return; }
    const name = document.getElementById('userName').value.trim();
    if (!name) { showToast('Full name is required'); return; }
    const role = document.getElementById('userRole').value.trim();
    if (!role) { showToast('Please select a role — it determines what this person can do'); return; }
    const dept = document.getElementById('userDept').value.trim() || '—';
    const username = document.getElementById('userUsername').value.trim();
    if (!username) { showToast('Username is required'); return; }
    const passwordInput = document.getElementById('userPassword').value;
    const status = document.getElementById('userStatus').value;
    const isAdminChecked = document.getElementById('userIsAdmin').checked;

    if (editingUserUsername) {
        const remainingAdmins = users.filter(u => u.isAdmin && !u.deleted && u.username !== editingUserUsername).length;
        const finalIsAdmin = (!isAdminChecked && remainingAdmins === 0) ? true : isAdminChecked;
        if (!isAdminChecked && remainingAdmins === 0) showToast('At least one admin account must remain — admin access kept');

        // Password, if provided, goes straight to its own hashed-on-the-server
        // endpoint — never into the shared users array that gets bulk-synced
        // below, so a plaintext password is never sitting in this JS's memory
        // or sent as part of the general state save.
        if (passwordInput) {
            try {
                await api.setPassword(editingUserUsername, passwordInput);
            } catch (err) {
                showToast('Could not update password: ' + err.message);
                return;
            }
        }

        // Profile fields (name/role/dept/status/isAdmin) live in a separate
        // table from tyres/equipment/etc, so they need their own direct
        // write here — the general saveData() below only persists the
        // shared fleet data, not user accounts.
        try {
            await api.updateUserFields(editingUserUsername, { name, role, dept, status, isAdmin: finalIsAdmin });
        } catch (err) {
            showToast('Could not update user: ' + err.message);
            return;
        }

        users = users.map(u => u.username === editingUserUsername
            ? { ...u, name, role, dept, status, isAdmin: finalIsAdmin }
            : u);
        showToast('User ' + name + ' updated');
        logActivity(`User ${name} updated`, 'sky');
    } else {
        if (users.some(u => u.username === username)) {
            showToast('That username is already taken');
            return;
        }
        if (!passwordInput) { showToast('Please set an initial password'); return; }
        let created;
        try {
            created = await api.createUser({ username, password: passwordInput, name, role, dept, isAdmin: isAdminChecked, status });
        } catch (err) {
            showToast('Could not create user: ' + err.message);
            return;
        }
        users.unshift(created.user); // server-sanitized — no password field
        showToast('User ' + name + ' created');
        logActivity(`User ${name} created`, 'emerald', `Username: ${username}`);
    }
    await saveData();
    closeUserModal();
    renderUsers();
    renderProfile();
}

function openTyreModal(sn) {
    if (!canManageTyres()) { showToast('Only a Manager, Supervisor, or Administrator can register or edit tyres'); return; }
    const modal = document.getElementById('tyreModal');
    const isEdit = !!sn;
    const t = isEdit ? tyres.find(x => x.sn === sn) : null;
    editingTyreSn = isEdit ? sn : null;

    const currentYear = new Date().getFullYear();
    const yearOptions = Array.from({ length: 16 }, (_, i) => currentYear - i);
    const weekOptions = Array.from({ length: 52 }, (_, i) => i + 1);
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="mb-4 flex items-center justify-between">
                <h3 class="text-lg font-bold">${isEdit ? 'Edit Tyre ' + sn : 'Register New Tyre'}</h3>
                <button onclick="closeTyreModal()" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div class="sm:col-span-2">
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Serial Number *</label>
                    <input id="tyreSn" class="input-field" value="${escapeHtml(t?.sn || '')}" ${isEdit ? 'disabled' : ''} placeholder="e.g. TY-2001" />
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Brand *</label>
                    <select id="tyreBrand" class="input-field">
                        <option value="">Select Brand</option>
                        ${TYRE_BRANDS.map(b => `<option value="${escapeHtml(b)}" ${t?.brand === b ? 'selected' : ''}>${escapeHtml(b)}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Size *</label>
                    <input id="tyreSize" class="input-field" value="${escapeHtml(t?.size === '—' ? '' : t?.size || '')}" placeholder="12R22.5" />
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Assign to Equipment <span class="font-normal text-slate-400">(optional — leave unassigned for Reserve)</span></label>
                    <select id="tyreEquip" class="input-field" onchange="updateTyrePositions()">
                        <option value="">— unassigned —</option>
                        ${equipment.filter(e => !e.deleted).map(e => `
                            <option value="${escapeHtml(e.id)}" ${t?.equip === e.id ? 'selected' : ''}>${escapeHtml(e.id)} (${escapeHtml(e.type)})</option>
                        `).join('')}
                    </select>
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Position <span class="font-normal text-slate-400">(required if equipment is assigned)</span></label>
                    <select id="tyrePos" class="input-field">
                        <option value="—">— select position —</option>
                        ${getPositionsForEquip(t?.equip).map(p => `
                            <option value="${p}" ${t?.pos === p ? 'selected' : ''}>${p}</option>
                        `).join('')}
                    </select>
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Tread Depth (mm) *</label>
                    <input id="tyreTread" class="input-field" value="${escapeHtml(t?.tread || '')}" placeholder="12" />
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Required Pressure (psi) *</label>
                    <input id="tyrePressure" class="input-field" value="${escapeHtml(t?.pressure === '—' ? '' : t?.pressure || '')}" placeholder="e.g. 110" />
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Load Index *</label>
                    <input id="tyreLoadIndex" class="input-field" value="${escapeHtml(t?.loadIndex === '—' ? '' : t?.loadIndex || '')}" placeholder="e.g. 152/148" />
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Status</label>
                    <select id="tyreStatus" class="input-field" onchange="handleTyreStatusChange()">
                        <option value="active" ${t?.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="warning" ${t?.status === 'warning' ? 'selected' : ''}>Warning</option>
                        <option value="critical" ${t?.status === 'critical' ? 'selected' : ''}>Critical</option>
                        <option value="reserve" ${t?.status === 'reserve' ? 'selected' : ''}>Reserve</option>
                    </select>
                    <p class="mt-1 text-[11px] text-slate-500">Reserve tyres can't be assigned to equipment — selecting Reserve clears any equipment assignment above. To terminate a tyre, use the Terminate action on the Tyres or Equipment page instead — it requires a reason and unassigns it properly.</p>
                </div>
                <div class="sm:col-span-2">
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Manufacturing Date (Week / Year) *</label>
                    <div class="grid grid-cols-2 gap-3">
                        <select id="tyreMfgWeek" class="input-field">
                            <option value="">— week —</option>
                            ${weekOptions.map(w => `<option value="${w}" ${t?.mfgWeek == w ? 'selected' : ''}>Week ${w}</option>`).join('')}
                        </select>
                        <select id="tyreMfgYear" class="input-field">
                            <option value="">— year —</option>
                            ${yearOptions.map(y => `<option value="${y}" ${t?.mfgYear == y ? 'selected' : ''}>${y}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Date of Fitment *</label>
                    <input type="date" id="tyreFitmentDate" class="input-field" value="${t?.fitmentDate || ''}" />
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Odometer at Installation (km) *</label>
                    <input id="tyreOdoAtFitment" class="input-field" value="${escapeHtml(t?.odoAtFitment ?? '')}" placeholder="e.g. 84210" />
                </div>
                <div class="sm:col-span-2">
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Inspector</label>
                    <input class="input-field" value="${escapeHtml(t?.inspector || CURRENT_USER)}" disabled title="Locked to the currently logged-in user" />
                </div>
            </div>
            <div class="mt-5 flex justify-end gap-2">
                <button onclick="closeTyreModal()" class="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button>
                <button onclick="saveTyre()" class="rounded-md bg-[#3d3c41] px-4 py-2 text-sm font-semibold text-white">${isEdit ? 'Save Changes' : 'Register'}</button>
            </div>
        </div>
    `;
    modal.classList.add('active');
    modal.onclick = function(e) {
        if (e.target === modal) closeTyreModal();
    };
}

function closeTyreModal() {
    document.getElementById('tyreModal').classList.remove('active');
    editingTyreSn = null;
}

function saveTyre() {
    if (!canManageTyres()) { showToast('Only a Manager, Supervisor, or Administrator can register or edit tyres'); return; }
    const sn = document.getElementById('tyreSn').value.trim();
    if (!sn) { showToast('Serial number is required'); return; }

    const brand = document.getElementById('tyreBrand').value.trim();
    if (!brand) { showToast('Please select a brand'); return; }

    const size = document.getElementById('tyreSize').value.trim();
    if (!size) { showToast('Size is required'); return; }

    const equip = document.getElementById('tyreEquip').value || '—';
    const posValue = document.getElementById('tyrePos').value || '—';
    if (equip !== '—' && posValue === '—') { showToast('Please select a position for the assigned equipment'); return; }
    const pos = equip !== '—' ? posValue : '—';

    const treadRaw = document.getElementById('tyreTread').value.trim();
    if (!treadRaw) { showToast('Tread depth is required'); return; }
    const tread = parseFloat(treadRaw);
    if (isNaN(tread)) { showToast('Tread depth must be a number'); return; }

    const pressure = document.getElementById('tyrePressure').value.trim();
    if (!pressure) { showToast('Required pressure is required'); return; }

    const loadIndex = document.getElementById('tyreLoadIndex').value.trim();
    if (!loadIndex) { showToast('Load index is required'); return; }

    const status = document.getElementById('tyreStatus').value;

    const mfgWeek = document.getElementById('tyreMfgWeek').value;
    if (!mfgWeek) { showToast('Manufacturing week is required'); return; }
    const mfgYear = document.getElementById('tyreMfgYear').value;
    if (!mfgYear) { showToast('Manufacturing year is required'); return; }

    const fitmentDate = document.getElementById('tyreFitmentDate').value;
    if (!fitmentDate) { showToast('Date of fitment is required'); return; }

    const odoAtFitment = document.getElementById('tyreOdoAtFitment').value.trim();
    if (!odoAtFitment) { showToast('Odometer at installation is required'); return; }

    const finalEquip = status === 'reserve' ? '—' : equip;
    const finalPos = status === 'reserve' ? '—' : pos;
    const inspector = CURRENT_USER;

    if (editingTyreSn) {
        tyres = tyres.map(t => t.sn === editingTyreSn ? { ...t, brand, size, equip: finalEquip, pos: finalPos, tread, pressure, loadIndex, status, mfgWeek, mfgYear, fitmentDate, odoAtFitment, inspector } : t);
        showToast('Tyre ' + sn + ' updated');
        logActivity(`Tyre ${sn} updated`, 'sky', `${status} · ${tread}mm`);
    } else {
        if (tyres.some(t => t.sn === sn)) {
            showToast('Serial number already exists');
            return;
        }
        tyres.unshift({ sn, brand, size, equip: finalEquip, pos: finalPos, tread, pressure, loadIndex, status, mfgWeek, mfgYear, fitmentDate, odoAtFitment, inspector, createdAt: Date.now() });
        showToast('Tyre ' + sn + ' registered');
        logActivity(`Tyre ${sn} registered`, 'emerald', `${brand} · ${size}`);
    }
    saveData();
    closeTyreModal();
    renderTyres();
    renderEquipment();
    renderProfile();
    renderDashboard();
    updateNotifications();
}

function handleTyreStatusChange() {
    const status = document.getElementById('tyreStatus').value;
    const equipSelect = document.getElementById('tyreEquip');
    if (status === 'reserve' && equipSelect.value !== '') {
        equipSelect.value = '';
        updateTyrePositions();
        showToast('Reserve tyres are unassigned automatically');
    }
}

function updateTyrePositions() {
    const equip = document.getElementById('tyreEquip').value;
    const posSelect = document.getElementById('tyrePos');
    const statusSelect = document.getElementById('tyreStatus');

    if (equip && statusSelect && statusSelect.value === 'reserve') {
        statusSelect.value = 'active';
        showToast('Status changed to Active — Reserve tyres can\'t be assigned to equipment');
    }

    const positions = getPositionsForEquip(equip);
    if (!equip || positions.length === 0) {
        posSelect.innerHTML = '<option value="—">— select position —</option>';
        return;
    }
    posSelect.innerHTML = positions.map(p =>
        `<option value="${p}">${p}</option>`
    ).join('');
}

function openEquipView(id) {
    const modal = document.getElementById('equipModal');
    const e = equipment.find(x => x.id === id);
    if (!e) return;

    const assignedTyres = tyres.filter(t => !t.deleted && t.equip === id);

    const row = (label, value) => `
        <div>
            <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">${label}</div>
            <div class="mt-0.5 text-sm text-slate-900">${value}</div>
        </div>
    `;

    modal.innerHTML = `
        <div class="modal-content">
            <div class="mb-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-orange-400">
                        ${equipTypeIcon(e.type)}
                    </div>
                    <h3 class="text-lg font-bold">Equipment Details — ${escapeHtml(e.id)}</h3>
                </div>
                <button onclick="closeEquipModal()" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                ${row('Object ID', escapeHtml(e.id))}
                ${row('Object Type', escapeHtml(e.type))}
                ${row('Date Registered', e.createdAt ? escapeHtml(typeof formatActivityTimestamp === 'function' ? formatActivityTimestamp(e.createdAt) : new Date(e.createdAt).toLocaleString()) : '—')}
                ${row('Tyre Slots', e.tyres)}
                ${row('Tyres Assigned', assignedTyres.length)}
            </div>
            ${e.description ? `
            <div class="mt-4">
                <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</div>
                <div class="mt-0.5 text-sm text-slate-700 italic">${escapeHtml(e.description)}</div>
            </div>` : ''}
            <div class="mt-5 border-t border-slate-100 pt-4">
                <div class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned Tyres</div>
                ${assignedTyres.length === 0 ? `
                    <div class="py-4 text-center text-sm text-slate-500">No tyres currently assigned.</div>
                ` : `
                    <ul class="divide-y divide-slate-100">
                        ${assignedTyres.map(t => `
                            <li class="flex items-center justify-between gap-3 py-2">
                                <div class="min-w-0">
                                    <div class="truncate text-sm font-semibold text-slate-900">${escapeHtml(t.sn)} <span class="font-normal text-slate-500">· ${escapeHtml(t.pos)}</span></div>
                                    <div class="truncate text-xs text-slate-500">${escapeHtml(t.brand || '—')} · ${escapeHtml(t.tread ?? '—')}mm</div>
                                </div>
                                <div class="flex shrink-0 items-center gap-2">
                                    <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyle(t.status)}">${t.status}</span>
                                    ${canTerminateTyres() ? `<button onclick="openTerminateForm('${t.sn}','${e.id}')" class="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">Terminate</button>` : ''}
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                `}
            </div>
            <div class="mt-5 flex justify-end gap-2">
                <button onclick="closeEquipModal()" class="rounded-md border border-slate-300 px-4 py-2 text-sm">Close</button>
                ${canManageEquipment() ? `<button onclick="editEquip('${e.id}')" class="rounded-md bg-[#3d3c41] px-4 py-2 text-sm font-semibold text-white">Edit</button>` : ''}
            </div>
        </div>
    `;
    modal.classList.add('active');
    modal.onclick = function (e2) {
        if (e2.target === modal) closeEquipModal();
    };
}

function openTerminateForm(sn, returnToEquip) {
    if (!canTerminateTyres()) { showToast('Only a Manager or Administrator can terminate tyres'); return; }
    const modal = document.getElementById('equipModal');
    const t = tyres.find(x => x.sn === sn);
    if (!t) return;

    const isAssigned = t.equip && t.equip !== '—';

    modal.innerHTML = `
        <div class="modal-content" style="max-width:440px;">
            <div class="mb-3 flex items-center justify-between">
                <h3 class="text-lg font-bold text-red-700">Terminate Tyre ${escapeHtml(sn)}</h3>
                <button onclick="closeEquipModal()" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <p class="text-sm text-slate-600">This marks the tyre as terminated${isAssigned ? ` and removes it from ${escapeHtml(t.equip)}` : ''}. It will appear under Swap → Terminated Tyres.</p>
            <div class="mt-3">
                <label class="mb-1 block text-xs font-semibold text-slate-600">Reason for Termination *</label>
                <textarea id="terminateReason" class="input-field" rows="3" maxlength="300" placeholder="e.g. Sidewall damage beyond repair"></textarea>
            </div>
            <div class="mt-4 flex justify-end gap-2">
                <button onclick="${returnToEquip ? `openEquipView('${returnToEquip}')` : 'closeEquipModal()'}" class="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button>
                <button onclick="confirmTerminateTyre('${sn}','${returnToEquip || ''}')" class="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Terminate Tyre</button>
            </div>
        </div>
    `;
    modal.classList.add('active');
    modal.onclick = function (e) {
        if (e.target === modal) closeEquipModal();
    };
}

function confirmTerminateTyre(sn, returnToEquip) {
    if (!canTerminateTyres()) { showToast('Only a Manager or Administrator can terminate tyres'); return; }
    const reason = document.getElementById('terminateReason').value.trim();
    if (!reason) { showToast('Please provide a reason for termination'); return; }
    const t = tyres.find(x => x.sn === sn);
    if (!t) return;

    tyres = tyres.map(x => x.sn === sn
        ? { ...x, status: 'terminated', equip: '—', pos: '—', terminationReason: reason, inspector: CURRENT_USER }
        : x);
    saveData();
    logActivity(`Tyre ${sn} terminated`, 'red', reason);
    showToast('Tyre ' + sn + ' terminated');
    closeEquipModal();
    renderEquipment();
    renderTyres();
    renderDashboard();
    if (typeof updateNotifications === 'function') updateNotifications();
}

function openEquipModal(id) {
    if (!canManageEquipment()) { showToast('Only a Manager or Administrator can register or edit equipment'); return; }
    const modal = document.getElementById('equipModal');
    const isEdit = !!id;
    const e = isEdit ? equipment.find(x => x.id === id) : null;
    editingEquipId = isEdit ? id : null;

    const registeredAt = isEdit
        ? (e?.createdAt ? (typeof formatActivityTimestamp === 'function' ? formatActivityTimestamp(e.createdAt) : new Date(e.createdAt).toLocaleString()) : '—')
        : (typeof formatActivityTimestamp === 'function' ? formatActivityTimestamp(Date.now()) : new Date().toLocaleString());

    modal.innerHTML = `
        <div class="modal-content">
            <div class="mb-4 flex items-center justify-between">
                <h3 class="text-lg font-bold">${isEdit ? 'Edit Equipment ' + id : 'Register New Equipment'}</h3>
                <button onclick="closeEquipModal()" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Object ID *</label>
                    <input id="equipId" class="input-field" value="${escapeHtml(e?.id || '')}" ${isEdit ? 'disabled' : ''} placeholder="e.g. TRK-003" />
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Object Type</label>
                    <select id="equipType" class="input-field">
                        ${EQUIPMENT_TYPES.map(t => `
                            <option value="${escapeHtml(t)}" ${e?.type === t ? 'selected' : ''}>${escapeHtml(t)}</option>
                        `).join('')}
                    </select>
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Date Registered</label>
                    <input class="input-field" value="${escapeHtml(registeredAt)}" disabled title="Automatically set to the date and time you registered this equipment" />
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Tyre Slots *</label>
                    <input id="equipTyres" type="number" min="2" step="1" class="input-field" value="${e?.tyres || ''}" placeholder="Number of tyres on equipment" title="Minimum of 2 tyre slots" />
                </div>
                <div class="sm:col-span-2">
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Description</label>
                    <textarea id="equipDescription" class="input-field" rows="3" maxlength="500" placeholder="Optional — include specifications, model or any relevant details">${escapeHtml(e?.description || '')}</textarea>
                </div>
            </div>
            <div class="mt-5 flex justify-end gap-2">
                <button onclick="closeEquipModal()" class="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button>
                <button onclick="saveEquip()" class="rounded-md bg-[#3d3c41] px-4 py-2 text-sm font-semibold text-white">${isEdit ? 'Save Changes' : 'Register'}</button>
            </div>
        </div>
    `;
    modal.classList.add('active');
    modal.onclick = function(e) {
        if (e.target === modal) closeEquipModal();
    };
}

function closeEquipModal() {
    document.getElementById('equipModal').classList.remove('active');
    editingEquipId = null;
}

function saveEquip() {
    if (!canManageEquipment()) { showToast('Only a Manager or Administrator can register or edit equipment'); return; }
    const id = document.getElementById('equipId').value.trim();
    if (!id) { showToast('Object ID is required'); return; }
    const type = document.getElementById('equipType').value;
    const tyresRaw = document.getElementById('equipTyres').value.trim();
    if (!tyresRaw) { showToast('Tyre slots is required'); return; }
    const tyresCount = parseInt(tyresRaw);
    if (isNaN(tyresCount) || tyresCount < 2) { showToast('Tyre slots must be 2 or more — a single tyre or none isn\'t a valid configuration'); return; }
    const description = document.getElementById('equipDescription').value.trim().slice(0, 500);

    const positions = ASSET_DB[id]
        ? undefined
        : generatePositions(type, tyresCount);

    if (editingEquipId) {
        equipment = equipment.map(e => e.id === editingEquipId
            ? { ...e, type, tyres: tyresCount, description, ...(positions ? { positions } : {}) }
            : e);
        showToast('Equipment ' + id + ' updated');
        logActivity(`Equipment ${id} updated`, 'sky', `${type}`);
    } else {
        if (equipment.some(e => e.id === id)) {
            showToast('Equipment ID already exists');
            return;
        }
        equipment.unshift({ id, type, tyres: tyresCount, description, createdAt: Date.now(), ...(positions ? { positions } : {}) });
        showToast('Equipment ' + id + ' registered');
        logActivity(`Equipment ${id} registered`, 'emerald', `${type}`);
    }
    saveData();
    closeEquipModal();
    renderEquipment();
    renderProfile();
    renderDashboard();
    updateNotifications();
}

function openInspectionView(id) {
    const modal = document.getElementById('inspectionModal');
    const i = inspections.find(x => x.id === id);
    if (!i) return;

    const row = (label, value) => `
        <div>
            <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">${label}</div>
            <div class="mt-0.5 text-sm text-slate-900">${value}</div>
        </div>
    `;

    const loggedAt = i.createdAt
        ? escapeHtml(typeof formatActivityTimestamp === 'function' ? formatActivityTimestamp(i.createdAt) : new Date(i.createdAt).toLocaleString())
        : '— (logged before this was tracked)';

    const details = Array.isArray(i.tyreDetails) ? i.tyreDetails : null;

    modal.innerHTML = `
        <div class="modal-content">
            <div class="mb-4 flex items-center justify-between">
                <h3 class="text-lg font-bold">Inspection Details — ${escapeHtml(formatAssetLabel(i.asset))}</h3>
                <button onclick="closeInspectionModal()" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div class="mb-4">
                <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${resultStyle(i.result)}">${escapeHtml(i.result)}</span>
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                ${row('Equipment', escapeHtml(formatAssetLabel(i.asset)))}
                ${row('Inspection Date', escapeHtml(formatDateLong(i.date)))}
                ${row('Logged On', loggedAt)}
                ${row('Odometer', (i.odo || 0).toLocaleString() + ' km')}
                ${row('Inspector', escapeHtml(i.inspector || '—'))}
                ${row('Tyres Inspected', escapeHtml(String(i.count ?? (details ? details.length : 0))))}
            </div>
            ${i.notes ? `
            <div class="mt-4 rounded-md bg-slate-50 p-3">
                <div class="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary Notes</div>
                <div class="mt-0.5 text-sm text-slate-700">${escapeHtml(i.notes)}</div>
            </div>` : ''}
            <div class="mt-5">
                <div class="mb-2 text-sm font-bold text-slate-900">Per-Tyre Breakdown</div>
                ${!details || details.length === 0 ? `
                    <div class="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
                        No per-tyre breakdown was recorded for this inspection${i.tyreSerials && i.tyreSerials.length ? ` — tyres covered: ${escapeHtml(i.tyreSerials.join(', '))}` : ''}.
                    </div>
                ` : `
                    <div class="overflow-x-auto">
                        <table class="min-w-full text-sm">
                            <thead>
                                <tr class="text-left text-xs uppercase text-slate-500">
                                    <th class="px-2 py-1.5 font-semibold whitespace-nowrap">Position</th>
                                    <th class="px-2 py-1.5 font-semibold whitespace-nowrap">Tyre</th>
                                    <th class="px-2 py-1.5 font-semibold whitespace-nowrap">Tread (mm)</th>
                                    <th class="px-2 py-1.5 font-semibold whitespace-nowrap">Pressure (psi)</th>
                                    <th class="px-2 py-1.5 font-semibold whitespace-nowrap">Observation</th>
                                    <th class="px-2 py-1.5 font-semibold whitespace-nowrap">Action Taken</th>
                                    <th class="px-2 py-1.5 font-semibold whitespace-nowrap">Photo</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                ${details.map(d => `
                                    <tr>
                                        <td class="px-2 py-2 whitespace-nowrap">${escapeHtml(typeof expandPositionLabel === 'function' ? expandPositionLabel(d.pos) : (d.pos || '—'))}</td>
                                        <td class="px-2 py-2 whitespace-nowrap font-mono font-semibold">${escapeHtml(d.sn)}</td>
                                        <td class="px-2 py-2">${escapeHtml(d.tread || '—')}</td>
                                        <td class="px-2 py-2">${escapeHtml(d.pressure || '—')}</td>
                                        <td class="px-2 py-2">${escapeHtml(d.observationLabel || '—')}</td>
                                        <td class="px-2 py-2">${escapeHtml(d.actionLabel || '—')}</td>
                                        <td class="px-2 py-2">${d.photo ? `<img src="${d.photo}" alt="Tyre photo" class="h-9 w-9 rounded-md object-cover border border-slate-200" />` : '—'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
            <div class="mt-5 flex justify-end gap-2">
                <button onclick="closeInspectionModal()" class="rounded-md border border-slate-300 px-4 py-2 text-sm">Close</button>
                ${i.deleted ? '' : `<button onclick="editInspection('${i.id}')" class="rounded-md bg-[#3d3c41] px-4 py-2 text-sm font-semibold text-white">Edit</button>`}
            </div>
        </div>
    `;
    modal.classList.add('active');
    modal.onclick = function (e) {
        if (e.target === modal) closeInspectionModal();
    };
}

function openInspectionModal(id) {
    const modal = document.getElementById('inspectionModal');
    const isEdit = !!id;
    const i = isEdit ? inspections.find(x => x.id === id) : null;
    editingInspectionId = isEdit ? id : null;

    const activeEquip = equipment.filter(e => !e.deleted);

    // When editing an inspection that was logged through the per-tyre
    // "+ New Inspection" flow, load its saved tyreDetails into an editable
    // working copy so the same Observation / Action Taken choices made
    // during the inspection can be reviewed and changed here too.
    const hasTyreDetails = isEdit && Array.isArray(i?.tyreDetails) && i.tyreDetails.length > 0;
    editInspectionRows = {};
    if (hasTyreDetails) {
        i.tyreDetails.forEach(d => { editInspectionRows[d.sn] = { ...d }; });
    }

    modal.innerHTML = `
        <div class="modal-content">
            <div class="mb-4 flex items-center justify-between">
                <h3 class="text-lg font-bold">${isEdit ? 'Edit Inspection' : 'New Inspection'}</h3>
                <button onclick="closeInspectionModal()" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Equipment *</label>
                    <select id="inspAsset" class="input-field" onchange="updateInspectionTyreCount()">
                        <option value="">— select equipment —</option>
                        ${activeEquip.map(e => `
                            <option value="${escapeHtml(e.id)}" ${i?.asset === e.id ? 'selected' : ''}>${escapeHtml(e.id)} (${escapeHtml(e.type)})</option>
                        `).join('')}
                    </select>
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Date *</label>
                    <input type="date" id="inspDate" class="input-field" value="${i?.date || new Date().toISOString().slice(0, 10)}" />
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Odometer (km) *</label>
                    <input id="inspOdo" class="input-field" value="${escapeHtml(i?.odo || '')}" placeholder="e.g. 85000" />
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Tyres Inspected</label>
                    <input id="inspCount" class="input-field" value="${i?.count ?? ''}" disabled placeholder="Auto-calculated from equipment" />
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Inspector</label>
                    <input class="input-field" value="${escapeHtml(i?.inspector || CURRENT_USER)}" disabled title="Locked to the currently logged-in user" />
                </div>
                <div>
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Result *</label>
                    <select id="inspResult" class="input-field">
                        <option value="good" ${i?.result === 'good' ? 'selected' : ''}>Good</option>
                        <option value="warning" ${i?.result === 'warning' ? 'selected' : ''}>Warning</option>
                        <option value="critical" ${i?.result === 'critical' ? 'selected' : ''}>Critical</option>
                    </select>
                </div>
                ${!hasTyreDetails ? `
                <div class="sm:col-span-2">
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Notes</label>
                    <select id="inspNotes" class="input-field">
                        <option value="">— none —</option>
                        ${ACTION_TAKEN_OPTIONS.map(a => `<option value="${escapeHtml(a.label)}" ${i?.notes === a.label ? 'selected' : ''}>${a.label}</option>`).join('')}
                    </select>
                </div>
                ` : ''}
            </div>
            ${hasTyreDetails ? `
            <div class="mt-4">
                <div class="mb-2 text-sm font-bold text-slate-900">Per-Tyre Observations &amp; Actions</div>
                <div class="overflow-x-auto rounded-lg border border-slate-200">
                    <table class="min-w-full text-sm">
                        <thead>
                            <tr class="bg-slate-50 text-left text-xs uppercase text-slate-500">
                                <th class="px-2 py-1.5 font-semibold whitespace-nowrap">Position</th>
                                <th class="px-2 py-1.5 font-semibold whitespace-nowrap">Tyre</th>
                                <th class="px-2 py-1.5 font-semibold whitespace-nowrap">Tread (mm)</th>
                                <th class="px-2 py-1.5 font-semibold whitespace-nowrap">Pressure (psi)</th>
                                <th class="px-2 py-1.5 font-semibold whitespace-nowrap">Observation</th>
                                <th class="px-2 py-1.5 font-semibold whitespace-nowrap">Action Taken</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${i.tyreDetails.map(d => {
                                const r = editInspectionRows[d.sn];
                                return `
                                <tr>
                                    <td class="px-2 py-2 whitespace-nowrap">${escapeHtml(typeof expandPositionLabel === 'function' ? expandPositionLabel(d.pos) : (d.pos || '—'))}</td>
                                    <td class="px-2 py-2 whitespace-nowrap font-mono font-semibold">${escapeHtml(d.sn)}</td>
                                    <td class="px-2 py-2">${escapeHtml(d.tread || '—')}</td>
                                    <td class="px-2 py-2">${escapeHtml(d.pressure || '—')}</td>
                                    <td class="px-2 py-2">
                                        <select class="input-field py-1 min-w-[10rem]" onchange="updateEditInspectionRow('${d.sn}','observation',this.value)">
                                            <option value="">— select —</option>
                                            ${OBSERVATION_OPTIONS.map(o => `<option value="${o.value}" ${r.observation === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
                                        </select>
                                    </td>
                                    <td class="px-2 py-2">
                                        <select class="input-field py-1 min-w-[10rem]" onchange="updateEditInspectionRow('${d.sn}','action',this.value)">
                                            <option value="">— none —</option>
                                            ${ACTION_TAKEN_OPTIONS.map(a => `<option value="${a.value}" ${r.action === a.value ? 'selected' : ''}>${a.label}</option>`).join('')}
                                        </select>
                                    </td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="mt-1.5 text-xs text-slate-500">Tread and pressure reflect what was recorded during the inspection and aren't editable here — go to the Tyres page to update a tyre's current readings.</div>
            </div>
            ` : ''}
            <div class="mt-5 flex justify-end gap-2">
                <button onclick="closeInspectionModal()" class="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button>
                <button onclick="saveInspection()" class="rounded-md bg-[#3d3c41] px-4 py-2 text-sm font-semibold text-white">${isEdit ? 'Save Changes' : 'Log Inspection'}</button>
            </div>
        </div>
    `;
    modal.classList.add('active');
    modal.onclick = function(e) {
        if (e.target === modal) closeInspectionModal();
    };
    updateInspectionTyreCount();
}

let editInspectionRows = {};
function updateEditInspectionRow(sn, field, value) {
    if (!editInspectionRows[sn]) return;
    editInspectionRows[sn][field] = value;
}

function closeInspectionModal() {
    document.getElementById('inspectionModal').classList.remove('active');
    editingInspectionId = null;
}

function updateInspectionTyreCount() {
    const assetId = document.getElementById('inspAsset')?.value;
    const countField = document.getElementById('inspCount');
    if (!countField) return;
    if (!assetId) { countField.value = ''; return; }
    const count = tyres.filter(t => !t.deleted && t.equip === assetId).length;
    countField.value = count;
}

function saveInspection() {
    if (!canInspectAndSwap()) { showToast('Only a Manager, Supervisor, Inspector, or Administrator can edit inspections'); return; }
    const asset = document.getElementById('inspAsset').value;
    if (!asset) { showToast('Please select equipment'); return; }
    const date = document.getElementById('inspDate').value;
    if (!date) { showToast('Please select a date'); return; }
    const odo = parseInt(document.getElementById('inspOdo').value) || 0;
    if (!odo) { showToast('Odometer reading is required'); return; }
    const inspector = CURRENT_USER;
    const result = document.getElementById('inspResult').value;
    const count = tyres.filter(t => !t.deleted && t.equip === asset).length;

    // When this inspection has a per-tyre breakdown, the Observation/Action
    // Taken choices made in that table (not the single Notes dropdown,
    // which isn't shown in that case) are what get saved.
    const hasTyreDetails = Object.keys(editInspectionRows).length > 0;
    let notes;
    let tyreDetails;
    if (hasTyreDetails) {
        tyreDetails = Object.values(editInspectionRows).map(r => {
            const opt = OBSERVATION_OPTIONS.find(o => o.value === r.observation);
            const actOpt = ACTION_TAKEN_OPTIONS.find(a => a.value === r.action);
            return { ...r, observationLabel: opt ? opt.label : r.observation, actionLabel: actOpt ? actOpt.label : '' };
        });
        notes = tyreDetails
            .filter(d => d.action)
            .map(d => `${d.sn}: ${d.actionLabel}`)
            .join(' · ');
    } else {
        notes = document.getElementById('inspNotes').value;
    }

    if (editingInspectionId) {
        inspections = inspections.map(i => i.id === editingInspectionId
            ? { ...i, asset, date, odo, count, inspector, result, notes, ...(hasTyreDetails ? { tyreDetails } : {}) }
            : i);
        showToast('Inspection updated');
        logActivity(`Inspection for ${asset} updated`, 'sky', `${result}`);
    } else {
        inspections.unshift({ id: genId('INSP'), asset, date, odo, count, inspector, result, notes, createdAt: Date.now() });
        showToast('Inspection logged for ' + asset);
        logActivity(`Inspection logged for ${asset}`, result === 'critical' ? 'red' : result === 'warning' ? 'amber' : 'emerald', `${result}`);
    }
    saveData();
    closeInspectionModal();
    renderInspections();
    renderProfile();
    renderDashboard();
    updateNotifications();
}

function renderCrossSummary(active) {
    const modal = document.getElementById('crossSummaryModal');
    const isReserveSource = crossSource === RESERVE_SOURCE_ID;
    const src = isReserveSource ? null : equipment.find(e => e.id === crossSource);
    if (!isReserveSource && !src) return;
    const srcOdo = isReserveSource ? null : getLastKnownOdometer(crossSource);
    const srcLabel = isReserveSource ? 'Reserve Stock' : escapeHtml(crossSource);

    modal.innerHTML = `
        <div class="modal-content">
            <div class="mb-4 flex items-center justify-between">
                <h3 class="text-lg font-bold">Swap Summary</h3>
                <button onclick="closeCrossSummary()" class="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div class="space-y-2 text-sm">
                <div class="flex justify-between border-b border-slate-100 py-1">
                    <span class="text-slate-500">Source</span>
                    <span class="font-semibold">${srcLabel}</span>
                </div>
                <div class="flex justify-between border-b border-slate-100 py-1">
                    <span class="text-slate-500">Date</span>
                    <span class="font-semibold">${document.getElementById('crossDate').value}</span>
                </div>
                <div class="flex justify-between border-b border-slate-100 py-1">
                    <span class="text-slate-500">Source Odometer</span>
                    <span class="font-semibold">${isReserveSource ? 'N/A' : (srcOdo != null ? srcOdo.toLocaleString() + ' km' : 'No prior reading')}</span>
                </div>
                <div class="flex justify-between border-b border-slate-100 py-1">
                    <span class="text-slate-500">Tyres Swapped</span>
                    <span class="font-semibold">${active.length}</span>
                </div>
                <div class="pt-2">
                    <div class="mb-1 text-xs font-semibold uppercase text-slate-500">Transfer Details</div>
                    <ul class="space-y-1 rounded-md bg-slate-50 p-3 text-xs">
                        ${active.map(([sn, r]) => {
                            const currentTyre = tyres.find(t => t.sn === sn);
                            const currentPos = isReserveSource ? 'Reserve' : (currentTyre ? currentTyre.pos : '—');
                            const targetOccupant = tyres.find(t => !t.deleted && t.equip === r.newAsset && t.pos === r.newPos && t.sn !== sn);
                            return `
                            <li class="font-mono">
                                ${escapeHtml(sn)}: ${isReserveSource ? 'Reserve' : escapeHtml(crossSource) + '/' + escapeHtml(currentPos)} → ${escapeHtml(r.newAsset)}/${escapeHtml(r.newPos)} @ ${escapeHtml(r.pressure)}psi
                                ${targetOccupant ? `<div class="mt-0.5 text-amber-600">${isReserveSource ? `↔ replaces ${escapeHtml(targetOccupant.sn)}, which becomes unassigned` : `↔ swaps places with ${escapeHtml(targetOccupant.sn)}, currently in that position`}</div>` : ''}
                            </li>
                        `;
                        }).join('')}
                    </ul>
                </div>
            </div>
            <div class="mt-4 flex justify-end gap-2">
                <button onclick="closeCrossSummary()" class="rounded-md border border-slate-300 px-4 py-2 text-sm">Edit</button>
                <button onclick="confirmCrossSwap()" class="rounded-md bg-[#3d3c41] px-4 py-2 text-sm font-semibold text-white">Confirm</button>
            </div>
        </div>
    `;
    modal.classList.add('active');
    modal.onclick = function(e) {
        if (e.target === modal) closeCrossSummary();
    };
}

function closeCrossSummary() {
    document.getElementById('crossSummaryModal').classList.remove('active');
}