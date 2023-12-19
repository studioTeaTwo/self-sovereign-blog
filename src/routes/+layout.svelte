<script>
	import {
		Title,
		RepositoryUrl,
		BitcoinDonationAddress,
		LightningDonationAddress
	} from '$lib/constants';
	import { base } from '$app/paths';
	import GithubLogo from '$lib/assets/GitHub-Mark-32px.png';
	import BitcoinDonation from '$lib/assets/Bitcoin_Donation.png';
	import RssIcon from 'svelte-material-icons/Rss.svelte';

	let dialog;

	/** @param {MouseEvent} event */
	function handleClickBitcoin(event) {
		event.preventDefault();
		navigator.clipboard.writeText(BitcoinDonationAddress);
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
</script>

<header>
	<h1><a href={`${base}/`}>{Title}</a></h1>
</header>

<main>
	<slot />
</main>

<footer>
	<p class="macguffin">"Think rich, look poor."</p>
	<div><a href="/rss.xml" target="”_blank”"><RssIcon size={'3rem'} /></a></div>
	<div>
		<a href={RepositoryUrl} target="”_blank”"><img alt="Github logo" src={GithubLogo} /></a>
	</div>
	<div>
		<button type="button" class="bitcoin-donation" on:click={handleClickBitcoin}
			><img alt="Donation" src={BitcoinDonation} width="32" /></button
		>
	</div>
</footer>

<dialog bind:this={dialog}>
	<div class="donation">
		<div class="donation-close">
			<button on:click={handleClickClose}>x</button>
		</div>
		<p>Thank you for your love!</p>
		<div class="donation-address-qr"><img alt="Donation" src={BitcoinDonation} /></div>
		<div class="donation-address-text"><span>{BitcoinDonationAddress}</span></div>
		<div class="donation-address-text"><span>{LightningDonationAddress}</span></div>
	</div>
</dialog>

<style>
	:global(html, body) {
		min-height: 100vh;
		margin: 0;
		padding: 0;
	}
	:global(body) {
		font-family: 'Roboto', sans-serif;
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 100vh;
	}
	:global(a) {
		text-decoration: none;
		color: inherit;
	}
	header {
		margin: 1rem;
	}
	main {
		flex-grow: 1;
	}
	footer {
		position: sticky;
		top: 100vh;

		display: flex;
		align-items: center;
		justify-content: center;
		column-gap: 16px;
		margin-top: auto;
	}
	.bitcoin-donation {
		border: transparent;
		background-color: transparent;
		cursor: pointer;
	}
	.donation {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.donation-close {
		margin-left: auto;
	}
	.donation-address-text,
	.macguffin {
		font-size: 0.8rem;
		font-weight: bold;
		margin-bottom: 1rem;
	}
</style>
