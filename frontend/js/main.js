// ============================================================
// MAIN CONTROLLER
// ============================================================

// ----- STATE -----
let tyres = [];
let equipment = [];
let inspections = [];
let users = [];
let editingTyreSn = null;
let editingEquipId = null;
let editingInspectionId = null;
let editingUserUsername = null;
let crossRows = {};
let crossSource = null; // real equipment id chosen by the user — no hardcoded default
let swapView = 'menu'; // 'menu' | 'cross' | 'same' | 'terminate'
let sameAssetId = null;
let samePicks = []; // up to 2 tyre serials selected to swap positions with each other
let inspectionView = 'list'; // 'list' | 'new'
let inspectionAsset = null;
let inspectionRows = {};
let inspectionSearch = '';
let inspectionDate = '';
let inspectionOdo = '';
let activityLog = [];

// ----- CURRENT USER / AUTH -----
// Real auth now lives server-side: the backend verifies the password
// against a bcrypt hash and sets an httpOnly session cookie that this JS
// can never read (see js/api.js). CURRENT_USER/loggedInUsername here are
// just local UI convenience — the actual access control is enforced by
// the server on every request, not by this variable.
let CURRENT_USER = null;
let loggedInUsername = null;

function isCurrentUserAdmin() {
    const u = users.find(x => x.username === loggedInUsername);
    return !!(u && u.isAdmin && !u.deleted);
}

// ----- ROLE-BASED PERMISSIONS -----
// Admins bypass every check below — an admin account can always do
// everything, regardless of their "role" field. Permission matrix, per
// the operational roles set on the Users page:
//
//                        Manager  Supervisor  Inspector  Internal User
//   Register Equipment      ✓         ✗           ✗            ✗
//   Edit/Delete Equipment   ✓         ✗           ✗            ✗
//   Terminate Tyre          ✓         ✗           ✗            ✗
//   Register/Edit/Delete
//     Tyre                 ✓         ✓           ✗            ✗
//   Log/Edit Inspection     ✓         ✓           ✓            ✗
//   Swap Tyres              ✓         ✓           ✓            ✗
//   View everything         ✓         ✓           ✓            ✓
//
// This is enforced here in the UI (hiding/blocking actions) — it is
// NOT enforced at the database level. The shared app_state table
// currently allows any authenticated user to write to it (same as
// before this feature), so this mirrors how tyre/equipment access has
// worked in this app all along, just with an additional UI-level layer
// now driven by role instead of only by isAdmin. A fully hardened
// version would normalize tyres/equipment into their own tables with
// row-level policies keyed off role — a bigger schema change; ask if
// you want that taken further.
const ASSET_MANAGER_ROLES = ['Manager'];
const TYRE_MANAGER_ROLES = ['Manager', 'Supervisor'];
const OPERATIONAL_ROLES = ['Manager', 'Supervisor', 'Inspector'];

function currentUserRole() {
    const u = users.find(x => x.username === loggedInUsername);
    return u ? u.role : null;
}
function canManageEquipment() {
    return isCurrentUserAdmin() || ASSET_MANAGER_ROLES.includes(currentUserRole());
}
function canTerminateTyres() {
    return isCurrentUserAdmin() || ASSET_MANAGER_ROLES.includes(currentUserRole());
}
function canManageTyres() {
    return isCurrentUserAdmin() || TYRE_MANAGER_ROLES.includes(currentUserRole());
}
function canInspectAndSwap() {
    return isCurrentUserAdmin() || OPERATIONAL_ROLES.includes(currentUserRole());
}
// Deleting is stricter than the general "manage" capabilities above —
// only Manager and Administrator can delete anything (tyres, equipment,
// inspections), even roles that can register/edit those same records
// (e.g. a Supervisor can register and edit tyres, but not delete one).
function canDeleteRecords() {
    return isCurrentUserAdmin() || ASSET_MANAGER_ROLES.includes(currentUserRole());
}

function showLoginScreen() {
    const el = document.getElementById('loginScreen');
    if (el) el.style.display = 'flex';
}

function hideLoginScreen() {
    const el = document.getElementById('loginScreen');
    if (el) el.style.display = 'none';
}

