function renderInspections() {
    if (inspectionView === 'new') {
        renderNewInspectionFlow();
        return;
    }
    renderInspectionsList();
}

function formatDateLong(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatAssetLabel(assetId) {
    const e = equipment.find(x => x.id === assetId);
    return e ? `${assetId} — ${e.type}` : assetId;
}

function renderInspectionsList() {
    const container = document.getElementById('page-INSPECTIONS');
    const sort = document.getElementById('inspSort')?.value || 'date-desc';
    const active = inspections.filter(i => !i.deleted);

    active.sort((a, b) => {
        switch (sort) {
            case 'date-asc': return new Date(a.date) - new Date(b.date);
            case 'asset-asc': return formatAssetLabel(a.asset).localeCompare(formatAssetLabel(b.asset));
            case 'asset-desc': return formatAssetLabel(b.asset).localeCompare(formatAssetLabel(a.asset));
            case 'date-desc':
            default: return new Date(b.date) - new Date(a.date);
        }
    });

    container.innerHTML = `
        <div class="space-y-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-slate-900">Inspections</h2>
                    <p class="text-sm text-slate-500">All recorded tyre inspection sessions</p>
                </div>
                ${canInspectAndSwap() ? `
                <button onclick="startNewInspection()" class="rounded-md bg-[#3d3c41] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90">
                    + New Inspection
                </button>
                ` : ''}
            </div>
            <div class="flex justify-end">
                <select id="inspSort" onchange="renderInspectionsList()" class="input-field w-full sm:w-48">
                    <option value="date-desc" ${sort === 'date-desc' ? 'selected' : ''}>Date (Latest First)</option>
                    <option value="date-asc" ${sort === 'date-asc' ? 'selected' : ''}>Date (Oldest First)</option>
                    <option value="asset-asc" ${sort === 'asset-asc' ? 'selected' : ''}>Asset (A–Z)</option>
                    <option value="asset-desc" ${sort === 'asset-desc' ? 'selected' : ''}>Asset (Z–A)</option>
                </select>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead>
                            <tr class="text-left text-xs uppercase text-slate-500">
                                <th class="px-3 py-2 font-semibold">Date</th>
                                <th class="px-3 py-2 font-semibold">Asset</th>
                                <th class="px-3 py-2 font-semibold">Tyres Inspected</th>
                                <th class="px-3 py-2 font-semibold">Odometer</th>
                                <th class="px-3 py-2 font-semibold">Inspector</th>
                                <th class="px-3 py-2 font-semibold">Result</th>
                                <th class="px-3 py-2 font-semibold">Notes</th>
                                <th class="px-3 py-2 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${active.length === 0 ? `
                                <tr><td colspan="8" class="py-8 text-center text-sm text-slate-500">No inspections logged yet.</td></tr>
                            ` : active.map(i => {
                                const terminatedTyres = (i.tyreSerials || []).filter(sn => {
                                    const t = tyres.find(x => x.sn === sn);
                                    return t && t.status === 'terminated';
                                });
                                const equipRecord = equipment.find(x => x.id === i.asset);
                                const isEquipDeleted = !!(equipRecord && equipRecord.deleted);
                                return `
                                <tr class="hover:bg-slate-50">
                                    <td class="px-3 py-3 whitespace-nowrap">${formatDateLong(i.date)}</td>
                                    <td class="px-3 py-3 whitespace-nowrap">
                                        ${escapeHtml(formatAssetLabel(i.asset))}
                                        ${isEquipDeleted ? `<span class="ml-1 inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600" title="Equipment ${escapeHtml(i.asset)} has since been deleted">🗑 Equipment deleted</span>` : ''}
                                        ${terminatedTyres.length > 0 ? `<span class="ml-1 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700" title="${escapeHtml(terminatedTyres.join(', '))} since terminated">⛔ Terminated tyre</span>` : ''}
                                    </td>
                                    <td class="px-3 py-3">${i.count}</td>
                                    <td class="px-3 py-3 whitespace-nowrap">${(i.odo || 0).toLocaleString()} km</td>
                                    <td class="px-3 py-3">${escapeHtml(i.inspector)}</td>
                                    <td class="px-3 py-3"><span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${resultStyle(i.result)}">${i.result}</span></td>
                                    <td class="px-3 py-3 max-w-xs truncate" title="${escapeHtml(i.notes || '')}">${escapeHtml(i.notes || '—')}</td>
                                    <td class="px-3 py-3">
                                        <div class="flex gap-2">
                                            <button onclick="openInspectionView('${i.id}')" class="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">View</button>
                                            ${canInspectAndSwap() ? (terminatedTyres.length === 0 && !isEquipDeleted ? `
                                                <button onclick="editInspection('${i.id}')" class="rounded-md bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-200">Edit</button>
                                            ` : `
                                                <button disabled title="${isEquipDeleted ? `Can't edit — equipment ${escapeHtml(i.asset)} has since been deleted` : `Can't edit — this inspection covers a tyre that has since been terminated (${escapeHtml(terminatedTyres.join(', '))})`}" class="cursor-not-allowed rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-400">Edit</button>
                                            `) : ''}
                                            ${canDeleteRecords() ? `<button onclick="deleteInspection('${i.id}')" class="rounded-md bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-200">Delete</button>` : ''}
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

function editInspection(id) {
    if (!canInspectAndSwap()) { showToast('Only a Manager, Supervisor, Inspector, or Administrator can edit inspections'); return; }
    const i = inspections.find(x => x.id === id);
    if (i) {
        const terminatedTyres = (i.tyreSerials || []).filter(sn => {
            const t = tyres.find(x => x.sn === sn);
            return t && t.status === 'terminated';
        });
        if (terminatedTyres.length > 0) {
            showToast("Can't edit — this inspection covers a terminated tyre (" + terminatedTyres.join(', ') + ')');
            return;
        }
        const equipRecord = equipment.find(x => x.id === i.asset);
        if (equipRecord && equipRecord.deleted) {
            showToast("Can't edit — equipment " + i.asset + " has since been deleted");
            return;
        }
    }
    openInspectionModal(id);
}

function deleteInspection(id) {
    if (!canDeleteRecords()) { showToast('Only a Manager or Administrator can delete inspections'); return; }
    const i = inspections.find(x => x.id === id);
    if (!i) return;
    showConfirm('Delete inspection for ' + i.asset + ' on ' + i.date + '?', () => {
        inspections = inspections.map(x => x.id === id ? { ...x, deleted: true } : x);
        saveData();
        renderInspections();
        renderProfile();
        renderDashboard();
        updateNotifications();
        showToast('Inspection moved to deleted');
        logActivity(`Inspection for ${i.asset} on ${i.date} deleted`, 'red');
    });
}

function startNewInspection() {
    if (!canInspectAndSwap()) { showToast('Only a Manager, Supervisor, Inspector, or Administrator can log inspections'); return; }
    inspectionView = 'new';
    inspectionAsset = null;
    inspectionRows = {};
    inspectionSearch = '';
    renderInspections();
}

function cancelNewInspection() {
    inspectionView = 'list';
    inspectionAsset = null;
    inspectionRows = {};
    inspectionDate = '';
    inspectionOdo = '';
    renderInspections();
}

function changeInspectionAsset() {
    inspectionAsset = null;
    inspectionRows = {};
    inspectionDate = '';
    inspectionOdo = '';
    renderInspections();
}

function selectInspectionAsset(id) {
    inspectionAsset = id;
    inspectionRows = {};
    if (!inspectionDate) inspectionDate = new Date().toISOString().slice(0, 10);
    const lastOdo = getLastKnownOdometer(id);
    inspectionOdo = lastOdo != null ? String(lastOdo) : '';
    renderInspections();
}

function setInspectionDate(value) {
    inspectionDate = value;
    renderInspections();
}

function setInspectionOdo(value) {
    inspectionOdo = value;
    renderInspections();
}

let inspectionEquipSearchWasFocused = false;
function filterInspectionEquip() {
    const el = document.getElementById('inspEquipSearch');
    inspectionEquipSearchWasFocused = document.activeElement && document.activeElement.id === 'inspEquipSearch';
    inspectionSearch = el ? el.value : '';
    renderInspections();
}

function updateInspectionRow(sn, field, value) {
    if (!inspectionRows[sn]) inspectionRows[sn] = { tread: '', pressure: '', observation: '', action: '', photo: false };
    inspectionRows[sn][field] = value;
    renderInspections();
}

function markInspectionPhoto(sn) {
    if (!inspectionRows[sn]) return;
    pickImageFile((dataUrl) => {
        inspectionRows[sn].photo = dataUrl;
        renderInspections();
        showToast('Photo attached');
    });
}

function removeInspectionPhoto(sn) {
    if (!inspectionRows[sn]) return;
    inspectionRows[sn].photo = false;
    renderInspections();
}

function getLastKnownOdometer(assetId) {
    const past = inspections
        .filter(i => !i.deleted && i.asset === assetId && i.odo)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    if (past.length > 0) return past[0].odo;
    return null;
}

function expandPositionLabel(pos) {
    if (!pos || pos === '—') return pos;
    const axleMap = { FL: 'Front Left', FR: 'Front Right', RL: 'Rear Left', RR: 'Rear Right' };
    let m = pos.match(/^(FL|FR|RL|RR)(\d*)$/);
    if (m) {
        const label = axleMap[m[1]] + (m[2] ? ' ' + m[2] : '');
        return `${pos} (${label})`;
    }
    m = pos.match(/^(L|R)(\d*)$/);
    if (m) {
        const label = (m[1] === 'L' ? 'Left' : 'Right') + (m[2] ? ' ' + m[2] : '');
        return `${pos} (${label})`;
    }
    return pos;
}

function renderNewInspectionFlow() {
    const container = document.getElementById('page-INSPECTIONS');

    if (!inspectionAsset) {
        const q = inspectionSearch.toLowerCase();
        const activeEquip = equipment.filter(e => !e.deleted).filter(e =>
            !q || [e.id, e.type].some(x => String(x).toLowerCase().includes(q))
        );

        container.innerHTML = `
            <div class="space-y-4">
                <div>
                    <button onclick="cancelNewInspection()" class="mb-1 text-xs text-orange-600 hover:underline">← Back to Inspections</button>
                    <h2 class="text-2xl font-bold text-slate-900">New Inspection</h2>
                    <p class="text-sm text-slate-500">Select the registered equipment you want to inspect</p>
                </div>
                <div class="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <input id="inspEquipSearch" oninput="filterInspectionEquip()" value="${escapeHtml(inspectionSearch)}" placeholder="Search Object ID or type" class="input-field" />
                </div>
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    ${activeEquip.length === 0 ? `
                        <div class="col-span-full py-8 text-center text-sm text-slate-500">${inspectionSearch ? 'No equipment matches your search.' : 'No equipment registered yet.'}</div>
                    ` : activeEquip.map(e => {
                        const count = tyres.filter(t => !t.deleted && t.equip === e.id).length;
                        const registeredAt = e.createdAt
                            ? (typeof formatActivityTimestamp === 'function' ? formatActivityTimestamp(e.createdAt) : new Date(e.createdAt).toLocaleString())
                            : '—';
                        return `
                        <button onclick="selectInspectionAsset('${e.id}')" class="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-400 hover:shadow-md">
                            <div class="text-sm font-bold text-slate-900">${escapeHtml(e.id)}</div>
                            <div class="text-xs text-slate-500">${escapeHtml(e.type)} · Registered ${registeredAt}</div>
                            <div class="mt-2 text-xs font-semibold text-slate-600">${count} tyre${count === 1 ? '' : 's'} assigned</div>
                        </button>`;
                    }).join('')}
                </div>
            </div>
        `;

        if (inspectionEquipSearchWasFocused) {
            const el = document.getElementById('inspEquipSearch');
            if (el) {
                el.focus();
                el.setSelectionRange(el.value.length, el.value.length);
            }
        }
        return;
    }

    const asset = equipment.find(e => e.id === inspectionAsset);
    if (!asset) { inspectionAsset = null; renderInspections(); return; }

    const assetTyres = tyres.filter(t => !t.deleted && t.equip === inspectionAsset);

    assetTyres.forEach(t => {
        if (!inspectionRows[t.sn]) {
            inspectionRows[t.sn] = {
                tread: t.tread ?? '',
                pressure: (t.pressure && t.pressure !== '—') ? t.pressure : '',
                observation: '',
                action: '',
                photo: false
            };
        }
    });

    const reviewedCount = assetTyres.filter(t => inspectionRows[t.sn]?.observation).length;

    container.innerHTML = `
        <div class="space-y-4">
            <div>
                <button onclick="changeInspectionAsset()" class="mb-1 text-xs text-orange-600 hover:underline">← Change Equipment</button>
                <h2 class="text-2xl font-bold text-slate-900">New Inspection — ${escapeHtml(asset.id)}</h2>
                <p class="text-sm text-slate-500">Review each tyre fitted to this asset</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                        <label class="mb-1 block text-xs uppercase text-slate-500">Date</label>
                        <input type="date" class="input-field" value="${inspectionDate}" onchange="setInspectionDate(this.value)" />
                    </div>
                    <div>
                        <label class="mb-1 block text-xs uppercase text-slate-500">Asset / Equipment</label>
                        <select class="input-field" onchange="selectInspectionAsset(this.value)">
                            ${equipment.filter(e => !e.deleted).map(e => `
                                <option value="${escapeHtml(e.id)}" ${e.id === inspectionAsset ? 'selected' : ''}>${escapeHtml(e.id)} · ${escapeHtml(e.type)}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div>
                        <div class="mb-1 text-xs uppercase text-slate-500">Tyres on Asset</div>
                        <div class="text-sm font-semibold text-slate-900 pt-2">${assetTyres.length}</div>
                    </div>
                    <div>
                        <label class="mb-1 block text-xs uppercase text-slate-500">Odometer (km)</label>
                        <input class="input-field" value="${inspectionOdo}" placeholder="e.g. 85000" onchange="setInspectionOdo(this.value)" />
                    </div>
                </div>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                ${assetTyres.length === 0 ? `
                    <div class="py-8 text-center text-sm text-slate-500">No tyres are currently assigned to this equipment.</div>
                ` : `
                <div class="overflow-x-auto">
                    <table class="min-w-full text-sm">
                        <thead>
                            <tr class="text-left text-xs uppercase text-slate-500">
                                <th class="px-3 py-2 font-semibold whitespace-nowrap">Position</th>
                                <th class="px-3 py-2 font-semibold whitespace-nowrap">Tyre</th>
                                <th class="px-3 py-2 font-semibold whitespace-nowrap">Tread (mm)</th>
                                <th class="px-3 py-2 font-semibold whitespace-nowrap">Pressure (psi)</th>
                                <th class="px-3 py-2 font-semibold whitespace-nowrap">Observation</th>
                                <th class="px-3 py-2 font-semibold whitespace-nowrap">Action Taken</th>
                                <th class="px-3 py-2 font-semibold whitespace-nowrap">Photo</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${assetTyres.map(t => {
                                const r = inspectionRows[t.sn];
                                return `
                                <tr class="hover:bg-slate-50">
                                    <td class="px-3 py-3 whitespace-nowrap">${expandPositionLabel(t.pos)}</td>
                                    <td class="px-3 py-3 whitespace-nowrap">
                                        <div class="font-mono font-semibold">${escapeHtml(t.sn)}</div>
                                        <div class="text-xs text-slate-500">${escapeHtml(t.brand && t.brand !== '—' ? t.brand : 'Unbranded')}</div>
                                    </td>
                                    <td class="px-3 py-3"><input class="input-field py-1 w-20" value="${escapeHtml(r.tread)}" onchange="updateInspectionRow('${t.sn}','tread',this.value)" /></td>
                                    <td class="px-3 py-3"><input class="input-field py-1 w-20" value="${escapeHtml(r.pressure)}" placeholder="psi" onchange="updateInspectionRow('${t.sn}','pressure',this.value)" /></td>
                                    <td class="px-3 py-3">
                                        <select class="input-field py-1 min-w-[10rem]" onchange="updateInspectionRow('${t.sn}','observation',this.value)">
                                            <option value="">— select —</option>
                                            ${OBSERVATION_OPTIONS.map(o => `<option value="${o.value}" ${r.observation === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
                                        </select>
                                    </td>
                                    <td class="px-3 py-3">
                                        <select class="input-field py-1 min-w-[10rem]" onchange="updateInspectionRow('${t.sn}','action',this.value)">
                                            <option value="">— none —</option>
                                            ${ACTION_TAKEN_OPTIONS.map(a => `<option value="${a.value}" ${r.action === a.value ? 'selected' : ''}>${a.label}</option>`).join('')}
                                        </select>
                                    </td>
                                    <td class="px-3 py-3">
                                        ${r.photo ? `
                                            <div class="flex items-center gap-2">
                                                <img src="${r.photo}" alt="Tyre photo" class="h-9 w-9 rounded-md object-cover border border-slate-200" />
                                                <div class="flex flex-col gap-1">
                                                    <button onclick="markInspectionPhoto('${t.sn}')" class="text-xs font-semibold text-orange-600 hover:underline">Change</button>
                                                    <button onclick="removeInspectionPhoto('${t.sn}')" class="text-xs font-semibold text-red-600 hover:underline">Remove</button>
                                                </div>
                                            </div>
                                        ` : `
                                            <button onclick="markInspectionPhoto('${t.sn}')" class="whitespace-nowrap rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold hover:bg-slate-50">
                                                📷 Upload
                                            </button>
                                        `}
                                    </td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                `}
            </div>
            <div class="sticky bottom-0 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
                <div class="text-sm text-slate-600">${assetTyres.length === 0 ? 'No tyres to inspect.' : reviewedCount + ' of ' + assetTyres.length + ' tyres reviewed'}</div>
                <button ${reviewedCount === 0 ? 'disabled' : ''} onclick="saveNewInspection()" class="rounded-md px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300" style="background:#3d3c41">
                    Save Inspection
                </button>
            </div>
        </div>
    `;
}

function saveNewInspection() {
    if (!canInspectAndSwap()) { showToast('Only a Manager, Supervisor, Inspector, or Administrator can log inspections'); return; }
    const asset = equipment.find(e => e.id === inspectionAsset);
    if (!asset) return;
    if (!inspectionDate) { showToast('Please select a date'); return; }
    if (!inspectionOdo || isNaN(parseInt(inspectionOdo))) { showToast('Please enter the odometer reading'); return; }

    const assetTyres = tyres.filter(t => !t.deleted && t.equip === inspectionAsset);
    const reviewed = assetTyres.filter(t => inspectionRows[t.sn]?.observation);
    if (reviewed.length === 0) { showToast('Add at least one tyre observation before saving'); return; }

    const severityRank = { good: 0, warning: 1, critical: 2 };
    let worstSeverity = 'good';

    reviewed.forEach(t => {
        const r = inspectionRows[t.sn];
        const opt = OBSERVATION_OPTIONS.find(o => o.value === r.observation);
        const severity = opt ? opt.severity : 'good';
        if (severityRank[severity] > severityRank[worstSeverity]) worstSeverity = severity;

        const newTread = r.tread !== '' ? parseFloat(r.tread) || 0 : t.tread;
        const newPressure = r.pressure !== '' ? r.pressure : t.pressure;
        const newStatus = severity === 'critical' ? 'critical'
            : severity === 'warning' ? 'warning'
            : (t.status === 'terminated' || t.status === 'reserve' ? t.status : 'active');

        tyres = tyres.map(x => x.sn === t.sn ? { ...x, tread: newTread, pressure: newPressure, status: newStatus, inspector: CURRENT_USER } : x);
    });

    const notesCombined = reviewed
        .filter(t => inspectionRows[t.sn].action)
        .map(t => {
            const opt = ACTION_TAKEN_OPTIONS.find(a => a.value === inspectionRows[t.sn].action);
            return `${t.sn}: ${opt ? opt.label : inspectionRows[t.sn].action}`;
        })
        .join(' · ');

    const tyreDetails = reviewed.map(t => {
        const r = inspectionRows[t.sn];
        const opt = OBSERVATION_OPTIONS.find(o => o.value === r.observation);
        const actOpt = ACTION_TAKEN_OPTIONS.find(a => a.value === r.action);
        return {
            sn: t.sn,
            pos: t.pos,
            brand: t.brand,
            tread: r.tread,
            pressure: r.pressure,
            observation: r.observation,
            observationLabel: opt ? opt.label : r.observation,
            action: r.action,
            actionLabel: actOpt ? actOpt.label : '',
            photo: r.photo || false
        };
    });

    inspections.unshift({
        id: genId('INSP'),
        asset: inspectionAsset,
        date: inspectionDate,
        odo: parseInt(inspectionOdo) || 0,
        count: reviewed.length,
        inspector: CURRENT_USER,
        result: worstSeverity,
        notes: notesCombined,
        tyreSerials: reviewed.map(t => t.sn),
        tyreDetails: tyreDetails,
        createdAt: Date.now()
    });

    saveData();
    inspectionView = 'list';
    inspectionAsset = null;
    inspectionRows = {};
    inspectionDate = '';
    inspectionOdo = '';
    renderInspections();
    renderTyres();
    renderEquipment();
    renderProfile();
    renderDashboard();
    updateNotifications();
    showToast('Inspection saved for ' + asset.id);
    logActivity(
        `Inspection logged for ${asset.id}`,
        worstSeverity === 'critical' ? 'red' : worstSeverity === 'warning' ? 'amber' : 'emerald',
        `${reviewed.length} tyre${reviewed.length === 1 ? '' : 's'} reviewed · ${worstSeverity}`
    );
}