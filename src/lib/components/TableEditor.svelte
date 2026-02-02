<script lang="ts">
	import type { RandomTable, RandomTableEntry } from '$lib/types';
	import { addTable, updateTable } from '$lib/stores';
	import { generateId } from '$lib/utils';

	export let table: RandomTable | null = null;
	export let onClose: () => void;

	let tableName = table?.name || '';
	let tableDescription = table?.description || '';
	let diceFormula = table?.diceFormula || '';
	let columnHeaders = table?.columnHeaders?.join(', ') || '';
	let tags = table?.tags?.join(', ') || '';
	let entries: RandomTableEntry[] = table?.entries.map(e => ({ ...e })) || [];
	let newEntryValue = '';
	let csvInput = '';
	let showCsvImport = false;
	let csvPreview: string[][] = [];
	let csvFirstRowIsHeader = false;

	$: isValid = tableName.trim() && entries.length > 0;

	function addEntry() {
		if (!newEntryValue.trim()) return;

		const newEntry: RandomTableEntry = {
			id: (entries.length + 1).toString(),
			columns: [newEntryValue.trim()]
		};

		entries = [...entries, newEntry];
		newEntryValue = '';
	}

	function removeEntry(index: number) {
		entries = entries.filter((_, i) => i !== index);
		// Re-index entries
		entries = entries.map((e, i) => ({ ...e, id: (i + 1).toString() }));
	}

	function moveEntryUp(index: number) {
		if (index === 0) return;
		const newEntries = [...entries];
		[newEntries[index - 1], newEntries[index]] = [newEntries[index], newEntries[index - 1]];
		entries = newEntries.map((e, i) => ({ ...e, id: (i + 1).toString() }));
	}

	function moveEntryDown(index: number) {
		if (index === entries.length - 1) return;
		const newEntries = [...entries];
		[newEntries[index], newEntries[index + 1]] = [newEntries[index + 1], newEntries[index]];
		entries = newEntries.map((e, i) => ({ ...e, id: (i + 1).toString() }));
	}

	function updateEntryColumn(index: number, columnIndex: number, value: string) {
		// Ensure columns array exists and has enough elements
		if (!entries[index].columns) {
			entries[index].columns = [];
		}
		entries[index].columns[columnIndex] = value;
		entries = entries; // Trigger reactivity
	}

	function addColumnToEntry(index: number) {
		if (!entries[index].columns) {
			entries[index].columns = [];
		}
		entries[index].columns.push('');
		entries = entries;
	}

	function removeColumnFromEntry(index: number, columnIndex: number) {
		if (!entries[index].columns) return;
		entries[index].columns.splice(columnIndex, 1);
		entries = entries;
	}

	function saveTable() {
		if (!isValid) return;

		const now = new Date().toISOString();

		// Parse column headers from comma-separated string
		const parsedHeaders = columnHeaders.trim()
			? columnHeaders.split(',').map(h => h.trim()).filter(h => h.length > 0)
			: undefined;

		// Parse tags from comma-separated string
		const parsedTags = tags.trim()
			? tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
			: undefined;

		const tableData: RandomTable = {
			id: table?.id || generateId(),
			name: tableName.trim(),
			description: tableDescription.trim() || undefined,
			diceFormula: diceFormula.trim() || undefined,
			columnHeaders: parsedHeaders,
			tags: parsedTags,
			entries: entries,
			createdAt: table?.createdAt || now,
			updatedAt: now
		};

		if (table) {
			updateTable(tableData.id, tableData);
		} else {
			addTable(tableData);
		}

		onClose();
	}

	function handleKeyPress(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			addEntry();
		}
	}

	function parseCSV(csvText: string): string[][] {
		if (!csvText.trim()) return [];

		const lines = csvText.trim().split('\n');
		const results: string[][] = [];

		for (const line of lines) {
			// Simple CSV parsing - handles quoted fields
			const fields: string[] = [];
			let currentField = '';
			let inQuotes = false;

			for (let i = 0; i < line.length; i++) {
				const char = line[i];
				const nextChar = line[i + 1];

				if (char === '"') {
					if (inQuotes && nextChar === '"') {
						// Escaped quote
						currentField += '"';
						i++; // Skip next quote
					} else {
						inQuotes = !inQuotes;
					}
				} else if (char === ',' && !inQuotes) {
					fields.push(currentField.trim());
					currentField = '';
				} else {
					currentField += char;
				}
			}
			fields.push(currentField.trim());

			// Include all columns, filtering out completely empty rows
			if (fields.some(f => f.length > 0)) {
				results.push(fields);
			}
		}

		return results;
	}

	function previewCSV() {
		csvPreview = parseCSV(csvInput);
	}

	function importCSV(replace: boolean) {
		const newRows = parseCSV(csvInput);
		if (newRows.length === 0) return;

		let dataRows = newRows;

		// If first row is headers, extract them and use remaining rows as data
		if (csvFirstRowIsHeader && newRows.length > 0) {
			columnHeaders = newRows[0].join(', ');
			dataRows = newRows.slice(1);
		}

		if (replace) {
			entries = dataRows.map((columns, i) => ({
				id: (i + 1).toString(),
				columns
			}));
		} else {
			const startIndex = entries.length;
			const newEntries = dataRows.map((columns, i) => ({
				id: (startIndex + i + 1).toString(),
				columns
			}));
			entries = [...entries, ...newEntries];
		}

		csvInput = '';
		csvPreview = [];
		showCsvImport = false;
		csvFirstRowIsHeader = false;
	}

	function handleFileUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			csvInput = e.target?.result as string;
			previewCSV();
		};
		reader.readAsText(file);
	}
