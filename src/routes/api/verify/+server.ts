import { json } from '@sveltejs/kit';
import { CookieOptions } from '$lib/constants';
import { verify } from '$lib/l402';
import { postContents } from '$lib/stores/posts';
import type { L402Cookie, SsrApiResponse } from '$lib/type';

// This is called in the following cases:
// 1. WebLN payment
// 2. Receiving Nostr's DM
// 3. purchased history in LocalStorage
export async function POST({ request, cookies, fetch }) {
	const { slug, preimage, macaroon } = await request.json();
	const cookie = cookies.get(slug);

	console.log('api verify', slug, preimage, macaroon, cookies.get(slug));

	let mac = macaroon;
	// cookie may be cases where it has been deleted.
	if (!macaroon && !!cookie) {
		const c = JSON.parse(cookie);
		mac = c.macaroon;
	}

	try {
		const result = await verify(mac, preimage, fetch);
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

	// Update cookie
	if (cookie) {
		const c = JSON.parse(cookies.get(slug));
		c.preimage = preimage;
		c.count++;
		cookies.set(slug, JSON.stringify(c), CookieOptions);
	} else {
		const newval: L402Cookie = { macaroon: mac, invoice: '', preimage, count: 1 };
		cookies.set(slug, JSON.stringify(newval), CookieOptions);
	}

	const response: SsrApiResponse = {
		status: 'VERIFIED_OR_NON_PAYWALLCONTENT',
		html: encodeURIComponent(postContents[slug].html)
	};
	return json(response, { status: 200 });
}
