// ============================================================
// DASHBOARD PAGE — with Chart.js & Bar Color by Count Level
// ============================================================

const STATUS_COLORS = {
    active: '#10b981',
    warning: '#f59e0b',
    critical: '#ef4444',
    reserve: '#38bdf8',
    terminated: '#94a3b8'
};

// --- State ---
let dashboardPeriod = 'monthly';      // 'daily' | 'weekly' | 'monthly' | 'yearly'
let dashboardChartType = 'bar';       // 'bar' | 'line'
let chartInstances = {};         // Chart.js instances, keyed by canvas element id — lets
                                  // Dashboard and Analytics both reuse this same engine
                                  // safely without their charts clobbering each other.

// ============================================================
// HELPERS
// ============================================================

/**
 * Get the start date for a given period relative to today.
 */
function getPeriodStart(period, today) {
    const d = new Date(today);
    switch (period) {
        case 'daily':   d.setHours(0, 0, 0, 0); return d; // today only, from midnight
        case 'weekly':  d.setDate(d.getDate() - 180); break;
        case 'monthly': d.setMonth(d.getMonth() - 12); break;
        case 'yearly':  d.setFullYear(d.getFullYear() - 10); break;
        default:        d.setDate(d.getDate() - 30);
    }
    d.setHours(0, 0, 0, 0);
    return d;
}

// Returns the best available timestamp for an inspection: its real
// createdAt (logged automatically when the inspection was saved) if
// present, otherwise falls back to noon on its recorded date. Without
// this, every inspection's date-only string parses to midnight and the
// 'daily' hour-of-day grouping below would put everything in the same
// 00:00 bucket regardless of when it actually happened.
function getInspectionTimestamp(i) {
    if (i.createdAt) return new Date(i.createdAt);
    return new Date((i.date || new Date().toISOString().slice(0, 10)) + 'T12:00:00');
}

/**
 * Group inspections by time unit based on selected period.
 * For 'daily', we group by hour (to show distribution across the day).
 * For other periods, group by the period unit.
 */
