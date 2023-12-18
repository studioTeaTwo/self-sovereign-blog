// This works only in BROWSER side, using LocalStorage.

import { browser } from '$app/environment';
import type { AuthInProcess } from '$lib/type';

// Temporary data storage during authentication/authorization.
// Can share with the server.
export const authInProcess = {
	get: () => {
		if (!browser) {
			return [];
		}

		const data = localStorage.getItem('authInProcess');
		if (!data) {
			return [];
		}
		const vals: AuthInProcess[] = JSON.parse(data);
		return vals;
	},
	getMacaroon: (slug: string) => {
		if (!browser) {
			return '';
		}

		const data = localStorage.getItem('authInProcess');
		if (!data) {
			return '';
		}
		const vals: AuthInProcess[] = JSON.parse(data);
		const found = vals.find((val) => val.slug === slug);
		return found ? found.macaroon : '';
	},
	set: (newval: AuthInProcess) => {
		if (!browser) {
			return;
		}

		const prev = localStorage.getItem('authInProcess');
		if (prev) {
			const parsed: AuthInProcess[] = JSON.parse(prev);
			const idx = parsed.findIndex((data) => data.slug === newval.slug);
			if (idx > 0) {
				parsed[idx] = newval;
			} else {
				parsed.push(newval);
			}

			localStorage.setItem('authInProcess', JSON.stringify(parsed));
		} else {
			localStorage.setItem('authInProcess', JSON.stringify([newval]));
		}
	}
};
