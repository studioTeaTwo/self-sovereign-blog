import { CookieOptions, L402server } from '$lib/constants';
import type { Cookies, Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Authenticate & Authroize L402
	if (
		event.url.pathname.includes('/articles/') &&
		!event.url.href.includes('?/') // exclude form action
	) {
		const slug = event.params.slug;
		console.log('challenge', event.url.href, event.cookies.get(slug));
		const record = event.cookies.get(slug);

		// have preimage
		if (isValidL402token(record)) {
			const r = JSON.parse(record);

			let res;
			try {
				const authroizaiton = { Authorization: `LSAT ${r.macaroon}:${r.preimage}` };
				res = await event.fetch(`${L402server}/verify`, {
					headers: authroizaiton
				});
			} catch (error) {
				console.error('verify failed: ',error)
				event.locals.l402 = {
					status: 500,
					isPaywall: true,
					error: {
						reason: error.message
					}
				};
				return await resolve(event);
			}

			const result = await res.json();
			console.log('verify ', result);

			setCookie(event.cookies, slug, r.macaroon, r.invoice, r.preimage);

			if (res.status === 200) {
				// respond complete article
				event.locals.l402 = { status: 200, isPaywall: false };
				return await resolve(event);
			} else {
				// TODO: respond the case of failure reasons(expiried,etc.)
			}
			// have invoice
		} else if (isWaitingToPayInvoice(record)) {
			console.log('still in challenge ');
			const r = JSON.parse(record);

			event.locals.l402 = {
				status: 402,
				isPaywall: true,
				error: {
					reason: 'still in challenge',
					macaroon: r.macaroon,
					invoice: r.invoice
				}
			};
			return await resolve(event);
		}

		// new challenge
		let res;
		try {
			res = await event.fetch(`${L402server}/createInvoice`);
		} catch (error) {
			console.error('new challenge failed: ',error)
			event.locals.l402 = {
				status: 500,
				isPaywall: true,
				error: {
					reason: error.message
				}
			};
			return await resolve(event);
		}

		const result = await res.json();
		console.log('new challenge ', result);

		setCookie(event.cookies, slug, result.macaroon, result.invoice, null);

		event.locals.l402 = {
			status: 402,
			isPaywall: true,
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
