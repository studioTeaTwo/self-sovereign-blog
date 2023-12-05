import { CookieOptions } from '$lib/constants';
import { createInvoice, isValidL402token, isWaitingToPayInvoice, verify } from '$lib/l402';
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

			let result;
			try {
				result = await verify(r.macaroon, r.invoice, event.fetch);
				console.log('verify ', result);
			} catch (error) {
				console.error('verify failed: ', error);
				event.locals.l402 = {
					status: 500,
					isPaywall: true,
					error: {
						reason: error.message
					}
				};
				return await resolve(event);
			}

			if (result.status === 200) {
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
		let result;
		try {
			result = await createInvoice(event.fetch);
			console.log('new challenge ', result);
		} catch (error) {
			console.error('new challenge failed: ', error.message);
			event.locals.l402 = {
				status: 500,
				isPaywall: true,
				error: {
					reason: error.message
				}
			};
			return await resolve(event);
		}

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
