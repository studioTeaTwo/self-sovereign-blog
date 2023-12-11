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
		// https://gist.github.com/syusui-s/cd5482ddfc83792b54a756759acbda55
		nostr: {
			/** returns a public key as hex */
			getPublicKey(): Promise<string>;
			/** takes an event object, adds `id`, `pubkey` and `sig` and returns it */
			signEvent(event: NostrEvent): Promise<NostrEvent>;

			// Optional

			/** returns a basic map of relay urls to relay policies */
			getRelays?(): Promise<{ [url: string]: { read: boolean; write: boolean } }>;

			/** NIP-04: Encrypted Direct Messages */
			nip04?: {
				/** returns ciphertext and iv as specified in nip-04 */
				encrypt(pubkey: string, plaintext: string): Promise<string>;
				/** takes ciphertext and iv as specified in nip-04 */
				decrypt(pubkey: string, ciphertext: string): Promise<string>;
			};
		};
	}
}

export {};
