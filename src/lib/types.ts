export interface RandomTableEntry {
	id: string;
	columns: string[]; // Support multiple columns per entry
	weight?: number; // Optional weighting for weighted random selection
}

export interface RandomTable {
	id: string;
	name: string;
	description?: string;
	entries: RandomTableEntry[];
	diceFormula?: string; // e.g., "1d20", "2d6", etc.
	columnHeaders?: string[]; // Optional column headers for multi-column tables
	createdAt: string;
	updatedAt: string;
}

export interface Dashboard {
	id: string;
	name: string;
	description?: string;
	tableIds: string[]; // Array of table IDs to display on this dashboard
	createdAt: string;
	updatedAt: string;
}

export interface RollResult {
	tableId: string;
	tableName: string;
	roll: number;
	result: string;
	timestamp: string;
}
