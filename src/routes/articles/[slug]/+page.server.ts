import { posts } from '$lib/data/posts';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	console.log(params, locals);
	const { slug } = params;

	// get post with metadata
	const post = posts.find((post) => slug === post.slug);

	if (!post) {
		throw error(404, 'Post not found');
	}

	return {
		post,
		locals
	};
};
