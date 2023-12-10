// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			l402: {
				status: number; // expected [200 | 402 | 500]
				isPaywall: boolean; // true other than 200
				error?: {
					reason: string;
					macaroon?: string;
					invoice?: string;
				};
			};
		}
		// interface PageData {}
		// interface Platform {}
	}

	interface Window {
		webln: object;
	}
}

export {};
