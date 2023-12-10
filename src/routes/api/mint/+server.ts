import { CookieOptions } from '$lib/constants';
import { postContents } from '$lib/data/posts';
import { createInvoice, isValidL402token, isWaitingToPayInvoice, verify } from '$lib/l402';
import type { SsrApiResponse } from '$lib/type';
import { json, type Cookies } from '@sveltejs/kit';

// This is called on mounting component or on inputten Nostr seckey or on received Nostr DM
// Authenticate & Authroize L402
// HttpStatus 500 keeps current PaywallStatus because request self failed.
export async function POST({ request, cookies, fetch }) {
	const { slug, nPubkey, price } = await request.json();
	console.log(request);
	console.log('challenge', request.url.href, cookies.get(slug));
	const record = cookies.get(slug);

	// have preimage
	if (isValidL402token(record)) {
		const r = JSON.parse(record);

		let result;
		try {
			result = await verify(r.macaroon, r.preimage, fetch);
			console.log('verify ', result);
		} catch (error) {
			console.error('verify failed: ', error);
			const response: SsrApiResponse = { status: 'NEED_VERIFIED', reason: error.message };
			return json(response, { status: 500 });
		}

		if (result.status === 200) {
			// respond complete article
			const response: SsrApiResponse = {
				status: 'VERIFIED_OR_NON_PAYWALLCONTENT',
				html: encodeURIComponent(postContents[slug].html)
			};
			return json(response, { status: 200 });
		} else {
			// TODO: respond the case of failure reasons(expiried,etc.)
		}

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
		result = await createInvoice(slug, price, nPubkey, fetch);
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
		cookies.set(slug, JSON.stringify({ macaroon, invoice, preimage, count: 1 }), CookieOptions);
	} else {
		const r = JSON.parse(record);
		cookies.set(
			slug,
			JSON.stringify({ macaroon, invoice, preimage, count: r.count++ }),
			CookieOptions
		);
	}
}
