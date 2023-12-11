import { CookieOptions } from '$lib/constants';
import { postContents } from '$lib/stores/posts';
import { createInvoice, isValidL402token, isWaitingToPayInvoice, verify } from '$lib/l402';
import type { L402Cookie, SsrApiResponse } from '$lib/type';
import { json, type Cookies } from '@sveltejs/kit';

// This is called on mounting component or on inputten Nostr seckey or NIP-07.
// Authenticate & Authroize L402.
// HttpStatus 500 keeps current PaywallStatus because request self failed.
export async function POST({ request, cookies, fetch }) {
	const { slug, nPubkey, relayList, price } = await request.json();
	console.log('challenge', request.url, cookies.get(slug));
	const record = cookies.get(slug);

	// have preimage
	if (isValidL402token(record)) {
		const r = JSON.parse(record);

		let result;
		try {
			result = await verify(r.macaroon, r.preimage, fetch);
			console.log('verify ', result);
			if (result.status !== 200) {
				// TODO: server data may clear the data such as restarting.
				const response: SsrApiResponse = { status: 'NEED_VERIFIED', reason: result.reason };
				return json(response, { status: result.status });
			}
		} catch (error) {
			console.error('verify failed: ', error);
			const response: SsrApiResponse = { status: 'NEED_VERIFIED', reason: error.message };
			return json(response, { status: 500 });
		}

		// respond complete article
		const response: SsrApiResponse = {
			status: 'VERIFIED_OR_NON_PAYWALLCONTENT',
			html: encodeURIComponent(postContents[slug].html)
		};
		return json(response, { status: 200 });

		// have invoice
	} else if (isWaitingToPayInvoice(record)) {
		console.log('still in challenge ');
		const r = JSON.parse(record);
		const response: SsrApiResponse = { status: 'NEED_PAYMENT', invoice: r.invoice };
		return json(response, { status: 402 });
	}

	// new challenge
	let result;
	try {
		result = await createInvoice(slug, price, nPubkey, relayList, fetch);
		console.log('new challenge ', result);
	} catch (error) {
		console.error('new challenge failed: ', error.message);
		const response: SsrApiResponse = { status: 'NEED_INVOICE', reason: error.message };
		return json(response, { status: 500 });
	}

	setCookie(cookies, slug, result.macaroon, result.invoice, null);

	const response: SsrApiResponse = { status: 'NEED_PAYMENT', invoice: result.invoice };
	return json(response, { status: 402 });
}

function setCookie(
	cookies: Cookies,
	slug: string,
	macaroon: string,
	invoice: string,
	preimage: string
) {
	const record = cookies.get(slug);
	if (!record) {
		const cookie: L402Cookie = { macaroon, invoice, preimage, count: 1 };
		cookies.set(slug, JSON.stringify(cookie), CookieOptions);
	} else {
		const r = JSON.parse(record);
		const cookie: L402Cookie = { macaroon, invoice, preimage, count: r.count++ };
		cookies.set(slug, JSON.stringify(cookie), CookieOptions);
	}
}
