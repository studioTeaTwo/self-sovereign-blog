import { RelayList } from '$lib/constants';

export const prerender = true;

export async function GET({ setHeaders }) {
	setHeaders({
		'Content-Type': 'application/json'
	});

	// ref: https://github.com/nostr-protocol/nips/blob/master/05.md
	const json = {
		names: {
			_: '30a9eb5a28636b85e4688097a0b6f595b953c3b664fb1b9d56baf13f9c8c31a2',
			webmaster: '30a9eb5a28636b85e4688097a0b6f595b953c3b664fb1b9d56baf13f9c8c31a2'
		},
		relays: {
			'30a9eb5a28636b85e4688097a0b6f595b953c3b664fb1b9d56baf13f9c8c31a2': RelayList
		}
	};

	return new Response(JSON.stringify(json));
}
