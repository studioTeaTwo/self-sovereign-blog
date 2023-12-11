import NDKSvelte from '@nostr-dev-kit/ndk-svelte';
import NDKCacheAdapterDexie from '@nostr-dev-kit/ndk-cache-dexie';
import { nip19 } from 'nostr-tools';
import { RelayList, ServiceNPubKey, ServiceName } from '$lib/constants';

const dexieAdapter = new NDKCacheAdapterDexie({ dbName: ServiceName });

export const ndk = new NDKSvelte({
	explicitRelayUrls: RelayList,
	cacheAdapter: dexieAdapter
});

export const servicePubkey = nip19.decode(ServiceNPubKey).data as string;
export const servicer = ndk.getUser({ pubkey: servicePubkey });
