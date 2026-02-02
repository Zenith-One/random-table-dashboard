import type { RandomTable, RandomTableEntry } from './types';

/**
 * Parse a dice formula (e.g., "1d20", "2d6") and roll it
 */
export function rollDice(formula: string): number {
	const match = formula.match(/^(\d+)d(\d+)$/i);
	if (!match) return 1;

	const [, numDice, sides] = match;
	const num = parseInt(numDice, 10);
	const die = parseInt(sides, 10);

	let total = 0;
	for (let i = 0; i < num; i++) {
		total += Math.floor(Math.random() * die) + 1;
	}

	return total;
}

/**
 * Roll on a random table and get a result
 */
export function rollTable(table: RandomTable): { roll: number; entry: RandomTableEntry } {
	const { entries, diceFormula } = table;

	if (entries.length === 0) {
		throw new Error('Table has no entries');
	}

	// If dice formula is provided, use it
	if (diceFormula) {
		const roll = rollDice(diceFormula);
		// Find the entry with matching id or index
		const entry = entries[Math.min(roll - 1, entries.length - 1)] || entries[0];
		return { roll, entry };
	}

	// Check if any entries have weights
	const hasWeights = entries.some(e => e.weight !== undefined && e.weight > 0);

	if (hasWeights) {
		// Weighted random selection
		const totalWeight = entries.reduce((sum, e) => sum + (e.weight || 1), 0);
		let random = Math.random() * totalWeight;

		for (const entry of entries) {
			random -= entry.weight || 1;
			if (random <= 0) {
				return { roll: -1, entry }; // -1 indicates weighted roll (no specific number)
			}
		}
	}

	// Simple random selection
	const index = Math.floor(Math.random() * entries.length);
	return { roll: index + 1, entry: entries[index] };
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Export app data as JSON with metadata
 */
export function exportAppData(tables: RandomTable[], dashboards: any[]): string {
	const exportData = {
		version: '1.0',
		exportDate: new Date().toISOString(),
		appName: 'TTRPG Random Tables',
		data: {
			tables,
			dashboards
		}
	};
	return JSON.stringify(exportData, null, 2);
}

/**
 * Download data as a JSON file
 */
export function downloadJSON(data: string, filename: string) {
	const blob = new Blob([data], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Validate imported JSON data structure
 */
export function validateImportData(data: any): { valid: boolean; error?: string } {
	// Check if data is an object
	if (typeof data !== 'object' || data === null) {
		return { valid: false, error: 'Invalid JSON: data must be an object' };
	}

	// Check required fields
	if (!data.version) {
		return { valid: false, error: 'Missing version field' };
	}

	if (!data.data) {
		return { valid: false, error: 'Missing data field' };
	}

	if (!data.data.tables || !Array.isArray(data.data.tables)) {
		return { valid: false, error: 'Invalid or missing tables array' };
	}

	if (!data.data.dashboards || !Array.isArray(data.data.dashboards)) {
		return { valid: false, error: 'Invalid or missing dashboards array' };
	}

	// Validate table structure
	for (const table of data.data.tables) {
		if (!table.id || !table.name || !Array.isArray(table.entries)) {
			return { valid: false, error: 'Invalid table structure: missing id, name, or entries' };
		}

		// Validate entries have columns array
		for (const entry of table.entries) {
			if (!entry.id || !Array.isArray(entry.columns)) {
				return { valid: false, error: 'Invalid table entry: missing id or columns' };
			}
		}
	}

	// Validate dashboard structure
	for (const dashboard of data.data.dashboards) {
		if (!dashboard.id || !dashboard.name || !Array.isArray(dashboard.tableIds)) {
			return { valid: false, error: 'Invalid dashboard structure: missing id, name, or tableIds' };
		}
	}

	return { valid: true };
}
