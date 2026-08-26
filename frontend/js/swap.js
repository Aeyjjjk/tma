const RESERVE_SOURCE_ID = '__RESERVE__';

function renderSwap() {
    switch (swapView) {
        case 'cross': return renderCrossAssetSwap();
        case 'same': return renderSameAssetSwap();
        case 'terminate': return renderReserveTerminate();
        default: return renderSwapMenu();
    }
}

function startReserveSwap() {
    if (!canInspectAndSwap()) { showToast('Only a Manager, Supervisor, Inspector, or Administrator can perform swaps'); return; }
    swapView = 'cross';
    changeCrossSource(RESERVE_SOURCE_ID);
}

function goSwapMenu() {
    swapView = 'menu';
    crossSource = null;
    crossRows = {};
    sameAssetId = null;
    samePicks = [];
    renderSwap();
}

function selectSwapType(type) {
    if (type !== 'terminate' && !canInspectAndSwap()) { showToast('Only a Manager, Supervisor, Inspector, or Administrator can perform swaps'); return; }
    swapView = type;
    renderSwap();
}

function renderSwapMenu() {
    const container = document.getElementById('page-SWAP');
    container.innerHTML = `
        <div class="space-y-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-slate-900">Tyre Swap</h2>
                    <p class="text-sm text-slate-500">Select a swap type to begin</p>
                </div>
            </div>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                ${canInspectAndSwap() ? `
                <button onclick="selectSwapType('same')" class="rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md">
                    <div class="text-3xl">🔄</div>
                    <div class="mt-3 text-base font-bold text-slate-900">Swap Within Same Asset</div>
                    <div class="mt-1 text-sm text-slate-500">Reassign tyre positions within same equipment</div>
                </button>
                <button onclick="selectSwapType('cross')" class="rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md">
                    <div class="text-3xl">↔️</div>
                    <div class="mt-3 text-base font-bold text-slate-900">Swap Across Different Assets</div>
                    <div class="mt-1 text-sm text-slate-500">Move tyres between different equipment</div>
                </button>
                <button onclick="startReserveSwap()" class="rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md">
                    <div class="text-3xl">📦</div>
                    <div class="mt-3 text-base font-bold text-slate-900">Reserve Tyres</div>
                    <div class="mt-1 text-sm text-slate-500">Install a good tyre from reserve stock onto equipment</div>
                </button>
                ` : `
                <div class="col-span-full rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5 text-xs text-orange-800">
                    Performing a swap requires a Manager, Supervisor, Inspector, or Administrator role. You can still view already-terminated tyres below.
                </div>
                `}
                <button onclick="selectSwapType('terminate')" class="rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md">
                    <div class="text-3xl">⛔</div>
                    <div class="mt-3 text-base font-bold text-slate-900">Terminate Tyres</div>
                    <div class="mt-1 text-sm text-slate-500">Write off tyres beyond serviceable condition</div>
                </button>
            </div>
        </div>
    `;
}

function changeCrossSource(id) {
    crossSource = id || null;
    crossRows = {};
    if (crossSource === RESERVE_SOURCE_ID) {
        const reserveTyres = tyres.filter(t => !t.deleted && t.status === 'reserve');
        reserveTyres.forEach(t => {
            crossRows[t.sn] = { newAsset: '', newPos: '', pressure: '', odo: '', obs: '', tread: '', notes: '', photo: '', open: false };
        });
    } else if (crossSource) {
        const assetTyres = tyres.filter(t => !t.deleted && t.equip === crossSource);
        assetTyres.forEach(t => {
            crossRows[t.sn] = { newAsset: '', newPos: '', pressure: '', odo: '', obs: '', tread: '', notes: '', photo: '', open: false };
        });
    }
    renderSwap();
}

