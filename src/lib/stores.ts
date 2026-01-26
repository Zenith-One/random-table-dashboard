import { writable } from 'svelte/store';
import type { RandomTable, Dashboard } from './types';

// Helper to migrate old table entries from value to columns
function migrateTableEntry(entry: any): any {
	if (entry.value !== undefined && entry.columns === undefined) {
		// Old format: convert value to columns array
		return {
			...entry,
			columns: [entry.value],
			value: undefined
		};
	}
	return entry;
}

// Helper to migrate tables array
function migrateTables(tables: RandomTable[]): RandomTable[] {
	return tables.map(table => ({
		...table,
		entries: table.entries.map(migrateTableEntry)
	}));
}

// Helper to create a localStorage-backed store
function createLocalStorageStore<T>(key: string, initialValue: T) {
	const isBrowser = typeof window !== 'undefined';

	// Load from localStorage if available
	const stored = isBrowser ? localStorage.getItem(key) : null;
	let initial = stored ? JSON.parse(stored) : initialValue;

	// Migrate tables if this is the tables store
	if (key === 'tables' && Array.isArray(initial)) {
		initial = migrateTables(initial as any) as T;
	}

	const store = writable<T>(initial);

	// Save to localStorage on updates (only in browser)
	if (isBrowser) {
		store.subscribe(value => {
			localStorage.setItem(key, JSON.stringify(value));
		});
	}

	return store;
}

// Stores
export const tables = createLocalStorageStore<RandomTable[]>('tables', []);
export const dashboards = createLocalStorageStore<Dashboard[]>('dashboards', []);

// Helper functions
export function addTable(table: RandomTable) {
	tables.update(t => [...t, table]);
}

export function updateTable(id: string, updates: Partial<RandomTable>) {
	tables.update(t =>
		t.map(table => table.id === id ? { ...table, ...updates, updatedAt: new Date().toISOString() } : table)
	);
}

export function deleteTable(id: string) {
	tables.update(t => t.filter(table => table.id !== id));
}

export function addDashboard(dashboard: Dashboard) {
	dashboards.update(d => [...d, dashboard]);
}

export function updateDashboard(id: string, updates: Partial<Dashboard>) {
	dashboards.update(d =>
		d.map(dash => dash.id === id ? { ...dash, ...updates, updatedAt: new Date().toISOString() } : dash)
	);
}

export function deleteDashboard(id: string) {
	dashboards.update(d => d.filter(dash => dash.id !== id));
}
