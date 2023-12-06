import { browser } from '$app/environment';

/**
 * Dynamically loads the svelte component for the post (only possible in +page.js)
 * and pass on the data from +page.server.js
 */
export async function load({ data }) {
	const { html, locals } = data;

	if (browser) {
		if (locals.l402.status === 402) {
			// TODO: persist to browser storage.
		}
	}

	return {
		...data,
		html: decodeURIComponent(html),
		layout: {
			fullWidth: true
		}
	};
}