function renderCrossAssetSwap() {
    const container = document.getElementById('page-SWAP');
    const activeEquip = equipment.filter(e => !e.deleted);
    const isReserveSource = crossSource === RESERVE_SOURCE_ID;
    const src = (crossSource && !isReserveSource) ? equipment.find(e => e.id === crossSource) : null;
    const srcOdo = (crossSource && !isReserveSource) ? getLastKnownOdometer(crossSource) : null;
    const assetTyres = isReserveSource
        ? tyres.filter(t => !t.deleted && t.status === 'reserve')
        : (crossSource ? tyres.filter(t => !t.deleted && t.equip === crossSource) : []);

    container.innerHTML = `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <div>
                    <button onclick="goSwapMenu()" class="mb-1 text-xs text-orange-600 hover:underline">← Back to Swap</button>
                    <h3 class="text-xl font-bold text-slate-900">Cross-Asset Swap</h3>
                    <p class="text-sm text-slate-500">Move tyres between equipment, or install from Reserve Stock</p>
                </div>
                <span class="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700" id="swapCount">0 swaps</span>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                        <label class="mb-1 block text-xs font-semibold text-slate-600">Source</label>
                        <select onchange="changeCrossSource(this.value)" class="input-field">
                            <option value="">— select source —</option>
                            <option value="${RESERVE_SOURCE_ID}" ${isReserveSource ? 'selected' : ''}>📦 Reserve Stock (Good Tyres)</option>
                            ${activeEquip.map(e => `
                                <option value="${escapeHtml(e.id)}" ${e.id === crossSource ? 'selected' : ''}>${escapeHtml(e.id)} (${escapeHtml(e.type)})</option>
                            `).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="mb-1 block text-xs font-semibold text-slate-600">Date</label>
                        <input type="date" id="crossDate" class="input-field" value="${new Date().toISOString().slice(0, 10)}" />
                    </div>
                    <div>
                        <label class="mb-1 block text-xs font-semibold text-slate-600">Odometer (km)</label>
                        <input disabled class="input-field" value="${isReserveSource ? 'N/A — Reserve Stock' : (srcOdo != null ? srcOdo.toLocaleString() : 'No prior reading')}" />
                    </div>
                </div>
            </div>
            ${!crossSource ? `
                <div class="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                    Select a source above to see its tyres.
                </div>
            ` : assetTyres.length === 0 ? `
                <div class="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
                    ${isReserveSource ? 'No tyres are currently in reserve stock.' : 'No tyres are currently assigned to ' + escapeHtml(src.id) + '.'}
                </div>
            ` : `
            <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead>
                            <tr class="text-left text-xs uppercase text-slate-500">
                                <th class="px-3 py-2 font-semibold">Tyre Serial #</th>
                                <th class="px-3 py-2 font-semibold">Current Pos</th>
                                <th class="px-3 py-2 font-semibold">New Asset</th>
                                <th class="px-3 py-2 font-semibold">New Pos</th>
                                <th class="px-3 py-2 font-semibold">Pressure (psi)</th>
                                <th class="px-3 py-2 font-semibold"></th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100" id="crossBody"></tbody>
                    </table>
                </div>
            </div>
            <div class="sticky bottom-0 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
                <div class="text-sm text-slate-600" id="crossStatus">Select a New Asset and New Position for at least one tyre.</div>
                <button id="crossRecordBtn" disabled onclick="showCrossSummary()" class="rounded-md px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300" style="background:#3d3c41">
                    Record Swaps
                </button>
            </div>
            `}
        </div>
    `;

    if (crossSource && assetTyres.length > 0) renderCrossAsset();
}

