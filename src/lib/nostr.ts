import { getPublicKey, nip19 } from 'nostr-tools';
import {
	NDKPrivateKeySigner,
	NDKNip07Signer,
	type NDKFilter,
	type NDKEvent,
	type NDKUser
} from '@nostr-dev-kit/ndk';

import { nostrAccount } from './stores/nostrAccount';
import { ndk, servicePubkey } from './stores/ndk';
import type { PurchaseHistory } from './type';
import { browser } from '$app/environment';

// These shouldn't be used without Nostr account
// and shouldn't work in the server side.

// Subscribe NIP-04
export async function subscribeFeed(nPubkey: string) {
	if (!browser) {
		return;
	}

	const userPubkey = nip19.decode(nPubkey).data as string;
	const filter: NDKFilter = {
		kinds: [4],
		authors: [servicePubkey],
		'#p': [userPubkey]
		// '#L': ['#l402'] ,
		// '#l': [ServiceName, '#l402']
		// '#L': ['l402token'] ,
		// '#l': [EncryptedMacaroon, 'l402token']
	};

	setSigner();

	await ndk.connect();
	const subscription = ndk.subscribe(filter);
	await subscription.start();

	return subscription;
}

export async function getRelayList(nPubkey: string) {
	if (!browser) {
		return;
	}
	const pubkey = nip19.decode(nPubkey).data as string;
	const relay = await ndk.getUser({ pubkey }).relayList();
	return relay.readRelayUrls;
}

export function getPubkeyFromNSeckey(nseckey: string) {
	const matched = nseckey.match(/nsec1\w+/);
	if (!matched) {
		throw Error(`nSeckey is incorrect: ${nseckey}`);
	}

	// encode nPubKey
	const { data } = nip19.decode(nseckey);
	const pk = getPublicKey(data as string);
	return nip19.npubEncode(pk);
}

export async function normalize(event: NDKEvent, servicer: NDKUser) {
	if (!browser) {
		return;
	}

	await event.decrypt(servicer);
	const plaintext = event.content;
	if (!plaintext || plaintext == '') {
		return;
	}

	const macaroon = await getMacaroon(event, servicer);

	const newval: PurchaseHistory = {
		...parseText(plaintext),
		macaroon,
		eventId: event.id,
		createdAt: event.created_at
	};

	// Save in localstorage
	const prev = nostrAccount.purchaseHistory.get();
	const found = prev.filter((data) => data.preimage === newval.preimage);
	if (found.length === 0) {
		nostrAccount.purchaseHistory.set([newval]);
	} else {
		// If there are duplicates, register if it is the latest one.
		found.sort((a, b) => (a.createdAt > b.createdAt ? 0 : 1));
		if (newval.createdAt > found[0].createdAt) {
			nostrAccount.purchaseHistory.set([newval]);
		}
	}

	return newval;
}

function setSigner() {
	const isNip07 = nostrAccount.isNip07.get();
	if (isNip07) {
		ndk.signer = new NDKNip07Signer();
	} else {
		const nsk = nostrAccount.nseckey.get();
		const sk = nip19.decode(nsk).data as string;
		ndk.signer = new NDKPrivateKeySigner(sk);
	}
}

function getMacaroon(event: NDKEvent, servicer: NDKUser) {
	// e.g. ['l', 'aaagekkc', 'l402token']
	const token = event.tags
		.filter((value) => value.length === 3 && value[2] === 'l402token')
		.map((value) => value[1]);
	return ndk.signer.decrypt(servicer, token[0]);
}

// ref: https://github.com/studioTeaTwo/aperture/tree/studioteatwo/nostr
// 		n.servicename +
// 		" article=" + p.Slug +
// 		" settleDate=" + time.Unix(p.Invoice.GetSettleDate(), 0).Format("2006-01-02 15:04:05") +
// 		" price=" + strconv.FormatInt(p.Price*1000, 10) +
// 		" paidAmount=" + strconv.FormatInt(p.Invoice.GetAmtPaidMsat(), 10) +
// 		" preimage=" + preimage.String() +
// 		" paymentHash=" + paymentHash.String()
function parseText(msg: string) {
	const array = msg.split(' ');
	const slug = array.find((v) => v.includes('article=')).replace('article=', '');
	const price = parseInt(array.find((v) => v.includes('price=')).replace('price=', ''), 10);
	const paidAmount = parseInt(
		array.find((v) => v.includes('paidAmount=')).replace('paidAmount=', ''),
		10
	);
	const purchasedDate = array.find((v) => v.includes('settleDate=')).replace('settleDate=', '');
	const preimage = array.find((v) => v.includes('preimage=')).replace('preimage=', '');
	return {
		slug,
		price,
		paidAmount,
		purchasedDate,
		preimage
	};
}
