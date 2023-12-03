<script>
	import qrcode from 'qrcode';
	import { dev } from '$app/environment';
	import { PUBLIC_DEVTOOLS_ON } from '$env/static/public';
	import LockIcon from 'svelte-material-icons/Lock.svelte';
	import { Title } from '$lib/constants';

	export let data;

	/** @param {MouseEvent} event */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	function handleClickInvoice(event) {
		navigator.clipboard.writeText(data.paywall.invoice);
		alert(`copied. ${data.paywall.invoice}`);
	}
</script>

<svelte:head>
	<title>{data.post.title} | {Title}</title>
	<meta name="description" content="" />
</svelte:head>

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
			<div class="paywall-title"><LockIcon size={'3rem'} /></div>
			{#if data.paywall.status === 402}
				<div>
					<button type="button" class="paywall-invoice-qr" on:click={handleClickInvoice}>
						{#await qrcode.toDataURL(data.paywall.invoice) then value}
							<img src={value} alt="Invoice qr code" />
						{/await}
					</button>
				</div>
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<div class="paywall-invoice-text" on:click={handleClickInvoice}>{data.paywall.invoice}</div>

				{#if dev || PUBLIC_DEVTOOLS_ON}
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
	.header-title {
		font-size: 2rem;
	}
	.header-date {
		font-size: 0.8rem;
	}
	.paywall {
		text-align: center;
		margin: 2rem 0;
		padding: 1.5rem;
		background-color: silver;
		filter: drop-shadow(0 1rem 0.75rem black);
	}
	.paywall-title {
		margin-bottom: 1rem;
	}
	.paywall-invoice-qr {
		cursor: pointer;
		border: transparent;
		background-color: transparent;
		filter: drop-shadow(1px 3px 5px rgba(0, 0, 0, 0.2));
	}
	.paywall-invoice-text {
		color: black;
		font-size: 0.8rem;
		cursor: pointer;
		padding: 0 5rem 1rem;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}
	.devtools {
		color: red;
		border: 1px solid red;
		margin: 1rem;
		padding: 1rem;
	}
</style>
