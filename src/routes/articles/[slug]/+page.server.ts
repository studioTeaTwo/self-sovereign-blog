import { postContents, postSummaries } from '$lib/stores/posts';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { devToolsActions } from '$lib/devTools';

export const load: PageServerLoad = async ({ params }) => {
	const { slug } = params;

	// get post with metadata
	const post = postSummaries.find((post) => slug === post.slug);
	if (!post) {
		throw error(404, 'Post not found');
	}

	const html = post.paywall.hasPaywallContent
		? postContents[slug].l402html
		: postContents[slug].html;

	return {
		slug,
		post,
		html,
		layout: {
			fullWidth: true
		}
	};
};

export const actions = {
	...devToolsActions
};
