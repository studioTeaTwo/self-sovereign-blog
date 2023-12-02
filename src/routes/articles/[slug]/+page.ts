import { browser } from '$app/environment';

/**
 * Dynamically loads the svelte component for the post (only possible in +page.js)
 * and pass on the data from +page.server.js
 */
export async function load({ params, data }) {
	const { post, html, locals } = data;

	// TODO: persist browser storage. currently doesn't work due to ssr
	if (browser) {
		if (locals.l402.status === 402) {
			setLocalStorage(params.slug, locals.l402.error.macaroon, locals.l402.error.invoice);
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

// assume only when returning StatusPaymentRequired
function setLocalStorage(slug: string, macaroon: string, invoice: string) {
	const record = getCookie(slug);
	if (!record) {
		localStorage.setItem(slug, JSON.stringify({ macaroon, invoice, preimage: null, count: 1 }));
	} else {
		const r = JSON.parse(record);
		const _invoice = r.invoice != null && invoice == null ? r.invoice : invoice;
		localStorage.setItem(
			slug,
			JSON.stringify({ macaroon, invoice: _invoice, preimage: null, count: r.count++ })
		);
	}
}

function getCookie(slug: string) {
	const matches = document.cookie.match(
		new RegExp('(?:^|; )' + slug.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)')
	);
	console.log('write localStorage', slug, matches, document.cookie);
	return matches ? decodeURIComponent(matches[1]) : undefined;
}
