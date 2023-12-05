import { postContents, postSummaries } from '$lib/data/posts';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { devToolsActions } from '$lib/devTools';

export const load: PageServerLoad = async ({ params, locals }) => {
	console.log(params, locals);
	const { slug } = params;

	// get post with metadata
	const post = postSummaries.find((post) => slug === post.slug);
	if (!post) {
		throw error(404, 'Post not found');
	}

	const html = locals.l402.isPaywall ? postContents[slug].l402html : postContents[slug].html;

	const paywall = {
		status: locals.l402.status,
		isPaywall: locals.l402.status !== 200,
		invoice: locals.l402.error && locals.l402.error.invoice ? locals.l402.error.invoice : ''
	};

	return {
		slug,
		post,
		html: encodeURIComponent(html),
		paywall,
		locals
	};
};

export const actions = {
	...devToolsActions
};
