<script lang="ts">
	import { onMount } from 'svelte';
	import { DoubleBounce } from 'svelte-loading-spinners';
	import LockIcon from 'svelte-material-icons/Lock.svelte';
	import qrcode from 'qrcode';
	import { getPublicKey, nip19 } from 'nostr-tools';

	import { dev } from '$app/environment';
	import { PUBLIC_DEVTOOLS_ON } from '$env/static/public';
	import { Author, SiteUrl, Title } from '$lib/constants';
	import { displayDate } from '$lib/utils';
	import { openPayment } from '$lib/webln';
	import { npubkey, nseckey } from '$lib/data/nostr';
	import type { PaywallStatus, SsrApiResponse } from '$lib/type';

	export let data;

	const DEVTOOLS_ON = PUBLIC_DEVTOOLS_ON === 'true';
	const url = `${SiteUrl}/articles/${data.post.slug}`;

	let dialog;
	let isLoading = true;
	let nPubkey = '';
	let invoice = '';
	let status: PaywallStatus = 'NEED_NOSTR';

	onMount(() => {
		challenge();
	});

	async function challenge() {
		nPubkey = npubkey.get();
		if (nPubkey === '') {
			return;
		}

		isLoading = true;

		try {
			const res = await fetch('/api/mint', {
				method: 'POST',
				body: JSON.stringify({ slug: data.slug, nPubkey, price: data.post.paywall.price }),
				headers: {
					'Content-Type': 'application/json'
				}
			});
			const result: SsrApiResponse = await res.json();
			status = result.status;
			if (result.invoice && result.invoice !== '') {
				invoice = result.invoice;
			}
			if (result.html && result.html !== '') {
				data.html = decodeURIComponent(result.html);
			}
		} catch (err) {
			console.error(err);
		}

		isLoading = false;
	}

	/** @param {MouseEvent} event */
	async function handleClickWallet(event) {
		event.preventDefault();

		if (!('webln' in window && window.webln)) {
			// Open dialog for Naitve wallet
			window.open(`lightning:${invoice}`);
			return;
		}

		// WebLN
		const preimage = await openPayment(invoice);
		if (!!preimage) {
			const res = await fetch('/api/verify', {
				method: 'POST',
				body: JSON.stringify({ slug: data.slug, preimage }),
				headers: {
					'Content-Type': 'application/json'
				}
			});
			const result: SsrApiResponse = await res.json();
			status = result.status;
			if (result.invoice && result.invoice !== '') {
				invoice = result.invoice;
			}
			if (result.html && result.html !== '') {
				data.html = decodeURIComponent(result.html);
			}
		}
	}

	/** @param {MouseEvent} event */
	function handleClickInvoice(event) {
		event.preventDefault();
		navigator.clipboard.writeText(invoice);
		dialog.showModal();
		// close if clicked outside the modal
		dialog.addEventListener('click', function (event) {
			if (event.target === dialog) {
				dialog.close();
			}
		});
	}

	/** @param {MouseEvent} event */
	function handleClickClose(event) {
		event.preventDefault();
		dialog.close();
	}

	/** @param {MouseEvent} event */
	async function handleClickNip07(event) {
		event.preventDefault();
		if (window.nostr) {
			try {
				const pk = await window.nostr.getPublicKey();
				const npub = nip19.npubEncode(pk);

				setNPubkey(npub, '');
				challenge();
			} catch (err) {
				console.error(err);
				alert(`Maybe you rejected once? Please reload.`);
			}
		}
	}

	/** @param {MouseEvent} event */
	function handleClickNostrSeckey(event) {
		event.preventDefault();
		const elm: HTMLInputElement = document.querySelector('input[name="nostrSeckey"]');
		try {
			const value = elm.value;
			const matched = value.match(/nsec1\w+/);
			if (!matched) {
				throw Error(`nSeckey is incorrect: ${value}`);
			}

			// encode npPubKey
			const { data } = nip19.decode(value);
			const pk = getPublicKey(data as string);
			const npub = nip19.npubEncode(pk);

			setNPubkey(value, npub);
			challenge();
		} catch (err) {
			console.error(err);
		}
	}

	$: setNPubkey = (nostrPubkey, nostrSeckey) => {
		nPubkey = nostrPubkey;
		nseckey.set(nostrSeckey);
		npubkey.set(nostrPubkey);
	};
</script>

