import { posts } from '$lib/data/posts';

export async function load() {
	return {
		posts
	};
}
