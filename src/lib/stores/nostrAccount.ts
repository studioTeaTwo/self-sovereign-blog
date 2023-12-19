// This works only in BROWSER side, using LocalStorage.

import { browser } from '$app/environment';
import type { PurchaseHistory } from '$lib/type';

// Do not save in the cookies or share with the server.
const nseckey = {
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
	set: (newval: string) => {
		if (browser) {
			localStorage.setItem('nseckey', newval);
		}
	}
};

const isNip07 = {
	get: () => {
		if (browser) {
			const data = localStorage.getItem('isNip07');
			if (!data) {
				return false;
			}
			return JSON.parse(data);
		}
		return false;
	},
	set: (newval: boolean) => {
		if (browser) {
			localStorage.setItem('isNip07', JSON.stringify(newval));
		}
	}
};

// Can share with the server.
const npubkey = {
	get: () => {
		if (browser) {
			const data = localStorage.getItem('npubkey');
			if (!data) {
				return '';
			}
			return data;
		}
		return '';
	},
	set: (newval: string) => {
		if (browser) {
			localStorage.setItem('npubkey', newval);
		}
	}
};

// Can share with the server.
const purchaseHistory = {
	get: () => {
		if (browser) {
			const data = localStorage.getItem('purchaseHistory');
			if (!data) {
				return [];
			}
			const vals: PurchaseHistory[] = JSON.parse(data);
			return vals;
		}
		return [];
	},
	set: (newval: PurchaseHistory[]) => {
		if (browser) {
			const prev = localStorage.getItem('purchaseHistory');
			const val = prev ? [...JSON.parse(prev), ...newval] : newval;
			localStorage.setItem('purchaseHistory', JSON.stringify(val));
		}
	}
};

export const nostrAccount = { nseckey, npubkey, isNip07, purchaseHistory };
