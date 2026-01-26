<script lang="ts">
	import { tables, deleteTable } from '$lib/stores';
	import TableCard from '$lib/components/TableCard.svelte';
	import TableEditor from '$lib/components/TableEditor.svelte';
	import type { RandomTable } from '$lib/types';

	let currentTables: RandomTable[] = [];
	let searchQuery = '';
	let editingTable: RandomTable | null = null;
	let creatingNewTable = false;

	tables.subscribe(t => {
		currentTables = t;
	});

	$: filteredTables = searchQuery
		? currentTables.filter(
				t =>
					t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					t.description?.toLowerCase().includes(searchQuery.toLowerCase())
		  )
		: currentTables;

	function handleEditTable(table: RandomTable) {
		editingTable = table;
	}

	function handleDeleteTable(table: RandomTable) {
		if (!confirm(`Are you sure you want to delete "${table.name}"?`)) return;
		deleteTable(table.id);
	}

	function closeEditor() {
		editingTable = null;
		creatingNewTable = false;
	}
</script>

<div class="container">
	<div class="page-header">
		<div>
			<h1>All Tables</h1>
			<p class="subtitle">Browse all available random tables</p>
		</div>
		<button class="new-table-button" on:click={() => (creatingNewTable = true)}>
			+ New Table
		</button>
	</div>

	<div class="search-bar">
		<input
			type="text"
			placeholder="Search tables..."
			bind:value={searchQuery}
		/>
	</div>

	{#if filteredTables.length === 0}
		<div class="empty-state">
			{#if searchQuery}
				<p>No tables found matching "{searchQuery}"</p>
			{:else}
				<p>No tables yet. Create your first table!</p>
				<button class="create-button" on:click={() => (creatingNewTable = true)}>
					+ Create Table
				</button>
			{/if}
		</div>
	{:else}
		<div class="tables-grid">
			{#each filteredTables as table (table.id)}
				<div class="table-card-wrapper">
					<TableCard {table} />
					<div class="table-actions">
						<button class="action-button" on:click={() => handleEditTable(table)}>
							✎ Edit
						</button>
						<button class="action-button delete" on:click={() => handleDeleteTable(table)}>
							🗑 Delete
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if editingTable || creatingNewTable}
	<TableEditor table={editingTable} onClose={closeEditor} />
{/if}

<style>
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.page-header h1 {
		margin: 0;
		font-size: 2rem;
	}

	.subtitle {
		color: var(--text-secondary);
		margin: 0.5rem 0 0 0;
	}

	.new-table-button {
		background: var(--primary);
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-size: 1rem;
		min-height: 44px;
		cursor: pointer;
	}

	.new-table-button:hover {
		background: var(--primary-dark);
	}

	.search-bar {
		margin-bottom: 2rem;
	}

	.search-bar input {
		max-width: 500px;
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: var(--text-secondary);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.create-button {
		background: var(--primary);
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-size: 1rem;
		min-height: 44px;
		cursor: pointer;
	}

	.create-button:hover {
		background: var(--primary-dark);
	}

	.tables-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.table-card-wrapper {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.table-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
	}

	.action-button {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		color: var(--text);
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		min-height: 44px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.action-button:hover {
		background: var(--primary);
		border-color: var(--primary);
		color: white;
	}

	.action-button.delete:hover {
		background: var(--danger);
		border-color: var(--danger);
		color: white;
	}

	/* Tablet and larger */
	@media (min-width: 768px) {
		.tables-grid {
			grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
			gap: 2rem;
		}
	}

	/* Extra large screens */
	@media (min-width: 1200px) {
		.tables-grid {
			grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
		}
	}
</style>
