<script lang="ts">
	import { tables, dashboards, smartMergeTables, smartMergeDashboards } from '$lib/stores';
	import { exportAppData, downloadJSON, validateImportData } from '$lib/utils';
	import type { RandomTable, Dashboard } from '$lib/types';

	export let onClose: () => void;

	let currentTables: RandomTable[] = [];
	let currentDashboards: Dashboard[] = [];
	let fileInput: HTMLInputElement;
	let importStatus: string = '';
	let importError: string = '';
	let isDragging = false;
	let pastedJson: string = '';

	// Export selection state
	let selectedTableIds: Set<string> = new Set();
	let selectedDashboardIds: Set<string> = new Set();
	let showExportSelection = false;

	// Import preview state
	type ImportPreviewItem = {
		id: string;
		name: string;
		status: 'new' | 'update' | 'unchanged';
		selected: boolean;
	};
	let importPreview: { tables: ImportPreviewItem[]; dashboards: ImportPreviewItem[] } | null = null;
	let parsedImportData: any = null;

	// Subscribe to stores
	tables.subscribe(t => {
		currentTables = t;
		// Initialize all tables as selected
		selectedTableIds = new Set(t.map(table => table.id));
	});
	dashboards.subscribe(d => {
		currentDashboards = d;
		// Initialize all dashboards as selected
		selectedDashboardIds = new Set(d.map(dash => dash.id));
	});

	// Helper to check if item would be new, updated, or unchanged
	function getImportStatus(newItem: any, currentItems: any[], isTable: boolean): 'new' | 'update' | 'unchanged' {
		const existingIndex = currentItems.findIndex(
			item => item.name.toLowerCase() === newItem.name.toLowerCase()
		);

		if (existingIndex < 0) return 'new';

		const existing = currentItems[existingIndex];

		if (isTable) {
			// Use the same comparison logic as smartMergeTables
			if (existing.description !== newItem.description) return 'update';
			if (existing.diceFormula !== newItem.diceFormula) return 'update';
			if (JSON.stringify(existing.columnHeaders) !== JSON.stringify(newItem.columnHeaders)) return 'update';
			if (JSON.stringify(existing.entries) !== JSON.stringify(newItem.entries)) return 'update';
		} else {
			// Use the same comparison logic as smartMergeDashboards
			if (existing.description !== newItem.description) return 'update';
			if (JSON.stringify(existing.tableIds) !== JSON.stringify(newItem.tableIds)) return 'update';
		}

		return 'unchanged';
	}

	// Toggle selection for export
	function toggleTableSelection(id: string) {
		if (selectedTableIds.has(id)) {
			selectedTableIds.delete(id);
		} else {
			selectedTableIds.add(id);
		}
		selectedTableIds = selectedTableIds;
	}

	function toggleDashboardSelection(id: string) {
		if (selectedDashboardIds.has(id)) {
			selectedDashboardIds.delete(id);
		} else {
			selectedDashboardIds.add(id);
		}
		selectedDashboardIds = selectedDashboardIds;
	}

	function selectAllTables() {
		selectedTableIds = new Set(currentTables.map(t => t.id));
	}

	function selectNoneTables() {
		selectedTableIds = new Set();
	}

	function selectAllDashboards() {
		selectedDashboardIds = new Set(currentDashboards.map(d => d.id));
	}

	function selectNoneDashboards() {
		selectedDashboardIds = new Set();
	}

	function handleExport() {
		// Filter by selected items
		const selectedTables = currentTables.filter(t => selectedTableIds.has(t.id));
		const selectedDashboards = currentDashboards.filter(d => selectedDashboardIds.has(d.id));

		const jsonData = exportAppData(selectedTables, selectedDashboards);
		const date = new Date().toISOString().split('T')[0];
		const filename = `ttrpg-tables-backup-${date}.json`;
		downloadJSON(jsonData, filename);
		importStatus = `Export successful! ${selectedTables.length} tables, ${selectedDashboards.length} dashboards`;
		setTimeout(() => {
			importStatus = '';
			showExportSelection = false;
		}, 3000);
	}

	function handleImport(file: File) {
		importError = '';
		importStatus = '';

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const data = JSON.parse(e.target?.result as string);

				// Validate data
				const validation = validateImportData(data);
				if (!validation.valid) {
					importError = validation.error || 'Invalid file format';
					return;
				}

				// Create preview instead of importing immediately
				createImportPreview(data);
			} catch (err) {
				importError = `Failed to parse JSON: ${err instanceof Error ? err.message : 'Unknown error'}`;
			}
		};
		reader.readAsText(file);
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			handleImport(file);
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
		const file = event.dataTransfer?.files[0];
		if (file) {
			handleImport(file);
		}
	}

	function handlePastedImport() {
		importError = '';
		importStatus = '';

		if (!pastedJson.trim()) {
			importError = 'Please paste JSON data';
			return;
		}

		try {
			const data = JSON.parse(pastedJson);

			// Validate data
			const validation = validateImportData(data);
			if (!validation.valid) {
				importError = validation.error || 'Invalid JSON format';
				return;
			}

			// Create preview instead of importing immediately
			createImportPreview(data);

			// Clear textarea after parsing
			pastedJson = '';
		} catch (err) {
			importError = `Failed to parse JSON: ${err instanceof Error ? err.message : 'Unknown error'}`;
		}
	}

	function getExportSize(): string {
		const selectedTables = currentTables.filter(t => selectedTableIds.has(t.id));
		const selectedDashboards = currentDashboards.filter(d => selectedDashboardIds.has(d.id));
		const jsonData = exportAppData(selectedTables, selectedDashboards);
		const bytes = new Blob([jsonData]).size;
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function createImportPreview(data: any) {
		parsedImportData = data;

		// Create preview items for tables
		const tablePreview: ImportPreviewItem[] = data.data.tables.map((table: any) => ({
			id: table.id,
			name: table.name,
			status: getImportStatus(table, currentTables, true),
			selected: true // All selected by default
		}));

		// Create preview items for dashboards
		const dashboardPreview: ImportPreviewItem[] = data.data.dashboards.map((dashboard: any) => ({
			id: dashboard.id,
			name: dashboard.name,
			status: getImportStatus(dashboard, currentDashboards, false),
			selected: true // All selected by default
		}));

		importPreview = {
			tables: tablePreview,
			dashboards: dashboardPreview
		};
	}

	function toggleImportTableSelection(id: string) {
		if (importPreview) {
			const table = importPreview.tables.find(t => t.id === id);
			if (table) {
				table.selected = !table.selected;
				importPreview = importPreview; // Trigger reactivity
			}
		}
	}

	function toggleImportDashboardSelection(id: string) {
		if (importPreview) {
			const dashboard = importPreview.dashboards.find(d => d.id === id);
			if (dashboard) {
				dashboard.selected = !dashboard.selected;
				importPreview = importPreview; // Trigger reactivity
			}
		}
	}

	function selectAllImportTables() {
		if (importPreview) {
			importPreview.tables.forEach(t => t.selected = true);
			importPreview = importPreview;
		}
	}

	function selectNoneImportTables() {
		if (importPreview) {
			importPreview.tables.forEach(t => t.selected = false);
			importPreview = importPreview;
		}
	}

	function selectAllImportDashboards() {
		if (importPreview) {
			importPreview.dashboards.forEach(d => d.selected = true);
			importPreview = importPreview;
		}
	}

	function selectNoneImportDashboards() {
		if (importPreview) {
			importPreview.dashboards.forEach(d => d.selected = false);
			importPreview = importPreview;
		}
	}

	function confirmImport() {
		if (!parsedImportData || !importPreview) return;

		// Filter to only selected items
		const selectedTablesToImport = parsedImportData.data.tables.filter((table: any) =>
			importPreview!.tables.find(t => t.id === table.id && t.selected)
		);

		const selectedDashboardsToImport = parsedImportData.data.dashboards.filter((dashboard: any) =>
			importPreview!.dashboards.find(d => d.id === dashboard.id && d.selected)
		);

		// Smart merge selected tables and dashboards
		const tableStats = smartMergeTables(selectedTablesToImport);
		const dashboardStats = smartMergeDashboards(selectedDashboardsToImport);

		// Show success message with statistics
		const tableMsg = `${tableStats.added + tableStats.updated} tables (${tableStats.updated} updated, ${tableStats.added} new)`;
		const dashMsg = `${dashboardStats.added + dashboardStats.updated} dashboards (${dashboardStats.updated} updated, ${dashboardStats.added} new)`;
		importStatus = `✓ Imported ${tableMsg}, ${dashMsg}`;

		// Clear preview
		importPreview = null;
		parsedImportData = null;

		// Clear status after 3 seconds
		setTimeout(() => (importStatus = ''), 3000);
	}

	function cancelImport() {
		importPreview = null;
		parsedImportData = null;
		importError = '';
	}
</script>

<div class="dialog-overlay" on:click={onClose}>
	<div class="dialog" on:click|stopPropagation>
		<div class="dialog-header">
			<h2>Import/Export Data</h2>
			<button class="close-button" on:click={onClose}>✕</button>
		</div>

		<div class="dialog-content">
			<div class="section export-section">
				<h3>Export</h3>
				<p class="section-description">
					Download your selected tables and dashboards as a JSON file.
				</p>

				{#if showExportSelection}
					<div class="selection-container">
						<div class="selection-header">
							<h4>Tables ({selectedTableIds.size} of {currentTables.length})</h4>
							<div class="selection-controls">
								<button class="link-button" on:click={selectAllTables}>All</button>
								<button class="link-button" on:click={selectNoneTables}>None</button>
							</div>
						</div>
						<div class="checkbox-list">
							{#each currentTables as table}
								<label class="checkbox-item">
									<input
										type="checkbox"
										checked={selectedTableIds.has(table.id)}
										on:change={() => toggleTableSelection(table.id)}
									/>
									<span>{table.name}</span>
								</label>
							{/each}
						</div>

						<div class="selection-header">
							<h4>Dashboards ({selectedDashboardIds.size} of {currentDashboards.length})</h4>
							<div class="selection-controls">
								<button class="link-button" on:click={selectAllDashboards}>All</button>
								<button class="link-button" on:click={selectNoneDashboards}>None</button>
							</div>
						</div>
						<div class="checkbox-list">
							{#each currentDashboards as dashboard}
								<label class="checkbox-item">
									<input
										type="checkbox"
										checked={selectedDashboardIds.has(dashboard.id)}
										on:change={() => toggleDashboardSelection(dashboard.id)}
									/>
									<span>{dashboard.name}</span>
								</label>
							{/each}
						</div>
					</div>

					<button
						class="export-button"
						on:click={handleExport}
						disabled={selectedTableIds.size === 0 && selectedDashboardIds.size === 0}
					>
						💾 Export ({getExportSize()})
					</button>
				{:else}
					<button class="export-button" on:click={() => (showExportSelection = true)}>
						Select Items to Export
					</button>
				{/if}
			</div>

			<div class="section import-section">
				<h3>Import</h3>
				<p class="section-description">
					Import tables and dashboards from a JSON file. Existing items with the same name will be updated if content differs.
				</p>

				{#if importPreview}
					<!-- Show import preview with selection -->
					<div class="selection-container">
						<div class="selection-header">
							<h4>Tables ({importPreview.tables.filter(t => t.selected).length} of {importPreview.tables.length})</h4>
							<div class="selection-controls">
								<button class="link-button" on:click={selectAllImportTables}>All</button>
								<button class="link-button" on:click={selectNoneImportTables}>None</button>
							</div>
						</div>
						<div class="checkbox-list">
							{#each importPreview.tables as table}
								<label class="checkbox-item">
									<input
										type="checkbox"
										checked={table.selected}
										on:change={() => toggleImportTableSelection(table.id)}
									/>
									<span class="item-name">{table.name}</span>
									<span class="status-badge status-{table.status}">{table.status}</span>
								</label>
							{/each}
						</div>

						<div class="selection-header">
							<h4>Dashboards ({importPreview.dashboards.filter(d => d.selected).length} of {importPreview.dashboards.length})</h4>
							<div class="selection-controls">
								<button class="link-button" on:click={selectAllImportDashboards}>All</button>
								<button class="link-button" on:click={selectNoneImportDashboards}>None</button>
							</div>
						</div>
						<div class="checkbox-list">
							{#each importPreview.dashboards as dashboard}
								<label class="checkbox-item">
									<input
										type="checkbox"
										checked={dashboard.selected}
										on:change={() => toggleImportDashboardSelection(dashboard.id)}
									/>
									<span class="item-name">{dashboard.name}</span>
									<span class="status-badge status-{dashboard.status}">{dashboard.status}</span>
								</label>
							{/each}
						</div>
					</div>

					<div class="button-group">
						<button class="cancel-button" on:click={cancelImport}>
							Cancel
						</button>
						<button
							class="import-button"
							on:click={confirmImport}
							disabled={importPreview.tables.filter(t => t.selected).length === 0 && importPreview.dashboards.filter(d => d.selected).length === 0}
						>
							Confirm Import
						</button>
					</div>
				{:else}
					<!-- Show file/text input -->
					<div
						class="drop-zone"
						class:dragging={isDragging}
						on:dragover={handleDragOver}
						on:dragleave={handleDragLeave}
						on:drop={handleDrop}
						on:click={() => fileInput.click()}
					>
						<div class="drop-zone-content">
							<span class="drop-icon">📁</span>
							<p>Drop JSON file here or click to browse</p>
						</div>
					</div>

					<input
						type="file"
						accept=".json"
						bind:this={fileInput}
						on:change={handleFileSelect}
						style="display: none;"
					/>

					<div class="divider">
						<span>or</span>
					</div>

					<textarea
						class="json-input"
						bind:value={pastedJson}
						placeholder="Paste JSON data here..."
						rows="5"
					/>

					<button
						class="import-button"
						on:click={handlePastedImport}
						disabled={!pastedJson.trim()}
					>
						Import from Text
					</button>
				{/if}
			</div>
		</div>

		{#if importStatus}
			<div class="status-message success">{importStatus}</div>
		{/if}

		{#if importError}
			<div class="status-message error">✗ {importError}</div>
		{/if}
	</div>
</div>

<style>
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
		max-width: 700px;
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
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		line-height: 1;
	}

	.close-button:hover {
		color: var(--text);
	}

	.dialog-content {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2rem;
	}

	@media (min-width: 600px) {
		.dialog-content {
			grid-template-columns: 1fr 1fr;
		}
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.section h3 {
		margin: 0;
		font-size: 1.125rem;
		color: var(--text);
	}

	.section-description {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin: 0;
		line-height: 1.4;
	}

	.export-button {
		background: var(--primary);
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-size: 1rem;
		min-height: 44px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.export-button:hover {
		background: var(--primary-dark);
		transform: translateY(-1px);
	}

	.export-button:active {
		transform: scale(0.98);
	}

	.drop-zone {
		border: 2px dashed var(--border);
		border-radius: 0.5rem;
		padding: 2rem 1rem;
		text-align: center;
		cursor: pointer;
		transition: all 0.2s;
		background: var(--bg-secondary);
	}

	.drop-zone:hover {
		border-color: var(--primary);
		background: var(--bg-tertiary);
	}

	.drop-zone.dragging {
		border-color: var(--primary);
		background: var(--bg-tertiary);
		border-style: solid;
	}

	.drop-zone-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.drop-icon {
		font-size: 2rem;
	}

	.drop-zone p {
		margin: 0;
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.divider {
		display: flex;
		align-items: center;
		text-align: center;
		margin: 0.5rem 0;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		border-bottom: 1px solid var(--border);
	}

	.divider span {
		padding: 0 0.5rem;
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.json-input {
		width: 100%;
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		padding: 0.75rem;
		color: var(--text);
		font-family: 'Courier New', monospace;
		font-size: 0.875rem;
		resize: vertical;
		min-height: 100px;
	}

	.json-input:focus {
		outline: none;
		border-color: var(--primary);
	}

	.json-input::placeholder {
		color: var(--text-secondary);
		opacity: 0.6;
	}

	.import-button {
		background: var(--bg-tertiary);
		color: var(--text);
		border: 1px solid var(--border);
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-size: 1rem;
		min-height: 44px;
		cursor: pointer;
		transition: all 0.2s;
		width: 100%;
	}

	.import-button:hover:not(:disabled) {
		background: var(--primary);
		border-color: var(--primary);
		color: white;
		transform: translateY(-1px);
	}

	.import-button:active:not(:disabled) {
		transform: scale(0.98);
	}

	.import-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.status-message {
		margin-top: 1rem;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		text-align: center;
	}

	.status-message.success {
		background: rgba(16, 185, 129, 0.1);
		border: 1px solid var(--success);
		color: var(--success);
	}

	.status-message.error {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid var(--danger);
		color: var(--danger);
	}

	.selection-container {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		padding: 1rem;
		max-height: 400px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.selection-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border);
	}

	.selection-header h4 {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text);
		font-weight: 600;
	}

	.selection-controls {
		display: flex;
		gap: 0.5rem;
	}

	.link-button {
		background: transparent;
		border: none;
		color: var(--text);
		font-size: 0.75rem;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		text-decoration: underline;
		transition: all 0.2s;
		font-weight: 600;
	}

	.link-button:hover {
		color: var(--primary);
		background: var(--bg-secondary);
		border-radius: 0.25rem;
	}

	.checkbox-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.checkbox-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: background 0.2s;
	}

	.checkbox-item:hover {
		background: var(--bg-secondary);
	}

	.checkbox-item input[type="checkbox"] {
		cursor: pointer;
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}

	.checkbox-item span {
		font-size: 0.875rem;
		color: var(--text);
	}

	.item-name {
		flex: 1;
	}

	.status-badge {
		font-size: 0.75rem;
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.status-badge.status-new {
		background: rgba(16, 185, 129, 0.1);
		color: var(--success);
		border: 1px solid var(--success);
	}

	.status-badge.status-update {
		background: rgba(59, 130, 246, 0.1);
		color: #3b82f6;
		border: 1px solid #3b82f6;
	}

	.status-badge.status-unchanged {
		background: rgba(107, 114, 128, 0.1);
		color: var(--text-secondary);
		border: 1px solid var(--border);
	}

	.button-group {
		display: flex;
		gap: 0.5rem;
	}

	.cancel-button {
		background: var(--bg-secondary);
		color: var(--text-secondary);
		border: 1px solid var(--border);
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-size: 1rem;
		min-height: 44px;
		cursor: pointer;
		transition: all 0.2s;
		flex: 1;
	}

	.cancel-button:hover {
		background: var(--bg-tertiary);
		color: var(--text);
		border-color: var(--text-secondary);
	}

	.button-group .import-button {
		flex: 1;
	}
</style>