function groupInspectionsByPeriod(inspections, period) {
    if (!Array.isArray(inspections) || inspections.length === 0) return [];

    const sorted = [...inspections]
        .filter(i => i.date && !isNaN(new Date(i.date + 'T00:00:00').getTime()))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (sorted.length === 0 && period !== 'daily') return [];

    const now = new Date();
    const startDate = getPeriodStart(period, now);
    const filtered = sorted.filter(i => {
        const d = new Date(i.date + 'T00:00:00');
        return d >= startDate && d <= now;
    });

    if (filtered.length === 0 && period !== 'daily') return [];

    const map = new Map();

    switch (period) {
        case 'daily': {
            // Today only, one bar per hour (0-23) — always shows the full
            // 24-hour timeline, even empty hours, so bars read as a clean
            // hour-by-hour breakdown of today's inspections specifically,
            // using the real logged timestamp (getInspectionTimestamp) since
            // the date-only field always parses to midnight.
            for (let h = 0; h < 24; h++) {
                const key = String(h);
                map.set(key, {
                    label: `${String(h).padStart(2, '0')}:00`,
                    count: 0,
                    date: new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, 0, 0, 0)
                });
            }
            filtered.forEach(i => {
                const hour = getInspectionTimestamp(i).getHours();
                map.get(String(hour)).count++;
            });
            break;
        }
        case 'weekly': {
            // Group by week (Monday-Sunday)
            filtered.forEach(i => {
                const d = new Date(i.date + 'T00:00:00');
                const day = d.getDay();
                const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(d);
                monday.setDate(diff);
                monday.setHours(0, 0, 0, 0);
                const key = monday.toISOString().slice(0, 10);
                if (!map.has(key)) {
                    const end = new Date(monday);
                    end.setDate(end.getDate() + 6);
                    map.set(key, {
                        label: `${monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
                        count: 0,
                        date: monday
                    });
                }
                map.get(key).count++;
            });
            break;
        }
        case 'monthly': {
            // Group by month
            filtered.forEach(i => {
                const d = new Date(i.date + 'T00:00:00');
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (!map.has(key)) {
                    map.set(key, {
                        label: d.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
                        count: 0,
                        date: new Date(d.getFullYear(), d.getMonth(), 1)
                    });
                }
                map.get(key).count++;
            });
            break;
        }
        case 'yearly': {
            // Group by year
            filtered.forEach(i => {
                const d = new Date(i.date + 'T00:00:00');
                const key = String(d.getFullYear());
                if (!map.has(key)) {
                    map.set(key, {
                        label: String(d.getFullYear()),
                        count: 0,
                        date: new Date(d.getFullYear(), 0, 1)
                    });
                }
                map.get(key).count++;
            });
            break;
        }
        default: return [];
    }

    return Array.from(map.values()).sort((a, b) => a.date - b.date);
}

// ============================================================
// COLOR UTILITY: get bar color based on count level
// ============================================================

/**
 * Generate a color for a bar based on its count relative to the max.
 * Higher counts → darker/more saturated orange, lower counts → lighter/pastel orange.
 */
function getBarColor(count, maxCount) {
    if (maxCount === 0) return '#94a3b8';
    
    // Ratio from 0 to 1
    const ratio = count / maxCount;
    
    // Color scale: from light orange to deep orange/brown, matching the
    // brand accent color (#e2694a is roughly hue 12).
    // Light: hsl(20, 100%, 88%) → Dark: hsl(12, 75%, 40%)
    const lightness = 88 - (ratio * 48); // 88% → 40%
    const saturation = 60 + (ratio * 15); // 60% → 75%
    const hue = 20 - (ratio * 8); // 20 → 12 (slight shift toward brand orange)
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Generate an array of colors for each bar based on their counts.
 */
function getBarColors(data) {
    const maxCount = Math.max(...data.map(d => d.count), 1);
    return data.map(d => getBarColor(d.count, maxCount));
}

// ============================================================
// CHART RENDERER (using Chart.js)
// ============================================================

function renderChartWithChartJS(container, data, chartType, period, singularLabel, pluralLabel) {
    singularLabel = singularLabel || 'inspection';
    pluralLabel = pluralLabel || (singularLabel + 's');
    // Destroy previous chart instance if it exists
    if (chartInstances[container.id]) {
        chartInstances[container.id].destroy();
        delete chartInstances[container.id];
    }

    if (!data || data.length === 0) {
        container.innerHTML = `<div class="flex h-full items-center justify-center text-sm text-slate-500">No inspections in this period</div>`;
        return;
    }

    const labels = data.map(d => d.label);
    const counts = data.map(d => d.count);
    const maxCount = Math.max(...counts, 1);

    // --- Get bar colors based on count levels ---
    const barColors = chartType === 'bar' ? getBarColors(data) : null;

    // --- Border colors: slightly darker version of the fill color ---
    const borderColors = chartType === 'bar' 
        ? barColors.map(c => {
            // Darken the color for border
            return c;
        })
        : '#3d3c41';

    const ctx = container.getContext('2d');
    
    chartInstances[container.id] = new Chart(ctx, {
        type: chartType === 'bar' ? 'bar' : 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Inspections',
                data: counts,
                backgroundColor: chartType === 'bar' 
                    ? barColors
                    : 'rgba(11, 22, 40, 0.15)',
                borderColor: chartType === 'bar'
                    ? barColors.map(c => c) // same color for border
                    : '#3d3c41',
                borderWidth: chartType === 'bar' ? 1.5 : 2.5,
                pointBackgroundColor: chartType === 'bar' ? 'transparent' : '#3d3c41',
                pointBorderColor: chartType === 'bar' ? 'transparent' : '#ffffff',
                pointBorderWidth: chartType === 'bar' ? 0 : 1.5,
                pointRadius: chartType === 'bar' ? 0 : 4,
                fill: chartType === 'bar' ? false : true,
                tension: chartType === 'bar' ? 0 : 0.3,
                barPercentage: chartType === 'bar' ? 0.7 : undefined,
                categoryPercentage: chartType === 'bar' ? 0.8 : undefined,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y + ' ' + (context.parsed.y === 1 ? singularLabel : pluralLabel);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: { size: 9 },
                        color: '#94a3b8',
                    },
                    grid: {
                        color: 'rgba(226, 232, 240, 0.4)',
                        drawBorder: false,
                    }
                },
                x: {
                    ticks: {
                        font: { size: 9 },
                        color: '#94a3b8',
                        maxRotation: 45,
                        minRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 15,
                    },
                    grid: {
                        display: false,
                    }
                }
            },
            elements: {
                bar: {
                    borderRadius: 4,
                },
                line: {
                    borderJoinStyle: 'round',
                }
            }
        }
    });

    // For line chart with few data points, we want to show points clearly
    if (chartType === 'line' && data.length <= 5) {
        chartInstances[container.id].data.datasets[0].pointRadius = 5;
        chartInstances[container.id].update();
    }
}

// ============================================================
// MAIN RENDER FUNCTION
// ============================================================

function renderDashboard() {
    const container = document.getElementById('page-DASHBOARD');

    const activeTyres = tyres.filter(t => !t.deleted);
    const activeEquip = equipment.filter(e => !e.deleted);
    const activeInsp = inspections.filter(i => !i.deleted);

    // --- KPI stats ---
    const totalTyres = activeTyres.length;
    const reserveCount = activeTyres.filter(t => t.status === 'reserve').length;
    const criticalCount = activeTyres.filter(t => t.status === 'critical').length;
    const assetTypeCount = new Set(activeEquip.map(e => e.type)).size;

    // --- Inspection grouping ---
    const grouped = groupInspectionsByPeriod(activeInsp, dashboardPeriod);
    const totalInspectionsInPeriod = grouped.reduce((sum, g) => sum + g.count, 0);

    // --- Chart container (Canvas for Chart.js) ---
    const chartContainerId = 'dashboard-chart-container';
    const chartHtml = `
        <div class="h-56 w-full">
            <canvas id="${chartContainerId}" class="h-full w-full"></canvas>
        </div>
    `;

    // --- Period & Chart type selectors ---
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
                        <button 
                            onclick="setDashboardPeriod('${p.value}')" 
                            class="px-3 py-1.5 text-xs font-semibold transition-colors ${dashboardPeriod === p.value ? 'bg-[#3d3c41] text-white' : 'text-slate-600 hover:bg-slate-50'}"
                        >
                            ${p.label}
                        </button>
                    `).join('')}
                </div>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-xs text-slate-500 font-medium">Chart:</span>
                <div class="flex rounded-md border border-slate-200 overflow-hidden bg-white">
                    ${chartTypeOptions.map(c => `
                        <button 
                            onclick="setDashboardChartType('${c.value}')" 
                            class="px-3 py-1.5 text-xs font-semibold transition-colors ${dashboardChartType === c.value ? 'bg-[#3d3c41] text-white' : 'text-slate-600 hover:bg-slate-50'}"
                        >
                            ${c.label}
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    // --- Donut chart ---
    const statusOrder = ['active', 'warning', 'critical', 'reserve', 'terminated'];
    const statusCounts = statusOrder.map(s => ({
        s,
        v: activeTyres.filter(t => t.status === s).length,
        c: STATUS_COLORS[s]
    })).filter(d => d.v > 0);

    const circumference = 2 * Math.PI * 60;
    let offset = 0;
    const donutCircles = totalTyres === 0
        ? `<circle cx="80" cy="80" r="60" fill="none" stroke="#e2e8f0" stroke-width="20" />`
        : statusCounts.map(d => {
            const len = (d.v / totalTyres) * circumference;
            const circle = `<circle cx="80" cy="80" r="60" fill="none" stroke="${d.c}" stroke-width="20" stroke-dasharray="${len} ${circumference - len}" stroke-dashoffset="${-offset}" />`;
            offset += len;
            return circle;
        }).join('');

    const legendHtml = totalTyres === 0
        ? `<li class="py-2 text-center text-slate-500">No tyres registered yet</li>`
        : statusCounts.map(d => `
            <li class="flex items-center justify-between">
                <span class="flex items-center gap-2">
                    <span class="h-2 w-2 rounded-full" style="background:${d.c}"></span>
                    ${d.s.charAt(0).toUpperCase() + d.s.slice(1)}
                </span>
                <span class="font-semibold">${Math.round((d.v / totalTyres) * 100)}%</span>
            </li>
        `).join('');

    // --- Recent activity: pulled from the real, persisted activity log
    // (see logActivity() in main.js), not just a snapshot of current state.
    const recentActivity = [...activityLog].sort((a, b) => b.timestamp - a.timestamp).slice(0, 6);
    const dotClass = { emerald: 'bg-emerald-500', sky: 'bg-orange-500', amber: 'bg-amber-500', red: 'bg-red-500', slate: 'bg-slate-400' };

    const activityHtml = recentActivity.length === 0
        ? `<li class="py-8 text-center text-sm text-slate-500">No activity yet — register a tyre or log an inspection to get started.</li>`
        : recentActivity.map(a => `
            <li class="flex items-center gap-3 py-3">
                <span class="h-2.5 w-2.5 shrink-0 rounded-full ${dotClass[a.color] || dotClass.slate}"></span>
                <span class="flex-1 text-sm text-slate-700">${escapeHtml(a.message)}</span>
                <span class="shrink-0 text-xs text-slate-400">${typeof formatActivityTimestamp === 'function' ? formatActivityTimestamp(a.timestamp) : new Date(a.timestamp).toLocaleString()}</span>
            </li>
        `).join('');

    // --- Build full dashboard ---
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Header with selectors -->
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 class="text-2xl font-bold text-slate-900">Dashboard</h2>
                    <p class="text-sm text-slate-500">Fleet overview and key indicators</p>
                </div>
                ${selectorHtml}
            </div>

            <!-- KPI Cards -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Total Tyres</div>
                    <div class="mt-2 text-3xl font-bold text-slate-900">${totalTyres}</div>
                    <div class="mt-1 text-xs text-slate-500">${totalTyres === 0 ? 'None registered yet' : reserveCount + ' in reserve stock'}</div>
                </div>
                <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Active Equipment</div>
                    <div class="mt-2 text-3xl font-bold text-slate-900">${activeEquip.length}</div>
                    <div class="mt-1 text-xs text-slate-500">${activeEquip.length === 0 ? 'None registered yet' : assetTypeCount + ' asset type' + (assetTypeCount === 1 ? '' : 's')}</div>
                </div>
                <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Inspections (${dashboardPeriod})</div>
                    <div class="mt-2 text-3xl font-bold text-slate-900">${totalInspectionsInPeriod}</div>
                    <div class="mt-1 text-xs text-slate-500">${grouped.length} ${dashboardPeriod} period${grouped.length === 1 ? '' : 's'}</div>
                </div>
                <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Critical Alerts</div>
                    <div class="mt-2 text-3xl font-bold ${criticalCount > 0 ? 'text-red-600' : 'text-slate-900'}">${criticalCount}</div>
                    <div class="mt-1 text-xs ${criticalCount > 0 ? 'text-red-400' : 'text-emerald-600'}">${criticalCount > 0 ? 'Needs attention' : 'All clear'}</div>
                </div>
            </div>

            <!-- Charts -->
            <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <!-- Trend chart -->
                <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                    <div class="mb-4 flex items-center justify-between">
                        <h3 class="text-sm font-semibold text-slate-900">Inspection Trends (${dashboardPeriod})</h3>
                        <span class="text-xs text-slate-500">${grouped.length} ${dashboardPeriod} period${grouped.length === 1 ? '' : 's'}</span>
                    </div>
                    ${chartHtml}
                </div>

                <!-- Donut chart -->
                <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 class="mb-4 text-sm font-semibold text-slate-900">Tyre Status Distribution</h3>
                    <div class="relative mx-auto h-44 w-44">
                        <svg viewBox="0 0 160 160" class="h-full w-full -rotate-90">
                            ${donutCircles}
                        </svg>
                        <div class="absolute inset-0 flex flex-col items-center justify-center">
                            <div class="text-2xl font-bold">${totalTyres}</div>
                            <div class="text-[10px] uppercase tracking-wide text-slate-500">Total</div>
                        </div>
                    </div>
                    <ul class="mt-4 space-y-1 text-xs">
                        ${legendHtml}
                    </ul>
                </div>
            </div>

            <!-- Recent activity -->
            <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="mb-4 flex items-center justify-between">
                    <h3 class="text-sm font-semibold text-slate-900">Recent Activity</h3>
                    <button onclick="navigate('ACTIVITY')" class="text-xs font-semibold text-orange-600 hover:underline">View All →</button>
                </div>
                <ul class="divide-y divide-slate-100">
                    ${activityHtml}
                </ul>
            </div>
        </div>
    `;

    // --- Render the chart using Chart.js ---
    const canvas = document.getElementById(chartContainerId);
    if (canvas) {
        if (grouped.length === 0) {
            const parent = canvas.parentElement;
            parent.innerHTML = `<div class="flex h-full items-center justify-center text-sm text-slate-500">No inspections in this period</div>`;
        } else if (typeof Chart === 'undefined') {
            // Defensive guard: if the Chart.js CDN script failed to load (network
            // issue, blocked script, or missing <script> tag), fail gracefully
            // instead of throwing and blanking out the whole Dashboard page.
            const parent = canvas.parentElement;
            parent.innerHTML = `<div class="flex h-full items-center justify-center px-4 text-center text-sm text-slate-500">Chart library failed to load. Check your network connection, or that the Chart.js script tag is present in index.html.</div>`;
        } else {
            renderChartWithChartJS(canvas, grouped, dashboardChartType, dashboardPeriod);
        }
    }
}

// ============================================================
// CONTROL FUNCTIONS (exposed globally)
// ============================================================

function setDashboardPeriod(period) {
    dashboardPeriod = period;
    renderDashboard();
}

function setDashboardChartType(type) {
    dashboardChartType = type;
    renderDashboard();
}

// Expose to global scope for inline onclick handlers
window.setDashboardPeriod = setDashboardPeriod;
window.setDashboardChartType = setDashboardChartType;
window.dashboardPeriod = dashboardPeriod;
window.dashboardChartType = dashboardChartType;