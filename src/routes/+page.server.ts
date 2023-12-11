import { postSummaries } from '$lib/stores/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		posts: postSummaries
	};
};
