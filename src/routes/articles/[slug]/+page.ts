import { browser } from '$app/environment';

/**
 * Dynamically loads the svelte component for the post (only possible in +page.js)
 * and pass on the data from +page.server.js
 */
export async function load({ params, data }) {
	// TODO: persist browser storage. currently doesn't work due to ssr
	if (browser) {
		if (data.locals.l402.status !== 200) {
			setLocalStorage(params.slug, data.locals.l402.error.macaroon, data.locals.l402.error.invoice);
		}
	}

	// load the markdown file based on slug
	const component = data.post.isIndexFile
		? // vite requires relative paths and explicit file extensions for dynamic imports
		  // see https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations
		  await import(`../../../../posts/${data.post.slug}/index.md`)
		: await import(`../../../../posts/${data.post.slug}.md`);

	return {
		post: data.post,
		component: component.default,
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
	console.log('ローカルストレージ', slug, matches, document.cookie);
	return matches ? decodeURIComponent(matches[1]) : undefined;
}
