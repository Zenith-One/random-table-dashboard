<script lang="ts">
	import { tables, deleteTable, duplicateTable, updateTable } from '$lib/stores';
	import TableCard from '$lib/components/TableCard.svelte';
	import TableEditor from '$lib/components/TableEditor.svelte';
	import type { RandomTable } from '$lib/types';

	let currentTables: RandomTable[] = [];
	let searchQuery = '';
	let selectedDiceType = 'all';
	let selectedTag = 'all';
	let editingTable: RandomTable | null = null;
	let creatingNewTable = false;
	let bulkSelectMode = false;
	let selectedTableIds: Set<string> = new Set();
	let showBulkTagDialog = false;
	let bulkTagsToAdd = '';
	let bulkTagsToRemove = '';

	tables.subscribe(t => {
		currentTables = t;
	});

	// Get unique dice types and tags from all tables
	$: diceTypes = ['all', ...new Set(currentTables.map(t => t.diceFormula).filter(Boolean))];
	$: allTags = ['all', ...new Set(currentTables.flatMap(t => t.tags || []))].sort();

	$: filteredTables = currentTables.filter(t => {
		// Search filter
		const matchesSearch = !searchQuery ||
			t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			t.description?.toLowerCase().includes(searchQuery.toLowerCase());

		// Dice type filter
		const matchesDice = selectedDiceType === 'all' || t.diceFormula === selectedDiceType;

		// Tag filter
		const matchesTag = selectedTag === 'all' || (t.tags && t.tags.includes(selectedTag));

		return matchesSearch && matchesDice && matchesTag;
	});

	function handleEditTable(table: RandomTable) {
		editingTable = table;
	}

	function handleDeleteTable(table: RandomTable) {
		if (!confirm(`Are you sure you want to delete "${table.name}"?`)) return;
		deleteTable(table.id);
	}

	function handleDuplicateTable(table: RandomTable) {
		duplicateTable(table.id);
	}

	function closeEditor() {
		editingTable = null;
		creatingNewTable = false;
	}

	function toggleBulkSelectMode() {
		bulkSelectMode = !bulkSelectMode;
		if (!bulkSelectMode) {
			selectedTableIds = new Set();
		}
	}

	function toggleTableSelection(tableId: string) {
		if (selectedTableIds.has(tableId)) {
			selectedTableIds.delete(tableId);
		} else {
			selectedTableIds.add(tableId);
		}
		selectedTableIds = selectedTableIds; // Trigger reactivity
	}

	function selectAllTables() {
		selectedTableIds = new Set(filteredTables.map(t => t.id));
	}

	function deselectAllTables() {
		selectedTableIds = new Set();
	}

	function applyBulkTags() {
		const tagsToAdd = bulkTagsToAdd
			.split(',')
			.map(t => t.trim())
			.filter(t => t.length > 0);
		const tagsToRemove = bulkTagsToRemove
			.split(',')
			.map(t => t.trim())
			.filter(t => t.length > 0);

		selectedTableIds.forEach(tableId => {
			const table = currentTables.find(t => t.id === tableId);
			if (!table) return;

			let newTags = [...(table.tags || [])];

			// Add new tags
			tagsToAdd.forEach(tag => {
				if (!newTags.includes(tag)) {
					newTags.push(tag);
				}
			});

			// Remove tags
			newTags = newTags.filter(tag => !tagsToRemove.includes(tag));

			// Update the table
			updateTable(tableId, { tags: newTags.length > 0 ? newTags : undefined });
		});

		// Reset
		showBulkTagDialog = false;
		bulkTagsToAdd = '';
		bulkTagsToRemove = '';
		selectedTableIds = new Set();
		bulkSelectMode = false;
	}
</script>