// Asks the server whether the browser's session cookie (if any) is still
// valid, rather than trusting anything stored locally. Accounts are
// created only by an admin — see users.js/modals.js — there is no
// self-registration flow anywhere in this app.
const VALID_PAGES = ['DASHBOARD','TYRES','EQUIPMENT','INSPECTIONS','SWAP','USERS','ANALYTICS','EXPORT','PROFILE','ACTIVITY','ADMIN'];
const OPERATIONAL_ONLY_PAGES = ['DASHBOARD','TYRES','EQUIPMENT','INSPECTIONS','SWAP'];

// Restores whichever page the user was on before the reload, instead of
// always dropping them back on Dashboard — but keeps it role-appropriate:
// an admin should never land back on an operational page like Tyres, and
// a regular user should never land on the admin-only Admin page.
function restoreLastPage() {
    let lastPage = localStorage.getItem('ftlms-currentpage');
    if (!VALID_PAGES.includes(lastPage)) lastPage = null;
    if (isCurrentUserAdmin()) {
        if (!lastPage || OPERATIONAL_ONLY_PAGES.includes(lastPage)) lastPage = 'ADMIN';
    } else if (lastPage === 'ADMIN') {
        lastPage = 'DASHBOARD';
    }
    navigate(lastPage || 'DASHBOARD');
}

async function checkLoginSession() {
    try {
        const { user } = await api.me();
        loggedInUsername = user.username;
        CURRENT_USER = user.name;
        hideLoginScreen();
        await loadData();
        renderAll();
        restoreLastPage();
        startLivePolling();
    } catch (err) {
        loggedInUsername = null;
        CURRENT_USER = null;
        showLoginScreen();
        const errorEl = document.getElementById('loginError');
        if ((err && err.message === 'ACCOUNT_INACTIVE') || localStorage.getItem('ftlms-inactivenotice')) {
            localStorage.removeItem('ftlms-inactivenotice');
            if (errorEl) {
                errorEl.textContent = 'Account inactive. Contact your administrator.';
                errorEl.classList.remove('hidden', 'bg-sky-50', 'text-sky-700');
                errorEl.classList.add('bg-red-50', 'text-red-600');
            }
        } else if (localStorage.getItem('ftlms-postresetnotice')) {
            localStorage.removeItem('ftlms-postresetnotice');
            if (errorEl) {
                errorEl.textContent = 'All data was reset. Sign back in with admin / admin123 (or your own account, once recreated).';
                errorEl.classList.remove('hidden', 'bg-red-50', 'text-red-600');
                errorEl.classList.add('bg-sky-50', 'text-sky-700');
            }
        }
    }
}

