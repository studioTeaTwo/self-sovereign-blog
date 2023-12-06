import { dev } from '$app/environment';
import type { CookieSerializeOptions } from 'cookie';

export const Title = 'Self Sovereign Blog';
export const SiteUrl = dev ? 'http://localhost:5137' : 'https://self-sovereign-blog.vercel.app';
export const RepositoryUrl = 'https://github.com/studioTeaTwo/self-sovereign-blog';
export const L402server = dev ? 'http://localhost:8180' : 'https://l402.api.teatwo.dev';
export const BitcoinDonationAddress = 'bc1q8pmsy0xfrkpr3vky9kw5kjmqrm0fsg70q963dg';

export const CookieOptions: CookieSerializeOptions = { path: '/', maxAge: 2592000 };
