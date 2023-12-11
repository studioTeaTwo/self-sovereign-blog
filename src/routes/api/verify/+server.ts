import { json } from '@sveltejs/kit';
import { CookieOptions } from '$lib/constants';
import { verify } from '$lib/l402';
import { postContents } from '$lib/stores/posts';
import type { SsrApiResponse } from '$lib/type';

// This is called in the following cases:
// 1. WebLN payment
// 2. Receiving Nostr's DM
// 3. purchased history in LocalStorage
export async function POST({ request, cookies, fetch }) {
	const { slug, preimage } = await request.json();
	console.log('api verify', slug, preimage, cookies.get(slug));

	try {
		// There may be cases where it has been deleted.
		const cookie = JSON.parse(cookies.get(slug));

		const result = await verify(cookie.macaroon, preimage, fetch);
		if (result.status !== 200) {
			// TODO: server data may clear the data such as restarting.
			const response: SsrApiResponse = { status: 'NEED_VERIFIED', reason: result.reason };
			return json(response, { status: result.status });
		}

		cookie.preimage = preimage;
		cookie.count++;
		cookies.set(slug, JSON.stringify(cookie), CookieOptions);
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