// Toggles the login button between its normal label and a spinner, and
// disables the form fields while a login attempt is in flight — so a
// slow connection or a double-click can't fire two overlapping attempts.
function setLoginSubmitting(isSubmitting) {
    const btn = document.getElementById('loginSubmitBtn');
    const spinner = document.getElementById('loginSubmitSpinner');
    const label = document.getElementById('loginSubmitLabel');
    if (!btn) return;
    btn.disabled = isSubmitting;
    if (spinner) spinner.classList.toggle('hidden', !isSubmitting);
    if (label) label.textContent = isSubmitting ? 'Signing in…' : 'Log In';
    ['loginUsername', 'loginPassword', 'loginRememberMe'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = isSubmitting;
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function attemptLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('loginRememberMe')?.checked ?? true;
    const errorEl = document.getElementById('loginError');

    setLoginSubmitting(true);
    errorEl.classList.add('hidden');

    // Minimum spinner time so it doesn't just flash for a fraction of a
    // second on a fast connection — gives the backend (auth, the initial
    // shared-data load, and the Realtime subscription) a moment to fully
    // settle before the dashboard appears, rather than revealing it the
    // instant the login call itself resolves.
    const MIN_LOGIN_DELAY_MS = 5000;

    let result;
    try {
        [result] = await Promise.all([
            api.login(username, password, rememberMe),
            sleep(MIN_LOGIN_DELAY_MS)
        ]);
    } catch (err) {
        setLoginSubmitting(false);
        errorEl.textContent = err.message || 'Invalid username or password.';
        errorEl.classList.remove('hidden');
        return;
    }

    loggedInUsername = result.user.username;
    CURRENT_USER = result.user.name;
    document.getElementById('loginPassword').value = '';
    errorEl.classList.add('hidden');
    await loadData();
    hideLoginScreen();
    setLoginSubmitting(false);
    renderNav(); // refresh nav so it shows the correct set of tabs for this role
    navigate(isCurrentUserAdmin() ? 'ADMIN' : 'DASHBOARD');
    startLivePolling();
    showToast(`Welcome back, ${result.user.name}!`);
}

// Toggles the login password field between hidden (dots) and visible
// (plain text), and swaps the icon to reflect the current state — purely
// a convenience for typing it correctly, doesn't affect what's actually
// sent anywhere.
function toggleLoginPasswordVisibility() {
    const input = document.getElementById('loginPassword');
    const icon = document.getElementById('loginPasswordEyeIcon');
    const showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    icon.innerHTML = showing
        ? `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/>`
        : `<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.44 21.44 0 0 1 5.06-6.06M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.44 21.44 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;
}

// Dummy "Forgot password?" flow — UI only, purely for demo purposes.
// Doesn't send anything anywhere or touch Supabase; just walks through
// the motions of a reset-password flow and ends with a clear "this isn't
// wired up yet" message, so it's obvious to anyone testing that this
// isn't a real reset mechanism.
function showForgotPasswordDemo() {
    const modal = document.getElementById('confirmModal');
    modal.innerHTML = `
        <div class="modal-content" style="max-width:400px;">
            <div class="mb-3 flex items-start gap-3">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="10" rx="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                </div>
                <div class="min-w-0 flex-1 pt-1.5">
                    <h3 class="text-base font-bold text-slate-900">Forgot password?</h3>
                    <p class="mt-1 text-sm text-slate-600">Enter your username and we'll send a reset link.</p>
                </div>
            </div>
            <input id="forgotPasswordUsername" class="input-field" placeholder="Username" onkeydown="if(event.key==='Enter') submitForgotPasswordDemo()" />
            <div class="mt-4 flex justify-end gap-2">
                <button onclick="closeConfirm()" class="rounded-md border border-slate-300 px-4 py-2 text-sm">Cancel</button>
                <button onclick="submitForgotPasswordDemo()" class="rounded-md bg-[#3d3c41] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Send Reset Link</button>
            </div>
        </div>
    `;
    modal.classList.add('active');
}

function submitForgotPasswordDemo() {
    closeConfirm();
    showToast("This is a demo — password reset isn't set up yet. Contact your administrator to reset your password.");
}

function logout() {
    showConfirm(
        'You will be signed out.',
        async () => {
            stopLivePolling();
            try { await api.logout(); } catch { /* cookie may already be gone — reload anyway */ }
            location.reload();
        },
        { title: 'Log out?', confirmLabel: 'Log Out', tone: 'neutral' }
    );
}

// ----- HELPERS -----
// Opens a real native file picker restricted to images, reads the chosen
// file as a data URL, and hands it to onLoaded(dataUrl, file). This app has
// no backend to upload to, so the photo itself (as a data URL) IS the
// attachment — it gets stored directly on the record and persists via
// localStorage like everything else. Rejects files over maxSizeMB to avoid
// blowing past localStorage's limits with a single huge photo.
function pickImageFile(onLoaded, maxSizeMB) {
    maxSizeMB = maxSizeMB || 3;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
        const file = input.files && input.files[0];
        if (!file) return;
        if (file.size > maxSizeMB * 1024 * 1024) {
            showToast(`Image too large — please choose one under ${maxSizeMB}MB`);
            return;
        }
        const reader = new FileReader();
        reader.onload = () => onLoaded(reader.result, file);
        reader.onerror = () => showToast('Could not read that image file');
        reader.readAsDataURL(file);
    };
    input.click();
}

function genId(prefix) {
    return (prefix || 'ID') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// Records a real, timestamped entry in the persistent activity log —
// distinct from the various render*() functions, which just derive a
// snapshot of "current state" each time they run. This is an actual
// growing history of what happened and when, used by the Dashboard's
// Recent Activity feed and the full Activity page ("View All").
function logActivity(message, color, meta) {
    pushActivityLocal(message, color, meta);
    saveData();
}

// Pushes an entry to the in-memory activity log without triggering its
// own save — used when the caller is about to save anyway (e.g. as part
// of a single config-list update) and firing a second, separate,
// unawaited saveData() right alongside it would race the first request
// instead of the two landing as one atomic write.
function pushActivityLocal(message, color, meta) {
    activityLog.unshift({
        id: genId('ACT'),
        timestamp: Date.now(),
        message,
        color: color || 'sky',
        meta: meta || '',
        user: CURRENT_USER || 'Unknown'
    });
    // Cap growth so localStorage doesn't balloon indefinitely.
    if (activityLog.length > 500) activityLog = activityLog.slice(0, 500);
}

// Escapes free-text user input before it's inserted into HTML templates.
// Without this, a pasted string containing a `"` or `>` character can break
// out of an attribute or tag early, corrupting the surrounding markup —
// which is what happens if raw code/long text is pasted into a notes field.
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function statusStyle(s) {
    const map = { 
        active: 'bg-emerald-100 text-emerald-700', 
        warning: 'bg-amber-100 text-amber-700', 
        critical: 'bg-red-100 text-red-700', 
        reserve: 'bg-sky-100 text-sky-700', 
        terminated: 'bg-slate-200 text-slate-700' 
    };
    return map[s] || map.active;
}

function resultStyle(r) {
    const map = { 
        good: 'bg-emerald-100 text-emerald-700', 
        warning: 'bg-amber-100 text-amber-700', 
        critical: 'bg-red-100 text-red-700' 
    };
    return map[r] || map.good;
}

function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 3000);
}

