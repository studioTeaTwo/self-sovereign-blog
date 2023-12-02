import { posts } from '$lib/data/posts';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { devToolsActions } from '$lib/devTools';

export const load: PageServerLoad = async ({ params, locals }) => {
	console.log(params, locals);
	const { slug } = params;

	// get post with metadata
	const post = posts.find((post) => slug === post.slug);
	if (!post) {
		throw error(404, 'Post not found');
	}

	// load the markdown file based on slug
	const md = post.isIndexFile
		? // vite requires relative paths and explicit file extensions for dynamic imports
		  // see https://github.com/rollup/plugins/tree/master/packages/dynamic-import-vars#limitations
		  await import(`../../../../posts/${post.slug}/index.md`)
		: await import(`../../../../posts/${post.slug}.md`);
	let html = md.default.render().html;

	// hide the content wrapped with L402
	if (locals.l402.isPaywall) {
		html = eraceL402Content(html);
	}

	return {
		post,
		html: encodeURIComponent(html),
		locals
	};
};

export const actions = devToolsActions;

function eraceL402Content(html: string) {
	// TODO: make symbol&parse of l402 more practical
	const resut = html.substring(0, html.indexOf('<hr id="l402" hidden>'));
	return resut;
}