</script>

<div class="editor-overlay" on:click={onClose}>
	<div class="editor-modal" on:click|stopPropagation>
		<div class="editor-header">
			<h2>{table ? 'Edit Table' : 'Create New Table'}</h2>
			<button class="close-button" on:click={onClose}>✕</button>
		</div>

		<div class="editor-content">
			<div class="form-section">
				<div class="form-group">
					<label for="table-name">Table Name *</label>
					<input
						id="table-name"
						type="text"
						bind:value={tableName}
						placeholder="e.g., Treasure Types"
						autofocus
					/>
				</div>

				<div class="form-group">
					<label for="table-description">Description</label>
					<textarea
						id="table-description"
						bind:value={tableDescription}
						placeholder="Describe what this table is for..."
						rows="2"
					/>
				</div>

				<div class="form-group">
					<label for="dice-formula">Dice Formula (optional)</label>
					<input
						id="dice-formula"
						type="text"
						bind:value={diceFormula}
						placeholder="e.g., 1d20, 2d6, etc."
					/>
					<span class="hint">Leave empty for simple random selection</span>
				</div>

				<div class="form-group">
					<label for="column-headers">Column Headers (optional)</label>
					<input
						id="column-headers"
						type="text"
						bind:value={columnHeaders}
						placeholder="e.g., Item, Value, Rarity"
					/>
					<span class="hint">Comma-separated column names for multi-column tables</span>
				</div>

				<div class="form-group">
					<label for="tags">Tags (optional)</label>
					<input
						id="tags"
						type="text"
						bind:value={tags}
						placeholder="e.g., combat, treasure, NPC"
					/>
					<span class="hint">Comma-separated tags for organizing tables</span>
				</div>
			</div>

			<div class="entries-section">
				<div class="entries-header">
					<h3>Table Entries ({entries.length}) *</h3>
					<button class="import-toggle-button" on:click={() => (showCsvImport = !showCsvImport)}>
						{showCsvImport ? '✕ Close Import' : '📄 Import CSV'}
					</button>
				</div>

				{#if showCsvImport}
					<div class="csv-import-section">
						<h4>Import from CSV</h4>
						<p class="csv-hint">
							Paste CSV data or upload a file. Each row will become one table entry.
							Multiple columns will be preserved and displayed in the table.
						</p>

						<div class="csv-input-area">
							<textarea
								bind:value={csvInput}
								on:input={previewCSV}
								placeholder="Paste CSV data here, e.g.:&#10;Sword&#10;Shield&#10;Potion&#10;&#10;Or click 'Choose File' below..."
								rows="6"
							/>
							<div class="file-upload">
								<label for="csv-file-upload" class="file-upload-label">
									📁 Choose File
									<input
										id="csv-file-upload"
										type="file"
										accept=".csv,.txt"
										on:change={handleFileUpload}
										style="display: none;"
									/>
								</label>
							</div>
							<div class="csv-options">
								<label class="checkbox-label">
									<input
										type="checkbox"
										bind:checked={csvFirstRowIsHeader}
										on:change={previewCSV}
									/>
									<span>First row contains column headers</span>
								</label>
							</div>
						</div>

						{#if csvPreview.length > 0}
							<div class="csv-preview">
								{#if csvFirstRowIsHeader && csvPreview.length > 0}
									<h5>Headers</h5>
									<div class="preview-headers">
										<span class="preview-text">{csvPreview[0].join(' | ')}</span>
									</div>
									<h5>Preview ({csvPreview.length - 1} entries)</h5>
									<div class="preview-list">
										{#each csvPreview.slice(1, 11) as previewEntry, index}
											<div class="preview-item">
												<span class="preview-number">{index + 1}</span>
												<span class="preview-text">{previewEntry.join(' | ')}</span>
											</div>
										{/each}
										{#if csvPreview.length - 1 > 10}
											<p class="preview-more">...and {csvPreview.length - 11} more</p>
										{/if}
									</div>
								{:else}
									<h5>Preview ({csvPreview.length} entries)</h5>
									<div class="preview-list">
										{#each csvPreview.slice(0, 10) as previewEntry, index}
											<div class="preview-item">
												<span class="preview-number">{index + 1}</span>
												<span class="preview-text">{previewEntry.join(' | ')}</span>
											</div>
										{/each}
										{#if csvPreview.length > 10}
											<p class="preview-more">...and {csvPreview.length - 10} more</p>
										{/if}
									</div>
								{/if}
								<div class="csv-actions">
									<button class="csv-action-button" on:click={() => importCSV(true)}>
										Replace All Entries
									</button>
									<button class="csv-action-button append" on:click={() => importCSV(false)}>
										Append to Entries
									</button>
								</div>
							</div>
						{/if}
					</div>
				{/if}

				{#if entries.length > 0}
					<div class="entries-list">
						{#each entries as entry, index (entry.id)}
							<div class="entry-item-container">
								<div class="entry-header">
									<span class="entry-number">{index + 1}</span>
									<div class="entry-actions">
										<button
											class="icon-button"
											on:click={() => moveEntryUp(index)}
											disabled={index === 0}
											title="Move up"
										>
											▲
										</button>
										<button
											class="icon-button"
											on:click={() => moveEntryDown(index)}
											disabled={index === entries.length - 1}
											title="Move down"
										>
											▼
										</button>
										<button
											class="icon-button remove"
											on:click={() => removeEntry(index)}
											title="Remove entry"
										>
											✕
										</button>
									</div>
								</div>
								<div class="entry-columns">
									{#each entry.columns || [''] as column, columnIndex}
										<div class="column-input-group">
											<input
												type="text"
												class="entry-input"
												value={column}
												on:input={(e) => updateEntryColumn(index, columnIndex, e.currentTarget.value)}
												placeholder="Column {columnIndex + 1}"
											/>
											{#if entry.columns && entry.columns.length > 1}
												<button
													class="column-remove-button"
													on:click={() => removeColumnFromEntry(index, columnIndex)}
													title="Remove column"
												>
													✕
												</button>
											{/if}
										</div>
									{/each}
									<button
										class="add-column-button"
										on:click={() => addColumnToEntry(index)}
										title="Add column"
									>
										+ Add Column
									</button>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="empty-message">No entries yet. Add your first entry below.</p>
				{/if}

				<div class="add-entry-form">
					<input
						type="text"
						bind:value={newEntryValue}
						on:keypress={handleKeyPress}
						placeholder="Type a new entry and press Enter..."
						class="add-entry-input"
					/>
					<button class="add-entry-button" on:click={addEntry} disabled={!newEntryValue.trim()}>
						+ Add Entry
					</button>
				</div>
			</div>
		</div>

		<div class="editor-footer">
			<button class="cancel-button" on:click={onClose}>Cancel</button>
			<button class="save-button" on:click={saveTable} disabled={!isValid}>
				{table ? 'Save Changes' : 'Create Table'}
			</button>
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
		max-width: 900px;
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

	.form-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-weight: 500;
		color: var(--text);
	}

	.hint {
		font-size: 0.75rem;
		color: var(--text-secondary);
		font-style: italic;
	}

	.entries-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		gap: 1rem;
	}

	.entries-section h3 {
		margin: 0;
		font-size: 1.125rem;
		color: var(--text);
	}

	.import-toggle-button {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		color: var(--text);
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		min-height: 44px;
		cursor: pointer;
		white-space: nowrap;
	}

	.import-toggle-button:hover {
		background: var(--primary);
		border-color: var(--primary);
		color: white;
	}

	.csv-import-section {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 1rem;
	}

	.csv-import-section h4 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		color: var(--text);
	}

	.csv-hint {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin: 0 0 1rem 0;
		line-height: 1.5;
	}

	.csv-input-area {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.csv-input-area textarea {
		width: 100%;
		min-height: 120px;
		font-family: 'Courier New', monospace;
		font-size: 0.875rem;
	}

	.file-upload {
		display: flex;
		justify-content: flex-start;
	}

	.csv-options {
		margin-top: 0.75rem;
		padding: 0.75rem;
		background: var(--bg);
		border-radius: 0.25rem;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
		font-size: 0.875rem;
		color: var(--text);
	}

	.checkbox-label input[type="checkbox"] {
		cursor: pointer;
		width: 18px;
		height: 18px;
	}

	.checkbox-label span {
		user-select: none;
	}

	.file-upload-label {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		color: var(--text);
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		min-height: 44px;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.file-upload-label:hover {
		background: var(--primary);
		border-color: var(--primary);
		color: white;
	}

	.csv-preview {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		padding: 1rem;
	}

	.csv-preview h5 {
		margin: 0 0 0.75rem 0;
		font-size: 0.875rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.preview-headers {
		padding: 0.75rem;
		background: var(--primary);
		color: white;
		border-radius: 0.25rem;
		margin-bottom: 1rem;
		font-weight: 600;
		font-size: 0.875rem;
	}

	.preview-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 200px;
		overflow-y: auto;
		margin-bottom: 1rem;
	}

	.preview-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		background: var(--bg-secondary);
		border-radius: 0.25rem;
	}

	.preview-number {
		font-weight: 600;
		color: var(--primary);
		min-width: 2rem;
		text-align: center;
		font-family: 'Courier New', monospace;
		font-size: 0.875rem;
	}

	.preview-text {
		color: var(--text);
		font-size: 0.875rem;
	}

	.preview-more {
		font-size: 0.875rem;
		color: var(--text-secondary);
		font-style: italic;
		text-align: center;
		margin: 0.5rem 0 0 0;
	}

	.csv-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
		flex-wrap: wrap;
	}

	.csv-action-button {
		background: var(--danger);
		border: none;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		min-height: 44px;
		cursor: pointer;
	}

	.csv-action-button:hover {
		opacity: 0.9;
	}

	.csv-action-button.append {
		background: var(--primary);
	}

	.empty-message {
		color: var(--text-secondary);
		font-style: italic;
		padding: 1rem;
		text-align: center;
	}

	.entries-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
		max-height: 300px;
		overflow-y: auto;
		padding-right: 0.5rem;
	}

	.entry-item-container {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.entry-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
	}

	.entry-number {
		font-weight: 600;
		color: var(--primary);
		min-width: 2rem;
		text-align: center;
		font-family: 'Courier New', monospace;
	}

	.entry-columns {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding-left: 2.75rem;
	}

	.column-input-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.entry-input {
		flex: 1;
		background: var(--bg);
		border: 1px solid var(--border);
		color: var(--text);
		padding: 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
	}

	.entry-input:focus {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}

	.entry-actions {
		display: flex;
		gap: 0.25rem;
	}

	.icon-button {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		color: var(--text);
		padding: 0.375rem;
		min-width: 32px;
		min-height: 32px;
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 0.75rem;
	}

	.icon-button:hover:not(:disabled) {
		background: var(--primary);
		border-color: var(--primary);
		color: white;
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

	.column-remove-button {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		color: var(--danger);
		padding: 0.25rem 0.5rem;
		min-width: 28px;
		min-height: 28px;
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 0.75rem;
	}

	.column-remove-button:hover {
		background: var(--danger);
		border-color: var(--danger);
		color: white;
	}

	.add-column-button {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		color: var(--text);
		padding: 0.5rem 0.75rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		cursor: pointer;
		align-self: flex-start;
	}

	.add-column-button:hover {
		background: var(--primary);
		border-color: var(--primary);
		color: white;
	}

	.add-entry-form {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.add-entry-input {
		flex: 1;
		min-height: 44px;
	}

	.add-entry-button {
		background: var(--primary);
		border: none;
		color: white;
		padding: 0.75rem 1.25rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		min-height: 44px;
		cursor: pointer;
		white-space: nowrap;
	}

	.add-entry-button:hover:not(:disabled) {
		background: var(--primary-dark);
	}

	.add-entry-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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

	.save-button:hover:not(:disabled) {
		background: var(--primary-dark);
	}

	.save-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
