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
