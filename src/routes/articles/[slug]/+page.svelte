<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { DoubleBounce } from 'svelte-loading-spinners';
	import LockIcon from 'svelte-material-icons/Lock.svelte';
	import qrcode from 'qrcode';
	import { nip19 } from 'nostr-tools';
	import type { NDKSubscription } from '@nostr-dev-kit/ndk';

	import { dev } from '$app/environment';
	import { PUBLIC_DEVTOOLS_ON } from '$env/static/public';
	import { Author, SiteUrl, Title } from '$lib/constants';
	import { displayDate } from '$lib/utils';
	import { openPayment } from '$lib/webln';
	import { nostrAccount } from '$lib/stores/nostrAccount';
	import type { PaywallStatus, SsrApiResponse } from '$lib/type';
	import { getPubkeyFromNSeckey, getUserRelayList, normalize, subscribeFeed } from '$lib/nostr';
	import { ndk, servicer } from '$lib/stores/ndk';
	import { excuteChallenge as executeChallenge } from '$lib/l402.js';
	import { authInProcess } from '$lib/stores/l402.js';

	export let data;

	const DEVTOOLS_ON = PUBLIC_DEVTOOLS_ON === 'true';
	const url = `${SiteUrl}/articles/${data.post.slug}`;

	let dialog;
	let isLoading = false;
	let nPubkey = nostrAccount.npubkey.get();
	let invoice = '';
	let status: PaywallStatus = nPubkey === '' ? 'NEED_NOSTR' : 'NEED_INVOICE';
	let subscription: NDKSubscription;

	onMount(async () => {
		if (!data.post.paywall.hasPaywallContent) {
			return;
		}
		// put here to fix mobile browser
		await ndk.connect();
		// already purchased
		const purchaseHistory = nostrAccount.purchaseHistory.get();
		const found = purchaseHistory.find((val) => val.slug === data.slug);
		if (!!found && !!found.preimage && !!found.macaroon) {
			await verify(found.preimage, found.macaroon);
			return;
		}
		// new challenge & still in challenge
		await challenge();
	});
	onDestroy(() => {
		if (subscription) {
			subscription.stop();
		}
	});

	async function challenge() {
		nPubkey = nostrAccount.npubkey.get();
		if (nPubkey === '') {
			return;
		}

		try {
			isLoading = true;

			const relayList = await getUserRelayList(nPubkey);
			const result = await executeChallenge(data.slug, data.post.paywall.price, nPubkey, relayList);
			status = result.status;
			if (result.invoice) {
				invoice = result.invoice;
			}

			// Wait to be payed invoice
			await subscribeNostr();
		} catch (error) {
			console.error(error);
		} finally {
			// in case of nested blocks
			isLoading = false;
		}
	}

	async function verify(preimage: string, macaroon: string) {
		try {
			isLoading = true;

			const res = await fetch('/api/verify', {
				method: 'POST',
				body: JSON.stringify({ slug: data.slug }),
				headers: {
					'Content-Type': 'application/json',
					Authorization: `L402 ${macaroon}:${preimage}`
				}
			});
			const result: SsrApiResponse = await res.json();
			status = result.status;
			if (result.html && result.html !== '') {
				data.html = decodeURIComponent(result.html);
			}
		} catch (error) {
			status = 'NEED_VERIFIED';
		} finally {
			// in case of nested blocks
			isLoading = false;
		}
	}

	async function subscribeNostr() {
		subscription = await subscribeFeed(nPubkey);
		subscription.on('event', async (event) => {
			// recieved invoice settlement
			console.log("recieved nostr's DM ", event);
			try {
				const value = await normalize(event, servicer);
				console.log("normalized nostr's DM ", value);
				if (value.slug === data.slug) {
					await verify(value.preimage, value.macaroon);
				}
			} catch (error) {
				console.error(error);
				alert(error.message);
			} finally {
				// in case of nested blocks
				isLoading = false;
			}
		});
	}

	async function handleClickWallet() {
		if (!('webln' in window && window.webln)) {
			// Open dialog for Naitve wallet
			window.open(`lightning:${invoice}`);
			return;
		}

		// WebLN
		const preimage = await openPayment(invoice);
		if (preimage) {
			const macaroon = authInProcess.getMacaroon(data.slug);
			await verify(preimage, macaroon);
		}
	}

	function handleClickInvoice() {
		navigator.clipboard.writeText(invoice);
		dialog.showModal();
		// close if clicked outside the modal
		dialog.addEventListener('click', function (event) {
			if (event.target === dialog) {
				dialog.close();
			}
		});
	}

	function handleClickClose() {
		dialog.close();
	}

	async function handleClickNip07() {
		if (window.nostr) {
			try {
				const pk = await window.nostr.getPublicKey();
				const npub = nip19.npubEncode(pk);

				setNPubkey(npub, '', true);
				await challenge();
			} catch (error) {
				console.error(error);
				alert(error.message);
			} finally {
				// in case of nested blocks
				isLoading = false;
			}
		}
	}

	async function handleClickNostrSeckey() {
		const elm: HTMLInputElement = document.querySelector('input[name="nostrSeckey"]');
		try {
			const npub = getPubkeyFromNSeckey(elm.value);
			setNPubkey(npub, elm.value, false);
			await challenge();
		} catch (error) {
			console.error(error);
			alert(error.message);
		} finally {
			// in case of nested blocks
			isLoading = false;
		}
	}

	$: setNPubkey = (nostrPubkey: string, nostrSeckey: string, isNip07: boolean) => {
		nPubkey = nostrPubkey;
		nostrAccount.nseckey.set(nostrSeckey);
		nostrAccount.npubkey.set(nostrPubkey);
		nostrAccount.isNip07.set(isNip07);
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
	<meta name="twitter:card" content="summary" />
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

	{#if data.post.paywall.hasPaywallContent && status !== 'VERIFIED_OR_NON_PAYWALLCONTENT'}
		<div class="paywall">
			<div class="paywall-title"><LockIcon size={'3rem'} /></div>
			<div class="paywall-wordcount">{data.post.paywall.wordCount} characters</div>

			{#if isLoading}
				<div class="paywall-loading">
					<DoubleBounce size="60" unit="px" duration="1s" />
				</div>
			{:else if status === 'NEED_NOSTR'}
				<div>
					<input type="text" name="nostrSeckey" placeholder="nsec123..." />
					<button type="button" on:click={handleClickNostrSeckey}>input</button>
					<button type="button" on:click={handleClickNip07}>NIP-07</button>
					<div class="paywall-nostr-description">
						<p class="paywall-nostr-description-text">
							We use LightningNetwork to purchase the paywalled content. First, log in to Nostr,
							then pay your LightningNetwork invoice. Nostr is used to synchronize the payment
							proof, which is a preimage of the invoice, via a direct message by NIP-04 after
							payment. Your Nostr secret key is only stored locally and doesn't share with server.
							With NIP-07, you don't even need a private key.
						</p>
					</div>
				</div>
			{:else if status === 'NEED_PAYMENT'}
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
			{:else if status === 'NEED_INVOICE'}
				<p>Failed to issue a invoice. Please try again after.</p>
			{:else if status === 'NEED_VERIFIED'}
				<p>Failed to verify the payment. Please try again after, or please inquiry.</p>
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
	:global(.post img, .post video) {
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
	:global(.post p > a) {
		text-decoration-line: underline;
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
		color: snow;
		padding-bottom: 1rem;
		@media screen and (min-width: 1024px) {
			font-size: 0.8rem;
		}
	}
	.paywall-nostr-description {
		max-width: 300px;
		margin: 0 auto;
	}
	.paywall-nostr-description-text {
		color: snow;
		text-align: left;
		@media screen and (min-width: 1024px) {
			font-size: 0.8rem;
		}
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
