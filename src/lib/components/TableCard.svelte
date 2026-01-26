<script lang="ts">
	import type { RandomTable } from '$lib/types';
	import { rollTable } from '$lib/utils';

	// Import dice SVG icons
	import d4Icon from '../../assets/icons/ffffff/transparent/1x1/skoll/d4.svg';
	import d6Icon from '../../assets/icons/ffffff/transparent/1x1/delapouite/perspective-dice-six-faces-six.svg';
	import d8Icon from '../../assets/icons/ffffff/transparent/1x1/delapouite/dice-eight-faces-eight.svg';
	import d10Icon from '../../assets/icons/ffffff/transparent/1x1/skoll/d10.svg';
	import d12Icon from '../../assets/icons/ffffff/transparent/1x1/skoll/d12.svg';
	import d20Icon from '../../assets/icons/ffffff/transparent/1x1/delapouite/dice-twenty-faces-twenty.svg';

	export let table: RandomTable;

	let lastResult: { roll: number; columns: string[] } | null = null;
	let isRolling = false;
	let showTable = false;

	function handleRoll() {
		isRolling = true;

		// Add a small delay for animation effect
		setTimeout(() => {
			const { roll, entry } = rollTable(table);
			lastResult = { roll, columns: entry.columns };
			isRolling = false;
		}, 300);
	}

	function toggleTable() {
		showTable = !showTable;
	}

	// Get dice icon based on the table's dice formula
	function getDiceIconPath(): string {
		// Map dice types to icon paths
		const diceIcons: { [key: string]: string } = {
			'4': d4Icon,
			'6': d6Icon,
			'8': d8Icon,
			'10': d10Icon,
			'12': d12Icon,
			'20': d20Icon,
			'100': d10Icon  // fallback to d6 for d100
		};

		if (!table.diceFormula) {
			let icon = diceIcons[''+table.entries.length];
			return icon || d6Icon;
		};

		const match = table.diceFormula.match(/d(\d+)/i);
		if (!match) return d6Icon;

		const sides = match[1];

		return diceIcons[sides] || d6Icon;
	}
</script>

<div class="table-card">
	<div class="card-header">
		<h3>{table.name}</h3>
		{#if table.diceFormula}
			<span class="dice-badge">{table.diceFormula}</span>
		{/if}
	</div>

	{#if table.description}
		<p class="description">{table.description}</p>
	{/if}

	<div class="entries-preview">
		<span class="entry-count">{table.entries.length} entries</span>
		<button class="view-table-button" on:click={toggleTable}>
			{showTable ? '▼ Hide Table' : '▶ View Table'}
		</button>
	</div>

	{#if showTable}
		<div class="table-view">
			<table>
				<thead>
					<tr>
						<th>Roll</th>
						{#if table.columnHeaders && table.columnHeaders.length > 0}
							{#each table.columnHeaders as header}
								<th>{header}</th>
							{/each}
						{:else}
							<th>Result</th>
						{/if}
					</tr>
				</thead>
				<tbody>
					{#each table.entries as entry, index}
						<tr>
							<td class="roll-cell">{index + 1}</td>
							{#if table.columnHeaders && table.columnHeaders.length > 0}
								{#each entry.columns || [] as column}
									<td class="result-cell">{column}</td>
								{/each}
							{:else}
								<td class="result-cell">{entry.columns ? entry.columns.join(' | ') : ''}</td>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	{#if lastResult}
		<div class="result-display" class:rolling={isRolling}>
			{#if lastResult.roll > 0}
				<div class="roll-number">{lastResult.roll}</div>
			{/if}
			<div class="result-text">{lastResult.columns ? lastResult.columns.join(' | ') : ''}</div>
		</div>
	{/if}

	<button class="roll-button" on:click={handleRoll} disabled={isRolling}>
		<img src={getDiceIconPath()} alt="Dice" class="dice-icon" />
		{isRolling ? 'Rolling...' : 'Roll'}
	</button>
</div>

<style>
	.table-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.table-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.card-header h3 {
		margin: 0;
		font-size: 1.25rem;
		color: var(--text);
	}

	.dice-badge {
		background: var(--bg-tertiary);
		color: var(--text-secondary);
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		font-family: 'Courier New', monospace;
	}

	.description {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin: 0;
	}

	.entries-preview {
		color: var(--text-secondary);
		font-size: 0.875rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}

	.entry-count {
		background: var(--bg-tertiary);
		padding: 0.25rem 0.75rem;
		border-radius: 0.25rem;
	}

	.view-table-button {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--text-secondary);
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		min-height: 44px;
		transition: all 0.2s;
	}

	.view-table-button:hover {
		background: var(--bg-tertiary);
		color: var(--text);
		border-color: var(--primary);
	}

	.table-view {
		max-height: 400px;
		overflow-y: auto;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		animation: slideDown 0.2s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			max-height: 0;
		}
		to {
			opacity: 1;
			max-height: 400px;
		}
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	thead {
		background: var(--bg-tertiary);
		position: sticky;
		top: 0;
		z-index: 1;
	}

	th {
		padding: 0.75rem 1rem;
		text-align: left;
		font-weight: 600;
		color: var(--text);
		border-bottom: 2px solid var(--border);
	}

	th:first-child {
		width: 80px;
		text-align: center;
	}

	td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--border);
	}

	tbody tr:hover {
		background: var(--bg-tertiary);
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	.roll-cell {
		text-align: center;
		font-weight: 600;
		color: var(--primary);
		font-family: 'Courier New', monospace;
		font-size: 1rem;
	}

	.result-cell {
		color: var(--text);
	}

	.result-display {
		background: var(--bg-tertiary);
		border: 2px solid var(--primary);
		border-radius: 0.5rem;
		padding: 1rem;
		text-align: center;
		min-height: 80px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.result-display.rolling {
		animation: pulse 0.3s ease-in-out;
	}

	@keyframes pulse {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.05); }
	}

	.roll-number {
		font-size: 2rem;
		font-weight: bold;
		color: var(--primary);
		font-family: 'Courier New', monospace;
	}

	.result-text {
		font-size: 1.125rem;
		color: var(--text);
		line-height: 1.4;
	}

	.roll-button {
		width: 100%;
		font-size: 1.125rem;
		background: var(--primary);
		/* Ensure good touch target size */
		min-height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.roll-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.dice-icon {
		width: 24px;
		height: 24px;
		filter: brightness(0) invert(1); /* Make SVG white */
	}

	/* iPad and larger screens */
	@media (min-width: 768px) {
		.table-card {
			padding: 2rem;
		}
	}
</style>
