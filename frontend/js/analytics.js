// ============================================================
// ANALYTICS PAGE — synced with real fleet data, using the same
// Chart.js trend engine as the Dashboard for visual consistency.
// ============================================================

let analyticsPeriod = 'monthly';   // 'daily' | 'weekly' | 'monthly' | 'yearly'
let analyticsChartType = 'bar';    // 'bar' | 'line'

function setAnalyticsPeriod(period) {
    analyticsPeriod = period;
    renderAnalytics();
}

function setAnalyticsChartType(type) {
    analyticsChartType = type;
    renderAnalytics();
}
window.setAnalyticsPeriod = setAnalyticsPeriod;
window.setAnalyticsChartType = setAnalyticsChartType;

function renderAnalytics() {
    const container = document.getElementById('page-ANALYTICS');

    const activeTyres = tyres.filter(t => !t.deleted);
    const activeEquip = equipment.filter(e => !e.deleted);
    const activeInsp = inspections.filter(i => !i.deleted);

    // --- Stat cards (all computed from live data) ---
    const treadValues = activeTyres.map(t => parseFloat(t.tread)).filter(n => !isNaN(n));
    const avgTread = treadValues.length ? (treadValues.reduce((s, n) => s + n, 0) / treadValues.length) : 0;
    const criticalCount = activeTyres.filter(t => t.status === 'critical').length;
    const totalInspections = activeInsp.length;

    // --- Trend chart: tyre registrations over time, reusing the exact same
    // grouping + Chart.js rendering engine as the Dashboard's Inspection
    // Trends chart (groupInspectionsByPeriod / renderChartWithChartJS),
    // just fed tyre registration dates instead of inspection dates.
    const tyreDateItems = activeTyres
        .filter(t => t.createdAt)
        .map(t => ({ date: new Date(t.createdAt).toISOString().slice(0, 10), createdAt: t.createdAt }));
    const grouped = groupInspectionsByPeriod(tyreDateItems, analyticsPeriod);

    const chartContainerId = 'analytics-chart-container';
    const chartHtml = `
        <div class="h-56 w-full">
            <canvas id="${chartContainerId}" class="h-full w-full"></canvas>
        </div>
    `;

    const periodOptions = [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'yearly', label: 'Yearly' }
    ];
    const chartTypeOptions = [
        { value: 'bar', label: '📊 Bar' },
        { value: 'line', label: '📈 Line' }
    ];

    const selectorHtml = `
        <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-2">
                <span class="text-xs text-slate-500 font-medium">View:</span>
                <div class="flex rounded-md border border-slate-200 overflow-hidden bg-white">
                    ${periodOptions.map(p => `
                        <button onclick="setAnalyticsPeriod('${p.value}')" class="px-3 py-1.5 text-xs font-semibold transition-colors ${analyticsPeriod === p.value ? 'bg-[#3d3c41] text-white' : 'text-slate-600 hover:bg-slate-50'}">
                            ${p.label}
                        </button>
                    `).join('')}
                </div>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-xs text-slate-500 font-medium">Chart:</span>
                <div class="flex rounded-md border border-slate-200 overflow-hidden bg-white">
                    ${chartTypeOptions.map(c => `
                        <button onclick="setAnalyticsChartType('${c.value}')" class="px-3 py-1.5 text-xs font-semibold transition-colors ${analyticsChartType === c.value ? 'bg-[#3d3c41] text-white' : 'text-slate-600 hover:bg-slate-50'}">
                            ${c.label}
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    const periodNoun = { hourly: 'hour', daily: 'day', weekly: 'week', monthly: 'month', yearly: 'year' };
    const periodLabel = analyticsPeriod.charAt(0).toUpperCase() + analyticsPeriod.slice(1);
    const periodCountText = `${grouped.length} ${periodNoun[analyticsPeriod] || analyticsPeriod}${grouped.length === 1 ? '' : 's'}`;

    // --- Alerts by Asset Type: real % of each equipment type's tyres that
    // are currently in warning or critical condition.
    const typeStats = {};
    activeEquip.forEach(e => {
        if (!typeStats[e.type]) typeStats[e.type] = { total: 0, alert: 0 };
    });
    activeTyres.forEach(t => {
        const e = activeEquip.find(x => x.id === t.equip);
        if (!e) return;
        typeStats[e.type].total++;
        if (t.status === 'warning' || t.status === 'critical') typeStats[e.type].alert++;
    });
    const typeStatsList = Object.entries(typeStats)
        .filter(([, v]) => v.total > 0)
        .map(([type, v]) => ({ type, pct: Math.round((v.alert / v.total) * 100), alert: v.alert, total: v.total }))
        .sort((a, b) => b.pct - a.pct);

    container.innerHTML = `
        <div class="space-y-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-slate-900">Analytics</h2>
                    <p class="text-sm text-slate-500">Fleet-wide tyre performance insights</p>
                </div>
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Avg Tread Depth</div>
                    <div class="mt-2 text-3xl font-bold text-slate-900">${treadValues.length ? avgTread.toFixed(1) + ' mm' : '—'}</div>
                    <div class="text-xs text-slate-500">${treadValues.length ? 'Across ' + treadValues.length + ' active tyres' : 'No tyres registered yet'}</div>
                </div>
                <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Critical Tyres</div>
                    <div class="mt-2 text-3xl font-bold ${criticalCount > 0 ? 'text-red-600' : 'text-slate-900'}">${criticalCount}</div>
                    <div class="text-xs text-slate-500">${criticalCount > 0 ? 'Needs attention' : 'All clear'}</div>
                </div>
                <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Inspections Logged</div>
                    <div class="mt-2 text-3xl font-bold text-slate-900">${totalInspections}</div>
                    <div class="text-xs text-slate-500">${totalInspections === 0 ? 'None logged yet' : 'All-time total'}</div>
                </div>
            </div>
            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 class="text-sm font-semibold text-slate-900">Tyre Registrations (${periodLabel})</h3>
                            <span class="text-xs text-slate-500">${periodCountText}</span>
                        </div>
                    </div>
                    <div class="mb-3">${selectorHtml}</div>
                    ${chartHtml}
                </div>
                <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 class="mb-4 text-sm font-semibold text-slate-900">Alerts by Asset Type</h3>
                    ${typeStatsList.length === 0 ? `
                        <div class="py-8 text-center text-sm text-slate-500">No equipment with tyres assigned yet.</div>
                    ` : `
                        <ul class="space-y-3">
                            ${typeStatsList.map(s => `
                                <li>
                                    <div class="mb-1 flex justify-between text-xs">
                                        <span class="font-semibold">${escapeHtml(s.type)}</span>
                                        <span class="text-slate-500">${s.alert}/${s.total} tyres · ${s.pct}%</span>
                                    </div>
                                    <div class="h-2 rounded-full bg-slate-100">
                                        <div class="h-full rounded-full" style="width:${s.pct}%;background:${s.pct >= 50 ? '#ef4444' : s.pct >= 20 ? '#f59e0b' : '#3d3c41'}"></div>
                                    </div>
                                </li>
                            `).join('')}
                        </ul>
                    `}
                </div>
            </div>
        </div>
    `;

    // --- Render the trend chart using the same Chart.js engine as Dashboard ---
    const canvas = document.getElementById(chartContainerId);
    if (canvas) {
        if (grouped.length === 0) {
            canvas.parentElement.innerHTML = `<div class="flex h-full items-center justify-center text-sm text-slate-500">No tyres registered in this period</div>`;
        } else if (typeof Chart === 'undefined') {
            canvas.parentElement.innerHTML = `<div class="flex h-full items-center justify-center px-4 text-center text-sm text-slate-500">Chart library failed to load. Check your network connection, or that the Chart.js script tag is present in index.html.</div>`;
        } else {
            renderChartWithChartJS(canvas, grouped, analyticsChartType, analyticsPeriod, 'tyre registered', 'tyres registered');
        }
    }
}