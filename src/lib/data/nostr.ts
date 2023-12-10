// This works only in BROWSER side

import { browser } from '$app/environment';

// Do not save in the cookies or share with the server.
export const nseckey = {
	get: () => {
		if (browser) {
			const data = localStorage.getItem('nseckey');
			if (!data) {
				return '';
			}
			return data;
		}
		return '';
	},
	set: (newval) => {
		if (browser) {
			localStorage.setItem('nseckey', newval);
		}
	}
};

// Can share with the server.
export const npubkey = {
	get: () => {
		if (browser) {
			const data = localStorage.getItem('npubkey');
			if (!data) {
				return '';
			}
			return data;
		}
	},
	set: (newval) => {
		if (browser) {
			localStorage.setItem('npubkey', newval);
		}
	}
};

// Can share with the server.
export const dmfeed = {
	get: () => {
		if (browser) {
			const data = localStorage.getItem('dmfeed');
			if (!data) {
				return [];
			}
			return data;
		}
		return [];
	},
	set: (newval) => {
		if (browser) {
			localStorage.setItem('dmfeed', newval);
		}
	}
};
