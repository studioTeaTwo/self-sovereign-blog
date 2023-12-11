import { decode } from 'bolt11';
import { L402server } from './constants';
import type { L402ApiResponse, PaywallStatus } from './type';

type fetch = typeof fetch;

export async function createInvoice(
	slug: string,
	price: number,
	nPubkey: string,
	relayList: string[],
	fetch: fetch
) {
	if (slug === '' || price === 0 || nPubkey === '') {
		throw new Error('required parameters is missing');
	}

	const res = await fetch(`${L402server}/createInvoice`, {
		method: 'POST',
		body: JSON.stringify({ slug, nPubkey, relayList, price }),
		headers: {
			'Content-Type': 'application/json'
		}
	});
	const body: L402ApiResponse = await res.json();
	if (body.reason !== '') {
		throw new Error(body.reason);
	}

	const challenge = res.headers.get('WWW-Authenticate');
	console.log('header', challenge);
	return getToken(challenge);
}

export async function verify(macaroon: string, preimage: string, fetch: fetch) {
	// TODO: replace "LSAT" to "L402"
	const authroizaiton = { Authorization: `LSAT ${macaroon}:${preimage}` };
	const res = await fetch(`${L402server}/verify`, {
		headers: authroizaiton
	});
	const body: L402ApiResponse = await res.json();
	return {
		status: res.status,
		...body
	};
}

// Parse cookie
export function isValidL402token(record) {
	if (record == null) {
		return false;
	}
	const r = JSON.parse(record);
	if (!r.macaroon || !r.preimage) {
		return false;
	}
	return true;
}

// Parse cookie
export function isWaitingToPayInvoice(record) {
	if (record == null) {
		return false;
	}
	const r = JSON.parse(record);
	if (!r.macaroon || !r.invoice) {
		return false;
	}

	const invoice = decode(r.invoice);
	if (invoice.timeExpireDate * 1000 < Date.now()) {
		return false;
	}

	return true;
}

export function getStatus(
	hasL402Content: boolean,
	nostrSeckey: string,
	invoice: string,
	preimage: string,
	isVerified: boolean
): PaywallStatus {
	if (!hasL402Content) {
		return 'VERIFIED_OR_NON_PAYWALLCONTENT';
	}

	if (!nostrSeckey || nostrSeckey == '') {
		return 'NEED_NOSTR';
	}

	if (!invoice || invoice == '') {
		return 'NEED_INVOICE';
	}

	if (!preimage || preimage == '') {
		return 'NEED_PAYMENT';
	}

	if (!isVerified) {
		return 'NEED_VERIFIED';
	}

	return 'VERIFIED_OR_NON_PAYWALLCONTENT';
}

// @challenge "L402 macaroon=X invoice=Y"
function getToken(challenge: string) {
	const tokens = challenge.split(' ');
	const macaroon = tokens[1].replace('macaroon=', '');
	const invoice = tokens[2].replace('invoice=', '');
	return {
		macaroon,
		invoice
	};
}
