// ============================================================
// ACTIVITY LOG PAGE — full history, not just a Dashboard snapshot
// ============================================================

// Formats a real timestamp (ms since epoch) as e.g. "23 Jul 2026, 14:35"
function formatActivityTimestamp(ts) {
    const d = new Date(ts);
    if (isNaN(d)) return '—';
    const datePart = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const timePart = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return `${datePart}, ${timePart}`;
}

const ACTIVITY_DOT_CLASS = {
    emerald: 'bg-emerald-500',
    sky: 'bg-orange-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    slate: 'bg-slate-400'
};

function renderActivity() {
    const container = document.getElementById('page-ACTIVITY');
    const entries = [...activityLog].sort((a, b) => b.timestamp - a.timestamp);

    container.innerHTML = `
        <div class="space-y-4">
            <div>
                <button onclick="navigate(isCurrentUserAdmin() ? 'ADMIN' : 'DASHBOARD')" class="mb-1 text-xs text-orange-600 hover:underline">← Back to ${isCurrentUserAdmin() ? 'Admin Dashboard' : 'Dashboard'}</button>
                <h2 class="text-2xl font-bold text-slate-900">Activity Log</h2>
                <p class="text-sm text-slate-500">Full history of everything logged across tyres, equipment, and inspections</p>
            </div>
            <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                ${entries.length === 0 ? `
                    <div class="py-10 text-center text-sm text-slate-500">No activity recorded yet.</div>
                ` : `
                    <ul class="divide-y divide-slate-100">
                        ${entries.map(a => `
                            <li class="flex items-start gap-3 py-3">
                                <span class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${ACTIVITY_DOT_CLASS[a.color] || ACTIVITY_DOT_CLASS.slate}"></span>
                                <div class="min-w-0 flex-1">
                                    <div class="text-sm text-slate-700">${escapeHtml(a.message)}</div>
                                    ${a.meta ? `<div class="text-xs text-slate-500">${escapeHtml(a.meta)}</div>` : ''}
                                </div>
                                <div class="shrink-0 whitespace-nowrap text-xs text-slate-400">${formatActivityTimestamp(a.timestamp)}</div>
                            </li>
                        `).join('')}
                    </ul>
                `}
            </div>
        </div>
    `;
}