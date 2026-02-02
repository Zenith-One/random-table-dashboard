<script lang="ts">
	import { onMount } from 'svelte';
	import { dashboards, tables, addDashboard, deleteDashboard } from '$lib/stores';
	import { sampleDashboards, sampleTables } from '$lib/sampleData';
	import { generateId } from '$lib/utils';
	import TableCard from '$lib/components/TableCard.svelte';
	import DashboardEditor from '$lib/components/DashboardEditor.svelte';
	import type { Dashboard, RandomTable } from '$lib/types';

	let currentDashboards: Dashboard[] = [];
	let currentTables: RandomTable[] = [];
	let selectedDashboard: Dashboard | null = null;
	let editingDashboard: Dashboard | null = null;
	let showNewDashboardDialog = false;
	let newDashboardName = '';
	let newDashboardDescription = '';

	onMount(() => {
		// Load sample data if stores are empty
		const unsubTables = tables.subscribe(t => {
			currentTables = t;
			if (t.length === 0) {
				tables.set(sampleTables);
			}
		});

		const unsubDashboards = dashboards.subscribe(d => {
			currentDashboards = d;
			if (d.length === 0) {
				dashboards.set(sampleDashboards);
			}
			// Select first dashboard by default or update selected if it changed
			if (d.length > 0) {
				if (!selectedDashboard) {
					selectedDashboard = d[0];
				} else {
					// Update selectedDashboard reference if it was modified
					const updated = d.find(dash => dash.id === selectedDashboard?.id);
					if (updated) {
						selectedDashboard = updated;
					}
				}
			}
		});

		return () => {
			unsubTables();
			unsubDashboards();
		};
	});

	$: dashboardTables = selectedDashboard
		? currentTables.filter(t => selectedDashboard.tableIds.includes(t.id))
			.sort((a, b) => selectedDashboard.tableIds.indexOf(a.id) - selectedDashboard.tableIds.indexOf(b.id))
		: [];

	function createNewDashboard() {
		if (!newDashboardName.trim()) return;

		const newDashboard: Dashboard = {
			id: generateId(),
			name: newDashboardName.trim(),
			description: newDashboardDescription.trim() || undefined,
			tableIds: [],
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		addDashboard(newDashboard);
		selectedDashboard = newDashboard;
		showNewDashboardDialog = false;
		newDashboardName = '';
		newDashboardDescription = '';
	}

	function handleDeleteDashboard() {
		if (!selectedDashboard) return;
		if (!confirm(`Are you sure you want to delete "${selectedDashboard.name}"?`)) return;

		deleteDashboard(selectedDashboard.id);
		selectedDashboard = currentDashboards[0] || null;
	}
</script>

<div class="container">
	<div class="page-header">
		<div>
			<h1>My Dashboards</h1>
			<p class="subtitle">Curated collections of random tables</p>
		</div>
		<button class="new-dashboard-button" on:click={() => (showNewDashboardDialog = true)}>
			+ New Dashboard
		</button>
	</div>

	{#if currentDashboards.length === 0}
		<div class="empty-state">
			<p>No dashboards yet. Create your first dashboard!</p>
			<button class="create-button" on:click={() => (showNewDashboardDialog = true)}>
				+ Create Dashboard
			</button>
		</div>
	{:else}
		<div class="dashboard-selector">
			{#each currentDashboards as dashboard}
				<button
					class="dashboard-tab"
					class:active={selectedDashboard?.id === dashboard.id}
					on:click={() => (selectedDashboard = dashboard)}
				>
					{dashboard.name}
				</button>
			{/each}
		</div>

		{#if selectedDashboard}
			<div class="dashboard-content">
				<div class="dashboard-info">
					<div class="dashboard-header">
						<div>
							<h2>{selectedDashboard.name}</h2>
							{#if selectedDashboard.description}
								<p class="dashboard-description">{selectedDashboard.description}</p>
							{/if}
						</div>
						<div class="dashboard-actions">
							<button class="action-button" on:click={() => (editingDashboard = selectedDashboard)}>
								✎ Edit
							</button>
							<button class="action-button delete" on:click={handleDeleteDashboard}>
								🗑 Delete
							</button>
						</div>
					</div>
				</div>

				{#if dashboardTables.length === 0}
					<div class="empty-state">
						<p>No tables in this dashboard yet.</p>
						<button class="create-button" on:click={() => (editingDashboard = selectedDashboard)}>
							+ Add Tables
						</button>
					</div>
				{:else}
					<div class="tables-grid">
						{#each dashboardTables as table (table.id)}
							<TableCard {table} />
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>

{#if editingDashboard}
	<DashboardEditor
		dashboard={editingDashboard}
		allTables={currentTables}
		onClose={() => (editingDashboard = null)}
	/>
{/if}

{#if showNewDashboardDialog}
	<div class="dialog-overlay" on:click={() => (showNewDashboardDialog = false)}>
		<div class="dialog" on:click|stopPropagation>
			<h2>Create New Dashboard</h2>
			<div class="form-group">
				<label for="dashboard-name">Dashboard Name *</label>
				<input
					id="dashboard-name"
					type="text"
					bind:value={newDashboardName}
					placeholder="e.g., Combat Encounters"
					autofocus
				/>
			</div>
			<div class="form-group">
				<label for="dashboard-description">Description (optional)</label>
				<textarea
					id="dashboard-description"
					bind:value={newDashboardDescription}
					placeholder="Describe what this dashboard is for..."
					rows="3"
				/>
			</div>
			<div class="dialog-actions">
				<button class="cancel-button" on:click={() => (showNewDashboardDialog = false)}>
					Cancel
				</button>
				<button
					class="create-button-primary"
					on:click={createNewDashboard}
					disabled={!newDashboardName.trim()}
				>
					Create
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

	.new-dashboard-button {
		background: var(--primary);
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-size: 1rem;
		min-height: 44px;
		cursor: pointer;
	}

	.new-dashboard-button:hover {
		background: var(--primary-dark);
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

	.dashboard-selector {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		border-bottom: 2px solid var(--border);
		padding-bottom: 0.5rem;
	}

	.dashboard-tab {
		background: transparent;
		color: var(--text-secondary);
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem 0.5rem 0 0;
		transition: all 0.2s;
		font-size: 1rem;
		position: relative;
	}

	.dashboard-tab:hover {
		background: var(--bg-tertiary);
		color: var(--text);
	}

	.dashboard-tab.active {
		background: var(--bg-tertiary);
		color: var(--text);
	}

	.dashboard-tab.active::after {
		content: '';
		position: absolute;
		bottom: -2px;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--primary);
	}

	.dashboard-content {
		animation: fadeIn 0.3s ease-in;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.dashboard-info {
		margin-bottom: 2rem;
	}

	.dashboard-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.dashboard-info h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
	}

	.dashboard-description {
		color: var(--text-secondary);
		margin: 0;
	}

	.dashboard-actions {
		display: flex;
		gap: 0.5rem;
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

	.tables-grid {
		column-count: 1;
		column-gap: 1.5rem;
	}

	.tables-grid > * {
		display: inline-block;
		width: 100%;
		break-inside: avoid;
		page-break-inside: avoid;
		margin-bottom: 1.5rem;
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

	/* Dialog styles */
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

	.dialog h2 {
		margin: 0 0 1.5rem 0;
		font-size: 1.5rem;
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

	.form-group input,
	.form-group textarea {
		width: 100%;
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 2rem;
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

	.create-button-primary {
		background: var(--primary);
		border: none;
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-size: 1rem;
		min-height: 44px;
		cursor: pointer;
	}

	.create-button-primary:hover:not(:disabled) {
		background: var(--primary-dark);
	}

	.create-button-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
