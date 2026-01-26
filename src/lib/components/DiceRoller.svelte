<script lang="ts">
	export let value: number = 1;
	export let isRolling: boolean = false;
	export let size: number = 60;

	// Map numbers to dice faces for d6
	const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

	$: displayValue = value <= 6 ? diceFaces[value - 1] : value.toString();
</script>

<div class="dice-container" style="--size: {size}px;">
	<div class="dice" class:rolling={isRolling}>
		<div class="dice-face">
			{displayValue}
		</div>
	</div>
</div>

<style>
	.dice-container {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		perspective: 1000px;
	}

	.dice {
		width: var(--size);
		height: var(--size);
		position: relative;
		transform-style: preserve-3d;
		transition: transform 0.1s;
	}

	.dice.rolling {
		animation: roll 0.6s ease-out;
	}

	@keyframes roll {
		0% {
			transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
		}
		25% {
			transform: rotateX(180deg) rotateY(180deg) rotateZ(90deg);
		}
		50% {
			transform: rotateX(360deg) rotateY(360deg) rotateZ(180deg);
		}
		75% {
			transform: rotateX(540deg) rotateY(180deg) rotateZ(270deg);
		}
		100% {
			transform: rotateX(720deg) rotateY(360deg) rotateZ(360deg);
		}
	}

	.dice-face {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
		border-radius: 12px;
		font-size: calc(var(--size) * 0.6);
		color: white;
		font-weight: bold;
		box-shadow:
			0 4px 8px rgba(0, 0, 0, 0.3),
			inset 0 2px 4px rgba(255, 255, 255, 0.2),
			inset 0 -2px 4px rgba(0, 0, 0, 0.2);
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
	}
</style>
