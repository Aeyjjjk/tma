if (typeof escapeHtml === 'undefined') {
    var escapeHtml = function (str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };
}

const ASSET_DB = {
    'TRK-001': { 
        name: 'Terminal Tractor 001', 
        type: 'Tractor', 
        odometer: 84210, 
        positions: [
            { pos: 'FL', tyre: 'TY-1001' },
            { pos: 'FR', tyre: 'TY-1002' },
            { pos: 'RL1', tyre: 'TY-1003' },
            { pos: 'RL2', tyre: 'TY-2001' },
            { pos: 'RR1', tyre: 'TY-2002' },
            { pos: 'RR2', tyre: 'TY-2003' }
        ] 
    },
    'TRK-002': { 
        name: 'Terminal Tractor 002', 
        type: 'Tractor', 
        odometer: 91045, 
        positions: [
            { pos: 'FL', tyre: 'TY-1004' },
            { pos: 'FR', tyre: 'TY-1005' },
            { pos: 'RL1', tyre: 'TY-2004' },
            { pos: 'RL2', tyre: 'TY-2005' },
            { pos: 'RR1', tyre: 'TY-2006' },
            { pos: 'RR2', tyre: 'TY-2007' }
        ] 
    },
    'TRL-001': { 
        name: 'Trailer 001', 
        type: 'Trailer', 
        odometer: 45120, 
        positions: [
            { pos: 'L1', tyre: 'TY-1006' },
            { pos: 'L2', tyre: 'TY-1007' },
            { pos: 'L3', tyre: 'TY-3001' },
            { pos: 'R1', tyre: 'TY-3002' },
            { pos: 'R2', tyre: 'TY-3003' },
            { pos: 'R3', tyre: 'TY-3004' }
        ] 
    },
    'TRL-002': { 
        name: 'Trailer 002', 
        type: 'Trailer', 
        odometer: 38900, 
        positions: [
            { pos: 'L1', tyre: 'TY-3005' },
            { pos: 'L2', tyre: 'TY-3006' },
            { pos: 'L3', tyre: 'TY-3007' },
            { pos: 'R1', tyre: 'TY-3008' },
            { pos: 'R2', tyre: 'TY-3009' },
            { pos: 'R3', tyre: 'TY-3010' }
        ] 
    },
    'MHC-001': { 
        name: 'Mobile Harbor Crane 001', 
        type: 'MHC', 
        odometer: 12040, 
        positions: [
            { pos: 'FL', tyre: 'TY-1008' },
            { pos: 'FR', tyre: 'TY-1009' },
            { pos: 'RL', tyre: 'TY-4001' },
            { pos: 'RR', tyre: 'TY-4002' }
        ] 
    },
    'MHC-002': { 
        name: 'Mobile Harbor Crane 002', 
        type: 'MHC', 
        odometer: 15300, 
        positions: [
            { pos: 'FL', tyre: 'TY-4003' },
            { pos: 'FR', tyre: 'TY-4004' },
            { pos: 'RL', tyre: 'TY-4005' },
            { pos: 'RR', tyre: 'TY-4006' }
        ] 
    },
    'FLK-001': { 
        name: 'Forklift 001', 
        type: 'Forklift', 
        odometer: 8210, 
        positions: [
            { pos: 'FL', tyre: 'TY-1010' },
            { pos: 'FR', tyre: 'TY-1011' },
            { pos: 'RL', tyre: 'TY-5001' },
            { pos: 'RR', tyre: 'TY-5002' }
        ] 
    },
    'FLK-002': { 
        name: 'Forklift 002', 
        type: 'Forklift', 
        odometer: 6540, 
        positions: [
            { pos: 'FL', tyre: 'TY-5003' },
            { pos: 'FR', tyre: 'TY-5004' },
            { pos: 'RL', tyre: 'TY-5005' },
            { pos: 'RR', tyre: 'TY-5006' }
        ] 
    }
};

const INITIAL_TYRES = [];

const INITIAL_EQUIPMENT = [];

const INITIAL_INSPECTIONS = [];

const INITIAL_USERS = [];

// These four lists are admin-editable from the Admin page ("Dropdown
// Lists" section) — the values below are just the starting defaults
// seeded into a brand-new database. `let` (not `const`) on purpose:
// loadData() overwrites these with whatever's actually stored once the
// app talks to Supabase, and admin.js's add/remove functions mutate them
// directly, the same pattern already used for tyres/equipment/etc.
// Fixed operational roles with real permission logic attached (see
// main.js's canManageEquipment/canManageTyres/canTerminateTyres/
// canInspectAndSwap). Deliberately NOT part of the admin-editable
// Dropdown Lists feature — those lists are just display labels, but
// these exact strings are matched by permission checks throughout the
// app, so letting an admin freely rename/remove them would silently
// break access control.
const USER_ROLES = ['Manager', 'Supervisor', 'Inspector', 'Internal User'];

let TYRE_BRANDS = ['Bridgestone', 'Continental', 'Michelin', 'Yokohama', 'Goodyear', 'Pirelli'];

let EQUIPMENT_TYPES = ['Tractor', 'Trailer', 'MHC', 'Forklift', 'Empty Handler', 'Reach Stacker', 'Light Vehicles', 'Crane', 'Truck', 'Other'];

let OBSERVATION_OPTIONS = [
    { value: 'good', label: 'Good / Even Wear', severity: 'good' },
    { value: 'uneven', label: 'Uneven Wear', severity: 'warning' },
    { value: 'lowtread', label: 'Low Tread Depth', severity: 'warning' },
    { value: 'cracking', label: 'Cracking / Weathering', severity: 'warning' },
    { value: 'underinflated', label: 'Underinflated', severity: 'warning' },
    { value: 'overinflated', label: 'Overinflated', severity: 'warning' },
    { value: 'bulge', label: 'Bulge / Sidewall Damage', severity: 'critical' },
    { value: 'puncture', label: 'Puncture / Cut', severity: 'critical' },
    { value: 'replace', label: 'Needs Replacement', severity: 'critical' }
];

let ACTION_TAKEN_OPTIONS = [
    { value: 'inflate', label: 'Inflate Tyre' },
    { value: 'replace', label: 'Replace Tyre' },
    { value: 'patch', label: 'Patch Tyre' },
    { value: 'rotate', label: 'Rotate Tyre' },
    { value: 'pressure_correct', label: 'Pressure Correct' },
    { value: 'pressure_check', label: 'Pressure Check' },
    { value: 'terminate', label: 'Terminate Tyre' },
    { value: 'change_rim', label: 'Change Rim' },
    { value: 'retighten_nut', label: 'Retighten Nut' }
];