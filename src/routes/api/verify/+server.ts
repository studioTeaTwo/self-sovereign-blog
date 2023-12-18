import { json } from '@sveltejs/kit';
import { verify } from '$lib/l402';
import { postContents } from '$lib/stores/posts';
import type { SsrApiResponse } from '$lib/type';

// API to access paywalled content on the server side.
// This is called in the following cases:
// 1. WebLN payment
// 2. Receiving Nostr's DM
// 3. purchased history in LocalStorage
// HttpStatus 500 keeps current PaywallStatus because request self failed.
export async function POST({ request, fetch }) {
	const { slug } = await request.json();
	const authorization = request.headers.get('Authorization');

	console.log('api verify', slug, authorization);

	try {
		const result = await verify(authorization, fetch);
		if (result.status !== 200) {
			// TODO: server data may clear the data such as restarting.
			const response: SsrApiResponse = { status: 'NEED_VERIFIED', reason: result.reason };
			return json(response, { status: result.status });
		}
	} catch (error) {
		console.error('verify failed: ', error);
		const response: SsrApiResponse = { status: 'NEED_VERIFIED', reason: error.message };
		return json(response, { status: 402 });
	}

	const response: SsrApiResponse = {
		status: 'VERIFIED_OR_NON_PAYWALLCONTENT',
		html: encodeURIComponent(postContents[slug].html)
	};
	return json(response, { status: 200 });
}
