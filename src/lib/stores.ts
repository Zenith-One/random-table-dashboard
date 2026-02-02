import { writable } from 'svelte/store';
import type { RandomTable, Dashboard, RollHistoryEntry } from './types';
import { generateId } from './utils';

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
export const rollHistory = createLocalStorageStore<RollHistoryEntry[]>('rollHistory', []);

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

export function duplicateTable(id: string) {
	tables.update(t => {
		const table = t.find(table => table.id === id);
		if (!table) return t;

		const duplicatedTable: RandomTable = {
			...table,
			id: generateId(),
			name: `${table.name} (Copy)`,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		return [...t, duplicatedTable];
	});
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

// Helper to deep compare table content (excluding id and timestamps)
function isTableContentDifferent(table1: RandomTable, table2: RandomTable): boolean {
	if (table1.description !== table2.description) return true;
	if (table1.diceFormula !== table2.diceFormula) return true;
	if (JSON.stringify(table1.columnHeaders) !== JSON.stringify(table2.columnHeaders)) return true;
	if (JSON.stringify(table1.entries) !== JSON.stringify(table2.entries)) return true;
	return false;
}

// Helper to deep compare dashboard content (excluding id and timestamps)
function isDashboardContentDifferent(dash1: Dashboard, dash2: Dashboard): boolean {
	if (dash1.description !== dash2.description) return true;
	if (JSON.stringify(dash1.tableIds) !== JSON.stringify(dash2.tableIds)) return true;
	return false;
}

// Smart merge tables: compare by name, update if different, add if new
export function smartMergeTables(newTables: RandomTable[]): { added: number; updated: number } {
	let added = 0;
	let updated = 0;

	tables.update(currentTables => {
		const result = [...currentTables];

		for (const newTable of newTables) {
			// Find existing table by name (case-insensitive)
			const existingIndex = result.findIndex(
				t => t.name.toLowerCase() === newTable.name.toLowerCase()
			);

			if (existingIndex >= 0) {
				// Table exists - check if content is different
				if (isTableContentDifferent(result[existingIndex], newTable)) {
					// Update existing table, keep existing id and createdAt
					result[existingIndex] = {
						...newTable,
						id: result[existingIndex].id,
						createdAt: result[existingIndex].createdAt,
						updatedAt: new Date().toISOString()
					};
					updated++;
				}
			} else {
				// New table - add it
				result.push(newTable);
				added++;
			}
		}

		return result;
	});

	return { added, updated };
}

// Smart merge dashboards: compare by name, update if different, add if new
export function smartMergeDashboards(newDashboards: Dashboard[]): { added: number; updated: number } {
	let added = 0;
	let updated = 0;

	dashboards.update(currentDashboards => {
		const result = [...currentDashboards];

		for (const newDashboard of newDashboards) {
			// Find existing dashboard by name (case-insensitive)
			const existingIndex = result.findIndex(
				d => d.name.toLowerCase() === newDashboard.name.toLowerCase()
			);

			if (existingIndex >= 0) {
				// Dashboard exists - check if content is different
				if (isDashboardContentDifferent(result[existingIndex], newDashboard)) {
					// Update existing dashboard, keep existing id and createdAt
					result[existingIndex] = {
						...newDashboard,
						id: result[existingIndex].id,
						createdAt: result[existingIndex].createdAt,
						updatedAt: new Date().toISOString()
					};
					updated++;
				}
			} else {
				// New dashboard - add it
				result.push(newDashboard);
				added++;
			}
		}

		return result;
	});

	return { added, updated };
}

// Roll history functions
export function addRollToHistory(entry: Omit<RollHistoryEntry, 'id' | 'timestamp'>) {
	const historyEntry: RollHistoryEntry = {
		...entry,
		id: generateId(),
		timestamp: new Date().toISOString()
	};

	rollHistory.update(history => {
		const newHistory = [historyEntry, ...history];
		// Keep only the last 20 rolls
		return newHistory.slice(0, 20);
	});
}

export function clearRollHistory() {
	rollHistory.set([]);
}
