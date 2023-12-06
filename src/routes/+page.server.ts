import { postSummaries } from '$lib/data/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		posts: postSummaries
	};
};