function initTheme() {
    const saved = localStorage.getItem('ftlms-theme');
    const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : prefers;
    document.documentElement.classList.toggle('dark', isDark);
    const icon = document.getElementById('themeIcon');
    if (icon) {
        if (isDark) {
            icon.innerHTML = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>';
        } else {
            icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
        }
    }
}

// ----- PERSISTENCE -----
// Data now lives on Supabase, shared by every authorized user, not
// trapped in one browser's localStorage. Passwords never appear anywhere
// in this state — see js/api.js and supabase/.
function applyConfigLists(configLists) {
    // Falls back to keeping data.js's defaults if the server has none yet
    // (e.g. migration 0002 hasn't been run against this database) —
    // dropdowns just work with the built-in defaults until then.
    if (!configLists) return;
    if (Array.isArray(configLists.tyreBrands)) TYRE_BRANDS = configLists.tyreBrands;
    if (Array.isArray(configLists.equipmentTypes)) EQUIPMENT_TYPES = configLists.equipmentTypes;
    if (Array.isArray(configLists.observationOptions)) OBSERVATION_OPTIONS = configLists.observationOptions;
    if (Array.isArray(configLists.actionTakenOptions)) ACTION_TAKEN_OPTIONS = configLists.actionTakenOptions;
    window.TYRE_BRANDS = TYRE_BRANDS;
    window.EQUIPMENT_TYPES = EQUIPMENT_TYPES;
    window.OBSERVATION_OPTIONS = OBSERVATION_OPTIONS;
    window.ACTION_TAKEN_OPTIONS = ACTION_TAKEN_OPTIONS;
}

async function loadData() {
    try {
        const state = await api.getState();
        tyres = state.tyres || [];
        equipment = state.equipment || [];
        inspections = state.inspections || [];
        users = state.users || [];
        activityLog = state.activityLog || [];
        lastKnownStateUpdatedAt = state.updatedAt || 0;
        applyConfigLists(state.configLists);
    } catch (err) {
        showToast('Could not load data from the server: ' + err.message);
        return;
    }

    // Repair any tyre saved in an impossible state before this rule
    // existed: marked Reserve but still carrying an equipment assignment.
    // That made it show up as "assigned" (and therefore inspectable) on
    // equipment it was never actually installed on.
    tyres = tyres.map(t => (t.status === 'reserve' && t.equip && t.equip !== '—')
        ? { ...t, equip: '—', pos: '—' }
        : t);

    // Migrate any legacy inspection records that don't yet have a stable id
    // (older records were matched by date+asset, which breaks once a date is edited).
    inspections = inspections.map(i => i.id ? i : { ...i, id: genId('INSP') });

    window.tyres = tyres;
    window.equipment = equipment;
    window.inspections = inspections;
    window.users = users;
    window.activityLog = activityLog;
}

