<script>
	import qrcode from 'qrcode';
	import { dev } from '$app/environment';

	export let data;

	/** @param {MouseEvent} event */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function handleClickInvoice(event) {
		navigator.clipboard.writeText(data.paywall.invoice);
		alert(`copied. ${data.paywall.invoice}`);
	}
</script>

<article class="post">
	<header>
		<h1 class="header-title">{data.post.title}</h1>
		<div class="header-date">
			<span>{data.post.date}</span>・<span>{data.post.readingTime}</span>
		</div>
	</header>

	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	<div class="post-content">{@html data.html}</div>

	{#if data.paywall.isPaywall}
		<div class="paywall">
			<hr />
			<div>PayWall</div>
			{#if data.paywall.status === 402}
				<div>
					<button type="button" class="paywall-invoice-qr" on:click={handleClickInvoice}>
						{#await qrcode.toDataURL(data.paywall.invoice) then value}
							<img src={value} alt="Invoice qr code" />
						{/await}
					</button>
				</div>
				<div class="paywall-invoice-text">{data.paywall.invoice}</div>

				{#if dev}
					<div class="devtools">
						<div>devtools</div>
						<form method="POST" action="?/devToolsPreimage">
							<input type="text" name="preimage" placeholder="preimage: f66836..." />
							<button>regist</button>
						</form>
					</div>
				{/if}
			{:else}
				<p>Sorry, somethig wrong...</p>
			{/if}
		</div>
	{/if}
</article>

<style>
	:global(.post img) {
		max-width: 100%;
		height: auto;
	}
	article {
		min-width: 90vw;
		inline-size: 90vw;
		@media screen and (min-width: 1024px) {
			min-width: 40vw;
			inline-size: 40vw;
		}
	}
	header,
	.paywall {
		width: inherit;
	}
	h1.header-title,
	.header-date {
		text-align: center;
	}
	.header-date {
		font-size: 0.8rem;
	}
	.paywall {
		text-align: center;
	}
	.paywall-invoice-qr {
		border: transparent;
		background-color: transparent;
	}
	.paywall-invoice-text {
		font-size: 0.8rem;
		overflow-wrap: break-word;
	}
	.devtools {
		color: red;
		border: 1px solid red;
		margin: 1rem;
		padding: 1rem;
	}
</style>
