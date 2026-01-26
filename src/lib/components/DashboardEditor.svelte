<script lang="ts">
	import type { Dashboard, RandomTable } from '$lib/types';
	import { updateDashboard } from '$lib/stores';

	export let dashboard: Dashboard;
	export let allTables: RandomTable[];
	export let onClose: () => void;

	let currentTableIds = [...dashboard.tableIds];

	$: availableTables = allTables.filter(t => !currentTableIds.includes(t.id));
	$: selectedTables = allTables.filter(t => currentTableIds.includes(t.id))
		.sort((a, b) => currentTableIds.indexOf(a.id) - currentTableIds.indexOf(b.id));

	function addTable(tableId: string) {
		currentTableIds = [...currentTableIds, tableId];
	}

	function removeTable(tableId: string) {
		currentTableIds = currentTableIds.filter(id => id !== tableId);
	}

	function moveUp(index: number) {
		if (index === 0) return;
		const newOrder = [...currentTableIds];
		[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
		currentTableIds = newOrder;
	}

	function moveDown(index: number) {
		if (index === currentTableIds.length - 1) return;
		const newOrder = [...currentTableIds];
		[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
		currentTableIds = newOrder;
	}

	function saveDashboard() {
		updateDashboard(dashboard.id, { tableIds: currentTableIds });
		onClose();
	}
</script>

<div class="editor-overlay" on:click={onClose}>
	<div class="editor-modal" on:click|stopPropagation>
		<div class="editor-header">
			<h2>Edit Dashboard: {dashboard.name}</h2>
			<button class="close-button" on:click={onClose}>✕</button>
		</div>

		<div class="editor-content">
			<div class="section">
				<h3>Tables in Dashboard ({selectedTables.length})</h3>
				{#if selectedTables.length === 0}
					<p class="empty-message">No tables added yet. Add some from the available tables below.</p>
				{:else}
					<div class="table-list">
						{#each selectedTables as table, index (table.id)}
							<div class="table-item">
								<div class="table-info">
									<span class="table-name">{table.name}</span>
									{#if table.diceFormula}
										<span class="table-dice">{table.diceFormula}</span>
									{/if}
								</div>
								<div class="table-actions">
									<button
										class="icon-button"
										on:click={() => moveUp(index)}
										disabled={index === 0}
										title="Move up"
									>
										▲
									</button>
									<button
										class="icon-button"
										on:click={() => moveDown(index)}
										disabled={index === selectedTables.length - 1}
										title="Move down"
									>
										▼
									</button>
									<button
										class="icon-button remove"
										on:click={() => removeTable(table.id)}
										title="Remove from dashboard"
									>
										✕
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="section">
				<h3>Available Tables ({availableTables.length})</h3>
				{#if availableTables.length === 0}
					<p class="empty-message">All tables are already in this dashboard.</p>
				{:else}
					<div class="table-list">
						{#each availableTables as table (table.id)}
							<div class="table-item">
								<div class="table-info">
									<span class="table-name">{table.name}</span>
									{#if table.diceFormula}
										<span class="table-dice">{table.diceFormula}</span>
									{/if}
								</div>
								<button
									class="add-button"
									on:click={() => addTable(table.id)}
								>
									+ Add
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<div class="editor-footer">
			<button class="cancel-button" on:click={onClose}>Cancel</button>
			<button class="save-button" on:click={saveDashboard}>Save Changes</button>
		</div>
	</div>
</div>

<style>
	.editor-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.editor-modal {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 1rem;
		max-width: 800px;
		width: 100%;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	}

	.editor-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid var(--border);
	}

	.editor-header h2 {
		margin: 0;
		font-size: 1.5rem;
	}

	.close-button {
		background: transparent;
		border: none;
		color: var(--text-secondary);
		font-size: 1.5rem;
		padding: 0.5rem;
		min-width: 44px;
		min-height: 44px;
		cursor: pointer;
	}

	.close-button:hover {
		color: var(--text);
	}

	.editor-content {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.section h3 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		color: var(--text);
	}

	.empty-message {
		color: var(--text-secondary);
		font-style: italic;
		margin: 1rem 0;
	}

	.table-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.table-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		gap: 1rem;
	}

	.table-info {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.table-name {
		font-weight: 500;
		color: var(--text);
	}

	.table-dice {
		background: var(--bg-tertiary);
		color: var(--text-secondary);
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-family: 'Courier New', monospace;
	}

	.table-actions {
		display: flex;
		gap: 0.25rem;
	}

	.icon-button {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		color: var(--text);
		padding: 0.5rem;
		min-width: 36px;
		min-height: 36px;
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.icon-button:hover:not(:disabled) {
		background: var(--primary);
		border-color: var(--primary);
	}

	.icon-button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.icon-button.remove {
		color: var(--danger);
	}

	.icon-button.remove:hover:not(:disabled) {
		background: var(--danger);
		color: white;
	}

	.add-button {
		background: var(--primary);
		border: none;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		min-height: 36px;
		cursor: pointer;
	}

	.add-button:hover {
		background: var(--primary-dark);
	}

	.editor-footer {
		padding: 1.5rem;
		border-top: 1px solid var(--border);
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
	}

	.cancel-button,
	.save-button {
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-size: 1rem;
		min-height: 44px;
		cursor: pointer;
	}

	.cancel-button {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--text);
	}

	.cancel-button:hover {
		background: var(--bg-tertiary);
	}

	.save-button {
		background: var(--primary);
		border: none;
		color: white;
	}

	.save-button:hover {
		background: var(--primary-dark);
	}
</style>
