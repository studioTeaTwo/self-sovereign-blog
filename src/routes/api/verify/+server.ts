import { json } from '@sveltejs/kit';
import { CookieOptions } from '$lib/constants';
import { verify } from '$lib/l402';
import { postContents } from '$lib/data/posts';

export async function POST({ request, cookies, fetch }) {
	const { slug, preimage } = await request.json();
	console.log('api verify', slug, preimage, cookies.get(slug));
	const cookie = JSON.parse(cookies.get(slug));

	try {
		const result = await verify(cookie.macaroon, preimage, fetch);
		if (result.status !== 200) {
			return json({ reason: result.reason }, { status: result.status });
		}
	} catch (error) {
		console.error('verify failed: ', error);
		return json({ reason: error.message }, { status: 402 });
	}

	cookie.preimage = preimage;
	cookie.count++;
	cookies.set(slug, JSON.stringify(cookie), CookieOptions);

	return json({ html: encodeURIComponent(postContents[slug].html) }, { status: 200 });
}
