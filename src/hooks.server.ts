import { L402server } from '$lib/constants';
import type { Cookies, Handle } from '@sveltejs/kit';
import type { CookieSerializeOptions } from 'cookie';

export const handle: Handle = async ({ event, resolve }) => {
	// Authenticate & Authroize L402
	if (event.url.pathname.includes('/articles/')) {
		const slug = event.params.slug;
		console.log('challenge', event.url.href, event.cookies.get(slug));
		const record = event.cookies.get(slug);
		// have preimage
		if (isValidL402token(record)) {
			const r = JSON.parse(record);
			const authroizaiton = { Authroization: `L402 ${r.macaroon}:${r.preimage}` };
			const res = await event.fetch(`${L402server}/verify`, {
				headers: authroizaiton
			});
			const result = await res.json();
			console.log('verify ', result);

			setCookie(event.cookies, slug, result.macaroon, result.invoice, null);

			if (res.status === 200) {
				// respond complete article
				event.locals.l402 = { status: 200 };
				return await resolve(event);
			} else {
				// TODO: respond the case of failure reason
			}
			// have invoice
		} else if (isWaitingToPayInvoice(record)) {
			console.log('still in challenge ');
			const r = JSON.parse(record);

			event.locals.l402 = {
				status: 402,
				error: {
					reason: 'still in challenge',
					macaroon: r.macaroon,
					invoice: r.invoice
				}
			};
			return await resolve(event);
		}
		// new challenge
		const res = await event.fetch(`${L402server}/createInvoice`);
		const result = await res.json();
		console.log('new challenge ', result);

		setCookie(event.cookies, slug, result.macaroon, result.invoice, null);

		event.locals.l402 = {
			status: 402,
			error: {
				reason: 'new challenge',
				macaroon: result.macaroon,
				invoice: result.invoice
			}
		};
	}

	return await resolve(event);
};

function isValidL402token(record) {
	if (record == null) {
		return false;
	}
	const r = JSON.parse(record);
	if (!r.macaroon || !r.preimage) {
		return false;
	}
	return true;
}

function isWaitingToPayInvoice(record) {
	if (record == null) {
		return false;
	}
	const r = JSON.parse(record);
	if (!r.macaroon || !r.invoice) {
		return false;
	}
	return true;
}

function setCookie(
	cookies: Cookies,
	slug: string,
	macaroon: string,
	invoice: string,
	preimage: string
) {
	const option: CookieSerializeOptions = { maxAge: 2592000 };

	const record = cookies.get(slug);
	if (!record) {
		cookies.set(slug, JSON.stringify({ macaroon, invoice, preimage, count: 1 }), option);
	} else {
		const r = JSON.parse(record);
		const _invoice = r.invoice != null && invoice == null ? r.invoice : invoice;
		const _preimage = r.preimage != null && preimage == null ? r.preimage : preimage;
		cookies.set(
			slug,
			JSON.stringify({ macaroon, invoice: _invoice, preimage: _preimage, count: r.count++ }, option)
		);
	}
}