<div class="container">
	<div class="page-header">
		<div>
			<h1>All Tables</h1>
			<p class="subtitle">Browse all available random tables</p>
		</div>
		<div class="header-actions">
			<button class="bulk-select-button" on:click={toggleBulkSelectMode}>
				{bulkSelectMode ? 'Cancel' : '☑ Bulk Edit'}
			</button>
			<button class="new-table-button" on:click={() => (creatingNewTable = true)}>
				+ New Table
			</button>
		</div>
	</div>

	<div class="filters">
		<input
			type="text"
			class="search-input"
			placeholder="Search tables..."
			bind:value={searchQuery}
		/>
		<select class="filter-select" bind:value={selectedDiceType}>
			<option value="all">All Dice Types</option>
			{#each diceTypes.filter(d => d !== 'all') as diceType}
				<option value={diceType}>{diceType}</option>
			{/each}
		</select>
		{#if allTags.length > 1}
			<select class="filter-select" bind:value={selectedTag}>
				<option value="all">All Tags</option>
				{#each allTags.filter(t => t !== 'all') as tag}
					<option value={tag}>{tag}</option>
				{/each}
			</select>
		{/if}
	</div>

	{#if bulkSelectMode}
		<div class="bulk-toolbar">
			<div class="bulk-info">
				<span>{selectedTableIds.size} table{selectedTableIds.size !== 1 ? 's' : ''} selected</span>
				<div class="bulk-controls">
					<button class="link-button" on:click={selectAllTables}>Select All</button>
					<button class="link-button" on:click={deselectAllTables}>Deselect All</button>
				</div>
			</div>
			{#if selectedTableIds.size > 0}
				<button class="bulk-action-button" on:click={() => (showBulkTagDialog = true)}>
					🏷️ Manage Tags
				</button>
			{/if}
		</div>
	{/if}

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
				<div class="table-card-wrapper" class:selectable={bulkSelectMode}>
					{#if bulkSelectMode}
						<label class="selection-checkbox">
							<input
								type="checkbox"
								checked={selectedTableIds.has(table.id)}
								on:change={() => toggleTableSelection(table.id)}
							/>
						</label>
					{/if}
					<TableCard {table} />
					{#if !bulkSelectMode}
						<div class="table-actions">
							<button class="action-button" on:click={() => handleDuplicateTable(table)}>
								📋 Duplicate
							</button>
							<button class="action-button" on:click={() => handleEditTable(table)}>
								✎ Edit
							</button>
							<button class="action-button delete" on:click={() => handleDeleteTable(table)}>
								🗑 Delete
							</button>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if editingTable || creatingNewTable}
	<TableEditor table={editingTable} onClose={closeEditor} />
{/if}

{#if showBulkTagDialog}
	<div class="dialog-overlay" on:click={() => (showBulkTagDialog = false)}>
		<div class="dialog" on:click|stopPropagation>
			<div class="dialog-header">
				<h2>Bulk Tag Management</h2>
				<button class="close-button" on:click={() => (showBulkTagDialog = false)}>✕</button>
			</div>

			<div class="dialog-content">
				<p class="hint">Managing tags for {selectedTableIds.size} table{selectedTableIds.size !== 1 ? 's' : ''}</p>

				<div class="form-group">
					<label for="bulk-add-tags">Add Tags (comma-separated)</label>
					<input
						id="bulk-add-tags"
						type="text"
						bind:value={bulkTagsToAdd}
						placeholder="e.g., combat, treasure, NPC"
					/>
				</div>

				<div class="form-group">
					<label for="bulk-remove-tags">Remove Tags (comma-separated)</label>
					<input
						id="bulk-remove-tags"
						type="text"
						bind:value={bulkTagsToRemove}
						placeholder="e.g., old-tag, unused"
					/>
				</div>
			</div>

			<div class="dialog-actions">
				<button class="cancel-button" on:click={() => (showBulkTagDialog = false)}>
					Cancel
				</button>
				<button class="apply-button" on:click={applyBulkTags}>
					Apply Changes
				</button>
			</div>
		</div>
	</div>
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

	.header-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.bulk-select-button {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		color: var(--text);
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-size: 1rem;
		min-height: 44px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.bulk-select-button:hover {
		background: var(--primary);
		border-color: var(--primary);
		color: white;
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

	.filters {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		align-items: center;
	}

	.search-input {
		flex: 1;
		min-width: 250px;
		max-width: 500px;
	}

	.filter-select {
		padding: 0.75rem 1rem;
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		background: var(--bg-secondary);
		color: var(--text);
		font-size: 1rem;
		min-height: 44px;
		cursor: pointer;
		transition: border-color 0.2s;
	}

	.filter-select:hover {
		border-color: var(--primary);
	}

	.filter-select:focus {
		outline: none;
		border-color: var(--primary);
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
		column-count: 1;
		column-gap: 1.5rem;
	}

	.table-card-wrapper {
		display: inline-block;
		width: 100%;
		break-inside: avoid;
		page-break-inside: avoid;
		margin-bottom: 1.5rem;
	}

	.table-card-wrapper > :first-child {
		margin-bottom: 0.75rem;
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

	.bulk-toolbar {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.bulk-info {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.bulk-controls {
		display: flex;
		gap: 0.5rem;
	}

	.link-button {
		background: transparent;
		border: none;
		color: var(--text);
		font-size: 0.875rem;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		text-decoration: underline;
		transition: all 0.2s;
		font-weight: 600;
	}

	.link-button:hover {
		color: var(--primary);
	}

	.bulk-action-button {
		background: var(--primary);
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		min-height: 44px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.bulk-action-button:hover {
		background: var(--primary-dark);
	}

	.table-card-wrapper.selectable {
		position: relative;
	}

	.selection-checkbox {
		position: absolute;
		top: 1rem;
		right: 1rem;
		z-index: 10;
		cursor: pointer;
	}

	.selection-checkbox input[type="checkbox"] {
		width: 24px;
		height: 24px;
		cursor: pointer;
	}

	.dialog-overlay {
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

	.dialog {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 1rem;
		padding: 2rem;
		max-width: 500px;
		width: 100%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	}

	.dialog-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.dialog-header h2 {
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

	.dialog-content {
		margin-bottom: 1.5rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		color: var(--text);
		font-weight: 500;
	}

	.form-group input {
		width: 100%;
	}

	.hint {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
	}

	.cancel-button {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--text);
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-size: 1rem;
		min-height: 44px;
		cursor: pointer;
	}

	.cancel-button:hover {
		background: var(--bg-tertiary);
	}

	.apply-button {
		background: var(--primary);
		border: none;
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-size: 1rem;
		min-height: 44px;
		cursor: pointer;
	}

	.apply-button:hover {
		background: var(--primary-dark);
	}

	/* Large screens and up - 2 columns max */
	@media (min-width: 1200px) {
		.tables-grid {
			column-count: 2;
			column-gap: 2rem;
		}

		.tables-grid > * {
			margin-bottom: 2rem;
		}
	}
</style>
