import { browser } from '$app/environment';

/**
 * Dynamically loads the svelte component for the post (only possible in +page.js)
 * and pass on the data from +page.server.js
 */
export async function load({ data }) {
	const { post, html, locals } = data;

	if (browser) {
		if (locals.l402.status === 402) {
			// TODO: persist to browser storage.
		}
	}

	const paywall = {
		status: locals.l402.status,
		isPaywall: locals.l402.status !== 200,
		invoice: locals.l402.error && locals.l402.error.invoice ? locals.l402.error.invoice : ''
	};

	return {
		post,
		html: decodeURIComponent(html),
		paywall,
		layout: {
			fullWidth: true
		}
	};
}
