import { dev } from '$app/environment';
import type { CookieSerializeOptions } from 'cookie';

export const Title = 'Self Sovereign Blog';
export const RepositoryUrl = 'https://github.com/studioTeaTwo/self-sovereign-blog';
export const L402server = dev ? 'http://localhost:8180' : 'http://localhost:8180';
export const BitcoinDonationAddress = 'bc1q8pmsy0xfrkpr3vky9kw5kjmqrm0fsg70q963dg';

export const CookieOptions: CookieSerializeOptions = { path: '/', maxAge: 2592000 };
