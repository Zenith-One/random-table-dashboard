<script>
	import '../app.css';
</script>

<div class="app">
	<header>
		<div class="container">
			<nav>
				<h1>🎲 TTRPG Random Tables</h1>
				<div class="nav-links">
					<a href="./">Dashboards</a>
					<a href="./tables">All Tables</a>
				</div>
			</nav>
		</div>
	</header>

	<main>
		<slot />
	</main>

	<footer>
		<div class="container">
			<p class="attribution">
				Dice icons made by <a href="https://game-icons.net" target="_blank" rel="noopener noreferrer">Skoll & Delapouite</a> from <a href="https://game-icons.net" target="_blank" rel="noopener noreferrer">game-icons.net</a>
			</p>
		</div>
	</footer>
</div>

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	header {
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border);
	}

	nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}

	nav h1 {
		margin: 0;
		font-size: 1.5rem;
	}

	.nav-links {
		display: flex;
		gap: 1rem;
	}

	.nav-links a {
		color: var(--text-secondary);
		text-decoration: none;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		transition: all 0.2s;
		/* Better touch targets */
		min-height: 44px;
		display: flex;
		align-items: center;
	}

	.nav-links a:hover {
		background: var(--bg-tertiary);
		color: var(--text);
	}

	main {
		flex: 1;
	}

	footer {
		background: var(--bg-secondary);
		border-top: 1px solid var(--border);
	}

	.attribution {
		font-size: 0.875rem;
		color: var(--text-secondary);
		text-align: center;
		margin: 0;
	}

	.attribution a {
		color: var(--primary);
		text-decoration: none;
	}

	.attribution a:hover {
		text-decoration: underline;
	}
</style>