// configListsOverride is only passed when the admin is actually editing a
// dropdown list (see admin.js) — every other page's ordinary saveData()
// call leaves it undefined, so the admin-only database trigger on that
// column never has a reason to fire for routine tyre/equipment/inspection
// saves.
async function saveData(configListsOverride) {
    try {
        const payload = { tyres, equipment, inspections, users, activityLog };
        if (configListsOverride !== undefined) payload.configLists = configListsOverride;
        const state = await api.saveState(payload);
        // The server is the source of truth (e.g. it strips anything
        // password-related and applies its own merge for users) — adopt
        // what it hands back rather than assuming our local copy matches.
        tyres = state.tyres || [];
        equipment = state.equipment || [];
        inspections = state.inspections || [];
        users = state.users || [];
        activityLog = state.activityLog || [];
        lastKnownStateUpdatedAt = state.updatedAt || 0;
        applyConfigLists(state.configLists);
        window.tyres = tyres;
        window.equipment = equipment;
        window.inspections = inspections;
        window.users = users;
        window.activityLog = activityLog;
        return true;
    } catch (err) {
        showToast('Could not save to the server: ' + err.message);
        return false;
    }
}

// ----- LIVE UPDATES -----
// Supabase Realtime pushes a message the instant app_state or profiles
// change server-side (see supabase/migrations/0001_init.sql), so this is
// genuine push, not polling. Skips the refresh+re-render while any modal
// is open, so it never yanks an input out from under someone mid-edit —
// the next change event (or the person closing the modal and triggering
// their own save) will catch it up.
let lastKnownStateUpdatedAt = 0;

function startLivePolling() {
    api.subscribeToChanges(async () => {
        try {
            const state = await api.getState();

            // Check whether OUR OWN account was just deactivated or removed
            // — this takes effect immediately, even mid-edit with a modal
            // open, since letting a deactivated account keep working (or
            // keep seeing shared data) defeats the point of deactivating
            // them. Everything else below this still respects the
            // modal-open guard, so an in-progress edit is never disrupted
            // for ordinary shared-data updates.
            const me = (state.users || []).find(u => u.username === loggedInUsername);
            if (!me || me.deleted || me.status === 'Inactive') {
                stopLivePolling();
                try { await api.logout(); } catch { /* proceed regardless */ }
                localStorage.setItem('ftlms-inactivenotice', '1');
                location.reload();
                return;
            }

            if (document.querySelector('.modal-overlay.active')) return; // don't disrupt an open modal
            if (state.updatedAt === lastKnownStateUpdatedAt) return; // nothing else changed
            tyres = state.tyres || [];
            equipment = state.equipment || [];
            inspections = state.inspections || [];
            users = state.users || [];
            activityLog = state.activityLog || [];
            lastKnownStateUpdatedAt = state.updatedAt || 0;
            applyConfigLists(state.configLists);
            window.tyres = tyres;
            window.equipment = equipment;
            window.inspections = inspections;
            window.users = users;
            window.activityLog = activityLog;
            renderAll();
        } catch {
            // A transient network hiccup shouldn't spam the user — the
            // next change event will catch things up regardless.
        }
    });
}

function stopLivePolling() {
    api.unsubscribe();
}

function resetAllData() {
    if (!isCurrentUserAdmin()) { showToast('Only an administrator can reset data'); return; }
    showConfirm('Reset ALL data back to the demo defaults? This cannot be undone.', async () => {
        try {
            await api.resetAll();
        } catch (err) {
            showToast('Could not reset data: ' + err.message);
            return;
        }
        // The admin's own account (whatever they were actually logged in
        // as) no longer exists after the reset — only the new bootstrap
        // admin does. Force a clean re-login rather than leaving them in
        // a half-authenticated state. The notice is shown on the login
        // screen itself (see checkLoginSession) rather than a native
        // alert(), consistent with this app's own styled UI.
        localStorage.setItem('ftlms-postresetnotice', '1');
        stopLivePolling();
        try { await api.logout(); } catch { /* proceed regardless */ }
        location.reload();
    }, { title: 'Reset all data?', confirmLabel: 'Reset Everything' });
}

