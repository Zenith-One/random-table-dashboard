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

	// Subscribe to stores
	tables.subscribe(t => (currentTables = t));
	dashboards.subscribe(d => (currentDashboards = d));

	function handleExport() {
		const jsonData = exportAppData(currentTables, currentDashboards);
		const date = new Date().toISOString().split('T')[0];
		const filename = `ttrpg-tables-backup-${date}.json`;
		downloadJSON(jsonData, filename);
		importStatus = 'Export successful!';
		setTimeout(() => (importStatus = ''), 3000);
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

				// Smart merge tables and dashboards
				const tableStats = smartMergeTables(data.data.tables);
				const dashboardStats = smartMergeDashboards(data.data.dashboards);

				// Show success message with statistics
				const tableMsg = `${tableStats.added + tableStats.updated} tables (${tableStats.updated} updated, ${tableStats.added} new)`;
				const dashMsg = `${dashboardStats.added + dashboardStats.updated} dashboards (${dashboardStats.updated} updated, ${dashboardStats.added} new)`;
				importStatus = `✓ Imported ${tableMsg}, ${dashMsg}`;
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

			// Smart merge tables and dashboards
			const tableStats = smartMergeTables(data.data.tables);
			const dashboardStats = smartMergeDashboards(data.data.dashboards);

			// Show success message with statistics
			const tableMsg = `${tableStats.added + tableStats.updated} tables (${tableStats.updated} updated, ${tableStats.added} new)`;
			const dashMsg = `${dashboardStats.added + dashboardStats.updated} dashboards (${dashboardStats.updated} updated, ${dashboardStats.added} new)`;
			importStatus = `✓ Imported ${tableMsg}, ${dashMsg}`;

			// Clear textarea on success
			pastedJson = '';
		} catch (err) {
			importError = `Failed to parse JSON: ${err instanceof Error ? err.message : 'Unknown error'}`;
		}
	}

	function getExportSize(): string {
		const jsonData = exportAppData(currentTables, currentDashboards);
		const bytes = new Blob([jsonData]).size;
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
					Download all your tables and dashboards as a JSON file.
				</p>
				<button class="export-button" on:click={handleExport}>
					💾 Export ({getExportSize()})
				</button>
			</div>

			<div class="section import-section">
				<h3>Import</h3>
				<p class="section-description">
					Import tables and dashboards from a JSON file. Existing items with the same name will be updated if content differs.
				</p>

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
</style>