function renderCrossAsset() {
    const isReserveSource = crossSource === RESERVE_SOURCE_ID;
    const src = isReserveSource ? null : equipment.find(e => e.id === crossSource);
    if (!isReserveSource && !src) return;
    const tbody = document.getElementById('crossBody');
    if (!tbody) return;

    const assetTyres = isReserveSource
        ? tyres.filter(t => !t.deleted && t.status === 'reserve')
        : tyres.filter(t => !t.deleted && t.equip === crossSource);

    const targetOptions = isReserveSource
        ? equipment.filter(e => !e.deleted)
        : equipment.filter(e => !e.deleted && e.type === src.type && e.id !== crossSource);

    tbody.innerHTML = assetTyres.map(t => {
        const r = crossRows[t.sn] || { newAsset: '', newPos: '', pressure: '', odo: '', obs: '', tread: '', notes: '', photo: '', open: false };
        const targetEquip = r.newAsset ? equipment.find(e => e.id === r.newAsset) : null;
        const targetPositions = targetEquip ? getPositionsForEquip(targetEquip.id) : [];

        return `
            <tr class="hover:bg-slate-50">
                <td class="px-3 py-3 font-mono font-semibold">${escapeHtml(t.sn)}</td>
                <td class="px-3 py-3">${isReserveSource ? '<span class="text-slate-400 italic">Reserve</span>' : escapeHtml(t.pos)}</td>
                <td class="px-3 py-3">
                    <select class="input-field py-1" onchange="updateCrossRow('${t.sn}','newAsset',this.value)">
                        <option value="">— select —</option>
                        ${targetOptions.map(e => `<option value="${escapeHtml(e.id)}" ${r.newAsset === e.id ? 'selected' : ''}>${escapeHtml(e.id)} (${escapeHtml(e.type)})</option>`).join('')}
                    </select>
                </td>
                <td class="px-3 py-3">
                    <select class="input-field py-1" onchange="updateCrossRow('${t.sn}','newPos',this.value)" ${!targetEquip ? 'disabled' : ''}>
                        <option value="">—</option>
                        ${targetPositions.map(p => `<option value="${escapeHtml(p)}" ${r.newPos === p ? 'selected' : ''}>${escapeHtml(p)}</option>`).join('')}
                    </select>
                </td>
                <td class="px-3 py-3">
                    <input class="input-field py-1 w-24" value="${escapeHtml(r.pressure)}" placeholder="psi" onchange="updateCrossRow('${t.sn}','pressure',this.value)" />
                </td>
                <td class="px-3 py-3">
                    ${r.newAsset ? `<button onclick="toggleCrossDetails('${t.sn}')" class="text-xs font-semibold text-orange-600 hover:underline">${r.open ? 'Hide' : 'Details'}</button>` : ''}
                </td>
            </tr>
            ${r.open && r.newAsset ? `
            <tr class="bg-slate-50">
                <td colspan="6" class="p-4">
                    <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <div>
                            <label class="mb-1 block text-xs font-semibold text-slate-600">New Odometer (km) *</label>
                            <input class="input-field" value="${escapeHtml(r.odo)}" placeholder="e.g. 85000" onchange="updateCrossRow('${t.sn}','odo',this.value)" />
                        </div>
                        <div>
                            <label class="mb-1 block text-xs font-semibold text-slate-600">Observation *</label>
                            <input class="input-field" value="${escapeHtml(r.obs)}" placeholder="e.g. even wear" onchange="updateCrossRow('${t.sn}','obs',this.value)" />
                        </div>
                        <div>
                            <label class="mb-1 block text-xs font-semibold text-slate-600">Tread (mm) *</label>
                            <input class="input-field" value="${escapeHtml(r.tread)}" placeholder="e.g. 12.5" onchange="updateCrossRow('${t.sn}','tread',this.value)" />
                        </div>
                        <div>
                            <label class="mb-1 block text-xs font-semibold text-slate-600">Notes</label>
                            <input class="input-field" value="${escapeHtml(r.notes)}" placeholder="Optional" onchange="updateCrossRow('${t.sn}','notes',this.value)" />
                        </div>
                    </div>
                    ${r.photo ? `
                        <div class="mt-3 flex items-center gap-3">
                            <img src="${r.photo}" alt="Tyre photo" class="h-12 w-12 rounded-md object-cover border border-slate-200" />
                            <button onclick="pickCrossPhoto('${t.sn}')" class="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-white">Change Photo</button>
                            <button onclick="removeCrossPhoto('${t.sn}')" class="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Remove</button>
                        </div>
                    ` : `
                        <button onclick="pickCrossPhoto('${t.sn}')" class="mt-3 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-white">
                            📷 Upload Photo
                        </button>
                    `}
                </td>
            </tr>` : ''}
        `;
    }).join('');

    updateCrossStatus();
}

function updateCrossRow(sn, field, value) {
    if (!crossRows[sn]) crossRows[sn] = { newAsset: '', newPos: '', pressure: '', odo: '', obs: '', tread: '', notes: '', photo: '', open: false };
    crossRows[sn][field] = value;
    if (field === 'newAsset') {
        crossRows[sn].newPos = '';
        crossRows[sn].odo = value ? String(getLastKnownOdometer(value) ?? '') : '';
    }
    renderCrossAsset();
}

function pickCrossPhoto(sn) {
    if (!crossRows[sn]) return;
    pickImageFile((dataUrl) => {
        crossRows[sn].photo = dataUrl;
        renderCrossAsset();
        showToast('Photo attached');
    });
}

function removeCrossPhoto(sn) {
    if (!crossRows[sn]) return;
    crossRows[sn].photo = '';
    renderCrossAsset();
}

function toggleCrossDetails(sn) {
    if (!crossRows[sn]) return;
    crossRows[sn].open = !crossRows[sn].open;
    renderCrossAsset();
}

function updateCrossStatus() {
    const active = Object.entries(crossRows).filter(([, r]) => r.newAsset && r.newPos);
    const count = active.length;
    const countEl = document.getElementById('swapCount');
    if (countEl) countEl.textContent = count + ' swap' + (count === 1 ? '' : 's');

    const status = document.getElementById('crossStatus');
    const btn = document.getElementById('crossRecordBtn');
    if (!status || !btn) return;
    if (count === 0) {
        status.textContent = 'Select a New Asset and New Position for at least one tyre.';
        btn.disabled = true;
        return;
    }
    const allValid = active.every(([, r]) => r.pressure && r.odo && r.obs && r.tread);
    if (allValid) {
        status.textContent = '✔ ' + count + ' swap(s) ready to record.';
        btn.disabled = false;
    } else {
        status.textContent = 'Fill required details for ' + count + ' selected swap(s).';
        btn.disabled = true;
    }
}

