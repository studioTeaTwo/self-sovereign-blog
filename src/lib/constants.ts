import { dev } from '$app/environment';
import { PUBLIC_BLOG_SERVER, PUBLIC_L402_SERVER, PUBLIC_SERVICE_NPUBKEY } from '$env/static/public';
import type { CookieSerializeOptions } from 'cookie';

// Blog author
export const Title = 'Self-Sovereign Blog';
export const Author = 'TeaTwo';
export const BitcoinDonationAddress = 'bc1q8pmsy0xfrkpr3vky9kw5kjmqrm0fsg70q963dg';
export const LightningDonationAddress = 'teatwo@getalby.com';

// L402
export const SiteUrl = dev ? 'http://localhost:5137' : PUBLIC_BLOG_SERVER;
export const RepositoryUrl = 'https://github.com/studioTeaTwo/self-sovereign-blog';
export const L402server = dev ? 'http://localhost:8180' : PUBLIC_L402_SERVER;

// Nostr
// These must match https://github.com/studioTeaTwo/simple-l402-server
export const RelayList = [
	'wss://relayable.org',
	'wss://relay.damus.io',
	'wss://relay.snort.social',
	'wss://relay.primal.net',
	'wss://yabu.me',
	'wss://r.kojira.io'
];
export const ServiceName = 'SelfSovereignBlog';
export const ServiceNPubKey = PUBLIC_SERVICE_NPUBKEY;

// Other
export const CookieOptions: CookieSerializeOptions = { path: '/', maxAge: 2592000 };