<svelte:head>
	<title>{data.post.title} | {Title}</title>
	<meta name="description" content={data.post.preview.text} />
	<meta name="author" content={Author} />

	<!-- Facebook Meta Tags -->
	<meta property="og:url" content={url} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={data.post.title} />
	<meta property="og:description" content={data.post.preview.text} />
	<!-- <meta property="og:image" content={ogImage} /> -->

	<!-- Twitter Meta Tags -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta property="twitter:domain" content={SiteUrl} />
	<meta property="twitter:url" content={url} />
	<meta name="twitter:title" content={data.post.title} />
	<meta name="twitter:description" content={data.post.preview.text} />
	<!-- <meta name="twitter:image" content={ogImage} /> -->
</svelte:head>

<article class="post">
	<header>
		<h1 class="header-title">{data.post.title}</h1>
		<div class="header-date">
			<span>{displayDate(data.post.date)}</span>・<span>{data.post.readingTime}</span>
		</div>
	</header>

	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	<div class="post-content">{@html data.html}</div>

	{#if status !== 'VERIFIED_OR_NON_PAYWALLCONTENT'}
		<div class="paywall">
			<div class="paywall-title"><LockIcon size={'3rem'} /></div>
			<div class="paywall-wordcount">{data.post.paywall.wordCount} characters</div>

			{#if nPubkey === ''}
				<div>
					<input type="text" name="nostrSeckey" placeholder="nsec123..." />
					<button type="button" on:click={handleClickNostrSeckey}>input</button>
					<button type="button" on:click={handleClickNip07}>NIP-07</button>
					<div class="paywall-nostr-description">
						<p class="paywall-nostr-description-text">
							We use LightningNetwork for paywalled content. First, log in to Nostr. Please pay the
							LightningNetwork invoice after that. Nostr is used for the settlement synchronization
							which passes the preimage after paying the invoice. nsecKey is only stored locally and
							doesn't share with server.
						</p>
					</div>
				</div>
			{:else if invoice !== ''}
				<div>
					<button type="button" class="paywall-invoice-qr" on:click={handleClickInvoice}>
						{#await qrcode.toDataURL(invoice) then value}
							<img src={value} alt="Invoice qr code" />
						{/await}
					</button>
				</div>
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<div class="paywall-invoice-text" on:click={handleClickInvoice}>
					{invoice}
				</div>

				{#if !DEVTOOLS_ON}
					<div>
						<button type="button" class="paywall-wallet" on:click={handleClickWallet}>
							Open Wallet
						</button>
					</div>
				{/if}

				{#if dev || DEVTOOLS_ON}
					<div class="devtools">
						<div>devtools</div>
						<form method="POST" action="?/devToolsPreimage">
							<input type="text" name="preimage" placeholder="preimage: f66836..." />
							<button>regist</button>
						</form>
					</div>
				{/if}
			{:else if isLoading}
				<div class="paywall-loading">
					<DoubleBounce size="60" unit="px" duration="1s" />
				</div>
			{:else}
				<p>Sorry, somethig wrong...</p>
			{/if}
		</div>
	{/if}
</article>

<dialog bind:this={dialog}>
	<div class="donation">
		<div class="donation-close">
			<button on:click={handleClickClose}>x</button>
		</div>
		<p>Copied.</p>
		<div class="donation-address-text"><p>{invoice}</p></div>
	</div>
</dialog>

<style>
	:global(.post img) {
		max-width: 100%;
		height: auto;
	}
	:global(.post code) {
		background-color: ghostwhite;
		font-size: 0.9rem;
		border-radius: 0.4rem;
		padding: 0.2rem 0.5rem;
	}
	:global(.post pre) {
		font-size: 0.875rem;
		font-weight: 500;
		background-color: ghostwhite;
		border-radius: 1.5rem;
		padding: 2rem;
		overflow-x: auto;
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
	.donation {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.donation-close {
		margin-left: auto;
	}
	.donation-address-text {
		width: 80vw;
		overflow-wrap: anywhere;
	}
	.paywall {
		text-align: center;
		margin: 2rem 0;
		padding: 1.5rem 0;
		background-color: silver;
		filter: drop-shadow(0 1rem 0.75rem black);
	}
	.paywall-title {
		margin-bottom: 0.5rem;
	}
	.paywall-wordcount {
		font-size: 0.8rem;
		padding-bottom: 1rem;
	}
	.paywall-nostr-description {
		max-width: 300px;
		margin: 0 auto;
	}
	.paywall-nostr-description-text {
		font-size: 0.8rem;
		text-align: left;
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
	.paywall-loading {
		display: flex;
		justify-content: center;
	}
	.devtools {
		color: red;
		border: 1px solid red;
		margin: 1rem;
		padding: 1rem;
	}
</style>