// ----- NAVIGATION -----
function navigate(page) {
    // Server-side-equivalent guard, not just hiding the nav button: even
    // a restored "last page" from localStorage, or a stray function call,
    // can't land someone on a page their role shouldn't reach.
    if (page === 'USERS' && !isCurrentUserAdmin()) {
        showToast('Only an administrator can view Users');
        page = 'DASHBOARD';
    }
    if (page === 'ANALYTICS' && !isCurrentUserAdmin() && currentUserRole() === 'Inspector') {
        showToast('Analytics is not available for your role');
        page = 'DASHBOARD';
    }
    if (page === 'EXPORT' && !isCurrentUserAdmin() && ['Inspector', 'Supervisor', 'Internal User'].includes(currentUserRole())) {
        showToast('Export is not available for your role');
        page = 'DASHBOARD';
    }

    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'transparent';
        btn.style.color = '#cbd5e1';
    });
    document.querySelectorAll(`.nav-btn[data-page="${page}"], .mobile-nav-btn[data-page="${page}"]`).forEach(activeBtn => {
        activeBtn.classList.add('active');
        activeBtn.style.background = '#6d6c70';
        activeBtn.style.color = '#e2694a';
    });

    localStorage.setItem('ftlms-currentpage', page);

    switch(page) {
        case 'DASHBOARD': renderDashboard(); break;
        case 'TYRES': renderTyres(); break;
        case 'EQUIPMENT': renderEquipment(); break;
        case 'INSPECTIONS': renderInspections(); break;
        case 'SWAP': renderSwap(); break;
        case 'USERS': renderUsers(); break;
        case 'ANALYTICS': renderAnalytics(); break;
        case 'EXPORT': renderExport(); break;
        case 'PROFILE': renderProfile(); break;
        case 'ACTIVITY': renderActivity(); break;
        case 'ADMIN': renderAdmin(); break;
    }
}

// ----- RENDER ALL -----
function renderAll() {
    renderNav();
    renderDashboard();
    renderTyres();
    renderEquipment();
    renderInspections();
    renderSwap();
    renderUsers();
    renderAnalytics();
    renderExport();
    renderProfile();
}

// ----- EXPOSE GLOBALLY -----
window.tyres = tyres;
window.equipment = equipment;
window.inspections = inspections;
window.activityLog = activityLog;
window.users = users;
window.editingTyreSn = editingTyreSn;
window.editingEquipId = editingEquipId;
window.editingInspectionId = editingInspectionId;
window.editingUserUsername = editingUserUsername;
window.crossRows = crossRows;
window.crossSource = crossSource;
window.swapView = swapView;
window.sameAssetId = sameAssetId;
window.samePicks = samePicks;
window.inspectionView = inspectionView;
window.inspectionAsset = inspectionAsset;
window.inspectionRows = inspectionRows;
window.inspectionSearch = inspectionSearch;
window.inspectionDate = inspectionDate;
window.inspectionOdo = inspectionOdo;
window.statusStyle = statusStyle;
window.resultStyle = resultStyle;
window.genId = genId;
window.escapeHtml = escapeHtml;
window.pickImageFile = pickImageFile;
window.CURRENT_USER = CURRENT_USER;
window.loggedInUsername = loggedInUsername;
window.isCurrentUserAdmin = isCurrentUserAdmin;
window.attemptLogin = attemptLogin;
window.logout = logout;
window.logActivity = logActivity;
window.CURRENT_USER = CURRENT_USER;
window.showToast = showToast;
window.loadData = loadData;
window.saveData = saveData;
window.resetAllData = resetAllData;
window.navigate = navigate;
window.renderAll = renderAll;

// ----- INIT -----
initTheme();
checkLoginSession();

console.log('FTLMS (Supabase edition)');