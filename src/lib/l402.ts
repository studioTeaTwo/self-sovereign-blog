import { decode } from 'bolt11';
import { L402server } from './constants';
import type { L402ApiResponse, PaywallStatus } from './type';
import { authInProcess } from './stores/l402';

type fetch = typeof fetch;

// This is called on mounting component or on inputten Nostr seckey or NIP-07.
// Authenticate & Authroize L402.
// HttpStatus 500 keeps current PaywallStatus because request self failed.
export async function excuteChallenge(
	slug: string,
	price: number,
	nPubkey: string,
	relayList: string[]
): Promise<{ status: PaywallStatus; invoice?: string; macaroon?: string; reason?: string }> {
	const purchaseHistory = authInProcess.get();
	const data = purchaseHistory.find((data) => data.slug === slug);

	// have data in process
	if (data) {
		console.log('still in challenge ');
		return { status: 'NEED_PAYMENT', invoice: data.invoice, macaroon: data.macaroon };
	}

	// new challenge
	let result;
	try {
		result = await createInvoice(slug, price, nPubkey, relayList);
		console.log('new challenge ', result);
	} catch (error) {
		console.error('new challenge failed: ', error.message);
		return { status: 'NEED_INVOICE', reason: error.message };
	}

	authInProcess.set({ slug, price, invoice: result.invoice, macaroon: result.macaroon });

	return { status: 'NEED_PAYMENT', invoice: result.invoice, macaroon: result.macaroon };
}

// Call to L402server
export async function createInvoice(
	slug: string,
	price: number,
	nPubkey: string,
	relayList: string[]
) {
	if (slug === '' || price === 0 || nPubkey === '') {
		throw new Error('required parameters is missing');
	}

	const res = await fetch(`${L402server}/newchallenge`, {
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
	return getAuthenticationToken(challenge);
}

// Call to L402server
// @param authorization - `L402 ${macaroon}:${preimage}`
export async function verify(authorization: string, fetch: fetch) {
	const authroizaiton = { Authorization: authorization };
	const res = await fetch(`${L402server}/verify`, {
		headers: authroizaiton
	});
	const body: L402ApiResponse = await res.json();
	return {
		status: res.status,
		...body
	};
}

// Parse Authorization header
export function isValidL402token(headers: Request['headers']) {
	const authorization = headers.get('Authorization');
	if (authorization == null) {
		return false;
	}

	const { macaroon, preimage } = getAuthorizationToken(authorization);
	if (!macaroon || !preimage) {
		return false;
	}
	return true;
}

// Parse Authentication
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

// @param challenge - "L402 macaroon=X invoice=Y"
function getAuthenticationToken(challenge: string) {
	const tokens = challenge.split(' ');
	const macaroon = tokens[1].replace('macaroon=', '');
	const invoice = tokens[2].replace('invoice=', '');
	return {
		macaroon,
		invoice
	};
}

// @param header - `L402 ${macaroon}:${preimage}`
function getAuthorizationToken(header: string) {
	const matched = header.match(/L402 (.*?):([a-f0-9]{64})/);
	return { macaroon: matched[1], preimage: matched[2] };
}