function showCrossSummary() {
    const active = Object.entries(crossRows).filter(([, r]) => r.newAsset && r.newPos);
    if (active.length === 0) return;
    renderCrossSummary(active);
}

function confirmCrossSwap() {
    if (!canInspectAndSwap()) { showToast('Only a Manager, Supervisor, Inspector, or Administrator can perform swaps'); return; }
    const active = Object.entries(crossRows).filter(([, r]) => r.newAsset && r.newPos);
    const isReserveSource = crossSource === RESERVE_SOURCE_ID;
    const srcLabel = isReserveSource ? 'Reserve Stock' : crossSource;

    active.forEach(([sn, r]) => {
        const movingTyre = tyres.find(t => t.sn === sn);
        if (!movingTyre) return;
        const originAsset = movingTyre.equip;
        const originPos = movingTyre.pos;

        const occupant = tyres.find(t => !t.deleted && t.equip === r.newAsset && t.pos === r.newPos && t.sn !== sn);

        tyres = tyres.map(t => {
            if (t.sn === sn) {
                return {
                    ...t,
                    equip: r.newAsset,
                    pos: r.newPos,
                    pressure: r.pressure || t.pressure,
                    tread: r.tread ? parseFloat(r.tread) || t.tread : t.tread,
                    status: isReserveSource ? 'active' : t.status,
                    inspector: CURRENT_USER
                };
            }
            if (occupant && t.sn === occupant.sn) {
                return isReserveSource
                    ? { ...t, equip: '—', pos: '—', inspector: CURRENT_USER }
                    : { ...t, equip: originAsset, pos: originPos, inspector: CURRENT_USER };
            }
            return t;
        });

        logActivity(
            isReserveSource ? `Tyre ${sn} installed from Reserve Stock to ${r.newAsset}/${r.newPos}` : `Tyre ${sn} swapped from ${srcLabel} to ${r.newAsset}`,
            'sky',
            occupant ? (isReserveSource ? `Replaced ${occupant.sn}, now unassigned` : `Swapped positions with ${occupant.sn}`) : `Now at ${r.newAsset}/${r.newPos}`
        );
    });

    saveData();
    closeCrossSummary();
    showToast('Cross-asset swaps recorded successfully!');
    renderTyres();
    renderEquipment();
    renderDashboard();
    updateNotifications();
    renderProfile();
    goSwapMenu();
}

function selectSameAsset(id) {
    sameAssetId = id || null;
    samePicks = [];
    renderSwap();
}

function toggleSamePick(sn) {
    const idx = samePicks.indexOf(sn);
    if (idx !== -1) {
        samePicks.splice(idx, 1);
    } else if (samePicks.length < 2) {
        samePicks.push(sn);
    } else {
        showToast('You can only select 2 tyres to swap at a time');
        return;
    }
    renderSwap();
}

function confirmSameSwap() {
    if (!canInspectAndSwap()) { showToast('Only a Manager, Supervisor, Inspector, or Administrator can perform swaps'); return; }
    if (samePicks.length !== 2) return;
    const [snA, snB] = samePicks;
    const tyreA = tyres.find(t => t.sn === snA);
    const tyreB = tyres.find(t => t.sn === snB);
    if (!tyreA || !tyreB) return;

    showConfirm(`Swap positions of ${snA} (${tyreA.pos}) and ${snB} (${tyreB.pos})?`, () => {
        const posA = tyreA.pos, posB = tyreB.pos;
        tyres = tyres.map(t => {
            if (t.sn === snA) return { ...t, pos: posB, inspector: CURRENT_USER };
            if (t.sn === snB) return { ...t, pos: posA, inspector: CURRENT_USER };
            return t;
        });
        saveData();
        logActivity(`Tyres ${snA} and ${snB} swapped positions on ${sameAssetId}`, 'sky', `${posA} ↔ ${posB}`);
        showToast('Positions swapped');
        renderTyres();
        renderDashboard();
        updateNotifications();
        goSwapMenu();
    }, { title: 'Confirm position swap', confirmLabel: 'Swap Positions' });
}

