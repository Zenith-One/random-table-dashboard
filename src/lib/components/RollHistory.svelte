<script lang="ts">
	import { rollHistory, clearRollHistory } from '$lib/stores';
	import type { RollHistoryEntry } from '$lib/types';

	let history: RollHistoryEntry[] = [];
	let isCollapsed = false;

	rollHistory.subscribe(h => {
		history = h;
	});

	function toggleCollapse() {
		isCollapsed = !isCollapsed;
	}

	function formatTime(timestamp: string): string {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);

		if (diffMins < 1) return 'Just now';
		if (diffMins === 1) return '1 minute ago';
		if (diffMins < 60) return `${diffMins} minutes ago`;

		const diffHours = Math.floor(diffMins / 60);
		if (diffHours === 1) return '1 hour ago';
		if (diffHours < 24) return `${diffHours} hours ago`;

		return date.toLocaleDateString();
	}

	function handleClearHistory() {
		if (!confirm('Clear all roll history?')) return;
		clearRollHistory();
	}
</script>

<div class="roll-history" class:collapsed={isCollapsed}>
	<div class="history-header">
		<h3>Roll History</h3>
		<div class="header-actions">
			{#if history.length > 0 && !isCollapsed}
				<button class="clear-button" on:click={handleClearHistory}>
					Clear
				</button>
			{/if}
			<button class="collapse-button" on:click={toggleCollapse} title={isCollapsed ? 'Expand' : 'Collapse'}>
				{isCollapsed ? '▶' : '▼'}
			</button>
		</div>
	</div>

	{#if !isCollapsed}
		{#if history.length === 0}
			<div class="empty-history">
				<p>No rolls yet. Roll on a table to see history here!</p>
			</div>
		{:else}
			<div class="history-list">
				{#each history as entry (entry.id)}
					<div class="history-entry">
						<div class="entry-header">
							<span class="table-name">{entry.tableName}</span>
							<span class="timestamp">{formatTime(entry.timestamp)}</span>
						</div>
						<div class="entry-result">
							{#if entry.roll > 0}
								<span class="roll-number">{entry.roll}</span>
							{/if}
							<span class="result-text">{entry.columns.join(' | ')}</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.roll-history {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 0.75rem;
		padding: 1.5rem;
		max-height: 600px;
		display: flex;
		flex-direction: column;
		transition: padding 0.2s;
	}

	.roll-history.collapsed {
		padding: 0.75rem 1rem;
		max-height: none;
	}

	.history-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--border);
	}

	.collapsed .history-header {
		margin-bottom: 0;
		padding-bottom: 0;
		border-bottom: none;
	}

	.history-header h3 {
		margin: 0;
		font-size: 1.125rem;
		color: var(--text);
	}

	.collapsed .history-header h3 {
		font-size: 1rem;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.clear-button {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--text-secondary);
		padding: 0.375rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.8125rem;
		cursor: pointer;
		transition: all 0.2s;
		min-height: 40px;
	}

	.clear-button:hover {
		background: var(--danger);
		border-color: var(--danger);
		color: white;
	}

	.collapse-button {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--text-secondary);
		padding: 0.5rem;
		min-width: 40px;
		min-height: 40px;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.2s;
		flex-shrink: 0;
	}

	.collapse-button:hover {
		background: var(--bg-tertiary);
		color: var(--text);
		border-color: var(--primary);
	}

	.empty-history {
		text-align: center;
		padding: 2rem 1rem;
		color: var(--text-secondary);
		font-size: 0.875rem;
	}

	.empty-history p {
		margin: 0;
	}

	.history-list {
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.history-entry {
		background: var(--bg-tertiary);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		padding: 0.75rem;
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.history-entry:hover {
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.entry-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
		gap: 0.5rem;
	}

	.table-name {
		font-weight: 600;
		color: var(--text);
		font-size: 0.875rem;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.timestamp {
		color: var(--text-secondary);
		font-size: 0.75rem;
		white-space: nowrap;
	}

	.entry-result {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.roll-number {
		background: var(--primary);
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-weight: 600;
		font-size: 0.875rem;
		font-family: 'Courier New', monospace;
	}

	.result-text {
		color: var(--text);
		font-size: 0.875rem;
		line-height: 1.4;
	}

	@media print {
		.roll-history {
			display: none;
		}
	}
</style>