function renderSameAssetSwap() {
    const container = document.getElementById('page-SWAP');
    const activeEquip = equipment.filter(e => !e.deleted);

    if (!sameAssetId) {
        container.innerHTML = `
            <div class="space-y-4">
                <div>
                    <button onclick="goSwapMenu()" class="mb-1 text-xs text-orange-600 hover:underline">← Back to Swap</button>
                    <h3 class="text-xl font-bold text-slate-900">Swap Within Same Asset</h3>
                    <p class="text-sm text-slate-500">Select the equipment whose tyre positions you want to reassign</p>
                </div>
                <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <label class="mb-1 block text-xs font-semibold text-slate-600">Equipment</label>
                    <select onchange="selectSameAsset(this.value)" class="input-field">
                        <option value="">— select equipment —</option>
                        ${activeEquip.map(e => `<option value="${escapeHtml(e.id)}">${escapeHtml(e.id)} (${escapeHtml(e.type)})</option>`).join('')}
                    </select>
                </div>
            </div>
        `;
        return;
    }

    const asset = equipment.find(e => e.id === sameAssetId);
    if (!asset) { sameAssetId = null; renderSwap(); return; }
    const assetTyres = tyres.filter(t => !t.deleted && t.equip === sameAssetId);

    container.innerHTML = `
        <div class="space-y-4">
            <div>
                <button onclick="selectSameAsset(null)" class="mb-1 text-xs text-orange-600 hover:underline">← Change Equipment</button>
                <h3 class="text-xl font-bold text-slate-900">Swap Within ${escapeHtml(asset.id)}</h3>
                <p class="text-sm text-slate-500">Select exactly 2 tyres to swap their positions</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                ${assetTyres.length < 2 ? `
                    <div class="py-8 text-center text-sm text-slate-500">This equipment needs at least 2 tyres assigned to swap positions.</div>
                ` : `
                <ul class="divide-y divide-slate-100">
                    ${assetTyres.map(t => {
                        const picked = samePicks.includes(t.sn);
                        return `
                        <li class="flex items-center justify-between gap-3 py-3">
                            <label class="flex flex-1 items-center gap-3 cursor-pointer">
                                <input type="checkbox" ${picked ? 'checked' : ''} onchange="toggleSamePick('${t.sn}')" class="h-4 w-4" />
                                <div>
                                    <div class="text-sm font-semibold text-slate-900">${escapeHtml(t.sn)} <span class="font-normal text-slate-500">· ${escapeHtml(t.pos)}</span></div>
                                    <div class="text-xs text-slate-500">${escapeHtml(t.brand || '—')} · ${escapeHtml(t.tread ?? '—')}mm</div>
                                </div>
                            </label>
                            <span class="inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyle(t.status)}">${t.status}</span>
                        </li>
                        `;
                    }).join('')}
                </ul>
                `}
            </div>
            <div class="sticky bottom-0 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
                <div class="text-sm text-slate-600">${samePicks.length} of 2 tyres selected</div>
                <button ${samePicks.length !== 2 ? 'disabled' : ''} onclick="confirmSameSwap()" class="rounded-md px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300" style="background:#3d3c41">
                    Swap Positions
                </button>
            </div>
        </div>
    `;
}

function renderReserveTerminate() {
    const container = document.getElementById('page-SWAP');
    const alreadyTerminated = tyres.filter(t => !t.deleted && t.status === 'terminated');
    container.innerHTML = `
        <div class="space-y-4">
            <div>
                <button onclick="goSwapMenu()" class="mb-1 text-xs text-orange-600 hover:underline">← Back to Swap</button>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h4 class="mb-3 text-sm font-semibold text-slate-900">Already Terminated (${alreadyTerminated.length})</h4>
                ${alreadyTerminated.length === 0 ? `
                    <div class="py-4 text-center text-sm text-slate-500">No tyres are currently terminated.</div>
                ` : `
                    <ul class="divide-y divide-slate-100">
                        ${alreadyTerminated.map(t => `
                            <li class="flex items-center justify-between gap-3 py-2.5">
                                <div class="min-w-0">
                                    <div class="truncate text-sm font-semibold text-slate-900">${escapeHtml(t.sn)}</div>
                                    <div class="truncate text-xs text-slate-500">${escapeHtml(t.brand || '—')} · ${escapeHtml(t.size || '—')} · ${escapeHtml(t.tread ?? '—')}mm</div>
                                    ${t.terminationReason ? `<div class="truncate text-xs italic text-red-600">Reason: ${escapeHtml(t.terminationReason)}</div>` : ''}
                                </div>
                                <span class="inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyle(t.status)}">${t.status}</span>
                            </li>
                        `).join('')}
                    </ul>
                `}
            </div>
        </div>
    `;
}